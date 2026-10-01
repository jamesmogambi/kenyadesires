import type {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from 'mysql2/promise';
import { getAllIndexNowUrls } from '@/lib/indexnow/get-urls';
import type { IndexingAction } from '@/lib/google-indexing';

export type QueuePlanEntry = {
  url: string;
  reason: 'new' | 'stale' | 'retry';
  lastNotifiedAt: string | null;
  action?: IndexingAction;
};

export type QueuePlan = {
  total: number;
  eligible: QueuePlanEntry[];
  skipped: { alreadyPending: number; withinCooldown: number; offHost: number };
  errors: string[];
};

const DEFAULT_COOLDOWN_DAYS = 7;
const DEFAULT_RETENTION_DAYS = 60;
const DEFAULT_RETRY_BACKOFF_HOURS = 20;
const INSERT_CHUNK = 100;
/** Share of each daily budget reserved for retrying previously failed URLs. */
const RETRY_SHARE = 0.25;

/** How long a URL stays "recently notified" before it is queued again. */
function cooldownDays(): number {
  const raw = Number(process.env.GOOGLE_INDEXING_COOLDOWN_DAYS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_COOLDOWN_DAYS;
}

/** Shorter wait after a failed attempt, so transient errors are retried soon. */
function retryBackoffHours(): number {
  const raw = Number(process.env.GOOGLE_INDEXING_RETRY_BACKOFF_HOURS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_RETRY_BACKOFF_HOURS;
}

function siteHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://kenyadesires.xyz';
  try {
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return 'kenyadesires.xyz';
  }
}

function isOnSite(url: string, host: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === host || hostname === `www.${host}`;
  } catch {
    return false;
  }
}

type UrlStateRow = RowDataPacket & {
  url: string;
  last_status: 'PENDING' | 'SUCCESS' | 'FAILED';
  last_requested_at: Date | null;
  pending_count: number;
};

/**
 * Decides which sitemap URLs are worth notifying Google about today.
 *
 * The sitemap is far larger than the 200/day quota, so this cannot simply queue
 * everything. Selection order is deliberate:
 *   1. URLs never notified at all — they get most of the quota, so no page is
 *      starved forever behind the top of the sitemap.
 *   2. URLs whose last attempt FAILED — up to RETRY_SHARE of the budget, so a
 *      transient error is retried promptly instead of waiting for the whole
 *      sitemap to be notified once.
 *   3. URLs whose last SUCCESS has aged past the cooldown — the remainder.
 *
 * URLs with a live PENDING row are skipped; the batch processor owns those.
 */
export async function buildQueuePlan(
  conn: PoolConnection,
  candidateUrls: string[],
  limit: number,
): Promise<QueuePlan> {
  const host = siteHost();
  const errors: string[] = [];

  const onHost = candidateUrls.filter((url) => isOnSite(url, host));
  const unique = Array.from(new Set(onHost));

  const plan: QueuePlan = {
    total: candidateUrls.length,
    eligible: [],
    skipped: { alreadyPending: 0, withinCooldown: 0, offHost: candidateUrls.length - onHost.length },
    errors,
  };

  if (unique.length === 0 || limit <= 0) return plan;

  // One query per chunk of URLs: the most recent row for each (by id, which is
  // monotonic and so breaks requested_at ties deterministically), plus a live
  // PENDING count. `url IN (...)` is parameterized, so sitemap values are never
  // interpolated into SQL text.
  const stateByUrl = new Map<string, UrlStateRow>();

  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const placeholders = chunk.map(() => '?').join(', ');

    const [rows] = await conn.query<UrlStateRow[]>(
      `SELECT l.url,
              l.status AS last_status,
              l.requested_at AS last_requested_at,
              (SELECT COUNT(*) FROM google_indexing_logs p
                WHERE p.url = l.url AND p.status = 'PENDING') AS pending_count
         FROM google_indexing_logs l
         JOIN (
           SELECT url, MAX(id) AS max_id
             FROM google_indexing_logs
            WHERE url IN (${placeholders})
            GROUP BY url
         ) newest ON newest.max_id = l.id`,
      chunk,
    );

    for (const row of rows) stateByUrl.set(row.url, row);
  }

  const cooldownMs = cooldownDays() * 24 * 60 * 60 * 1000;
  const retryBackoffMs = retryBackoffHours() * 60 * 60 * 1000;
  const now = Date.now();

  const fresh: QueuePlanEntry[] = [];
  const retries: QueuePlanEntry[] = [];

  for (const url of unique) {
    const state = stateByUrl.get(url);

    if (!state) {
      fresh.push({ url, reason: 'new', lastNotifiedAt: null });
      continue;
    }

    if (Number(state.pending_count) > 0) {
      plan.skipped.alreadyPending += 1;
      continue;
    }

    const last = state.last_requested_at ? new Date(state.last_requested_at).getTime() : null;

    // A failed attempt gets a short backoff, not the full cooldown. Most
    // failures here are transient (Google 429/5xx, network), and holding them
    // for the whole cooldown would strand a URL for a week. Successes keep the
    // long cooldown so they are not re-notified daily.
    const lastFailed = state.last_status === 'FAILED';
    const waitMs = lastFailed ? retryBackoffMs : cooldownMs;

    if (last !== null && now - last < waitMs) {
      plan.skipped.withinCooldown += 1;
      continue;
    }

    const entry: QueuePlanEntry = {
      url,
      reason: lastFailed ? 'retry' : 'stale',
      lastNotifiedAt: last !== null ? new Date(last).toISOString() : null,
    };

    if (entry.reason === 'retry') retries.push(entry);
    else fresh.push(entry);
  }

  // Oldest-notified first within each group, so the rotation is fair rather
  // than sitemap-ordered.
  const byOldest = (a: QueuePlanEntry, b: QueuePlanEntry) => {
    const at = a.lastNotifiedAt ? new Date(a.lastNotifiedAt).getTime() : 0;
    const bt = b.lastNotifiedAt ? new Date(b.lastNotifiedAt).getTime() : 0;
    return at - bt;
  };

  const sortedFresh = fresh.sort(byOldest);
  const sortedRetries = retries.sort(byOldest);

  // Retries reserve a quarter of the budget. Appending them after the fresh
  // list instead would starve them completely: while the sitemap holds any
  // never-notified URL, a failed attempt would never be retried until every
  // new page had been notified once, which on a 641-URL sitemap is days.
  const retryBudget = Math.min(
    sortedRetries.length,
    Math.max(1, Math.floor(limit * RETRY_SHARE)),
  );
  const chosenRetries = sortedRetries.slice(0, retryBudget);
  const chosenFresh = sortedFresh.slice(0, Math.max(0, limit - chosenRetries.length));

  plan.eligible = [...chosenRetries, ...chosenFresh];
  return plan;
}

/** Inserts the planned URLs as PENDING in chunked multi-row statements. */
export async function enqueueUrls(
  conn: PoolConnection,
  entries: QueuePlanEntry[],
): Promise<number> {
  let inserted = 0;

  for (let i = 0; i < entries.length; i += INSERT_CHUNK) {
    const chunk = entries.slice(i, i + INSERT_CHUNK);
    // One placeholder per column, including status and action_type, so nothing
    // in the statement is a literal that could drift from the row shape.
    const placeholders = chunk.map(() => '(?, ?, ?)').join(', ');
    const params = chunk.flatMap((entry) => [entry.url, 'PENDING', entry.action ?? 'URL_UPDATED']);

    const [result] = await conn.query<ResultSetHeader>(
      `INSERT INTO google_indexing_logs (url, status, action_type) VALUES ${placeholders}`,
      params,
    );
    inserted += result.affectedRows;
  }

  return inserted;
}

/**
 * Drops settled rows older than the retention window. Every run appends one row
 * per notified URL, so without this the table grows without bound (641 sitemap
 * URLs at a 7-day cooldown is ~33k rows a year).
 *
 * Only rows far older than the cooldown are removed, so pruning cannot make a
 * URL look "never notified" inside its cooldown window — such a URL is
 * re-notified sooner than intended, not starved.
 */
export async function pruneOldRows(
  conn: PoolConnection,
  retentionDays: number,
): Promise<number> {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) return 0;

  const [result] = await conn.query<ResultSetHeader>(
    `DELETE FROM google_indexing_logs
      WHERE status IN ('SUCCESS', 'FAILED')
        AND requested_at < NOW() - INTERVAL ? DAY`,
    [Math.floor(retentionDays)],
  );

  return result.affectedRows;
}

export function retentionDays(): number {
  const raw = Number(process.env.GOOGLE_INDEXING_RETENTION_DAYS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_RETENTION_DAYS;
}

/**
 * Sitemap -> quota-aware PENDING queue. Sitemap collection is reused from the
 * IndexNow pipeline so both submissions see the same URL set.
 */
export async function requeueFromSitemap(
  conn: PoolConnection,
  limit: number,
): Promise<QueuePlan> {
  const { urls, errors } = await getAllIndexNowUrls();
  const plan = await buildQueuePlan(conn, urls, limit);
  plan.errors.push(...errors);
  return plan;
}
