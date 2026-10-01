import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import mysqlPool from '@/lib/db';
import {
  publishUrlNotification,
  sleep,
  SAFE_DAILY_QUOTA,
  type IndexingAction,
} from '@/lib/google-indexing';
import {
  enqueueUrls,
  pruneOldRows,
  requeueFromSitemap,
  retentionDays,
} from '@/lib/google-indexing-queue';

// Segment config (`dynamic`/`runtime`) is rejected while nextConfig.cacheComponents
// is on; `await connection()` inside each handler is this project's equivalent.
export const maxDuration = 300;

/** Google's hard daily cap. One batch of 150 per run leaves headroom for a
 *  manual submission through /api/index-url on the same day. */
const BATCH_LIMIT = 150;
/** Google throttles bursts; publishing all 150 back-to-back invites 429s. */
const REQUEST_DELAY_MS = 400;

const CRON_SECRET = process.env.CRON_SECRET;

type PendingRow = {
  id: number;
  url: string;
  action_type: IndexingAction;
};

type Outcome = {
  id: number;
  url: string;
  status: 'SUCCESS' | 'FAILED';
  error: string | null;
};

export async function GET(req: NextRequest) {
  await connection();
  return run(req);
}

export async function POST(req: NextRequest) {
  await connection();
  return run(req);
}

async function run(req: NextRequest) {
  if (CRON_SECRET) {
    const provided =
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      req.nextUrl.searchParams.get('secret');
    if (provided !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const limitParam = Number(req.nextUrl.searchParams.get('limit'));
  const limit =
    Number.isFinite(limitParam) && limitParam > 0
      ? Math.min(Math.floor(limitParam), BATCH_LIMIT)
      : BATCH_LIMIT;

  // Requeueing is the default daily behaviour: pull the sitemap, pick the URLs
  // that most deserve a notification, and insert them as PENDING. `?requeue=0`
  // drains an existing queue without refilling it, which is the manual escape
  // hatch when a bad URL set is stuck in the rotation.
  const requeueParam = req.nextUrl.searchParams.get('requeue');
  const shouldRequeue = requeueParam !== '0' && requeueParam !== 'false';

  const conn = await mysqlPool.getConnection();

  try {
    // Prune before counting: removes settled history first, and its result is
    // reported even if the quota check below short-circuits the run.
    const pruned = await pruneOldRows(conn, retentionDays());

    // Quota first: both the requeue slice and the publish batch are sized from
    // today's remaining headroom, so a run can never overshoot the cap.
    const [countRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS success_count
         FROM google_indexing_logs
        WHERE status = 'SUCCESS'
          AND requested_at >= NOW() - INTERVAL 1 DAY`,
    );
    const usedToday = Number(countRows[0]?.success_count ?? 0);
    const headroom = Math.max(0, SAFE_DAILY_QUOTA - usedToday);

    if (headroom === 0) {
      return NextResponse.json(
        {
          error: 'Google Indexing API daily quota exhausted; nothing queued or sent',
          processed: 0,
          pruned,
          quota: { used: usedToday, limit: SAFE_DAILY_QUOTA },
        },
        { status: 429 },
      );
    }

    let queue: {
      total: number;
      enqueued: number;
      byReason: Record<string, number>;
      skipped: { alreadyPending: number; withinCooldown: number; offHost: number };
      errors: string[];
    } | null = null;

    if (shouldRequeue) {
      // Refill only what this run can actually send. Sizing the enqueue by
      // headroom alone lets the queue grow without bound: a run limited to 150
      // would still insert 190 rows and leave them PENDING, and the next run
      // would insert 190 more on top. Backlog first, then top up.
      const [pendingRows] = await conn.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS pending_count
           FROM google_indexing_logs
          WHERE status = 'PENDING'`,
      );
      const pendingCount = Number(pendingRows[0]?.pending_count ?? 0);
      const enqueueBudget = Math.max(0, Math.min(headroom, limit) - pendingCount);

      if (enqueueBudget === 0) {
        console.log(
          `[GoogleIndexing][cron] no requeue needed: ${pendingCount} PENDING already ` +
            `queued, headroom ${headroom}, limit ${limit}`,
        );
      } else {
        const plan = await requeueFromSitemap(conn, enqueueBudget);
        const enqueued = await enqueueUrls(conn, plan.eligible);
        // The eligible list can be 150 URLs long; summarise it instead of
        // putting half a kilobyte of sitemap into every cron response.
        const byReason: Record<string, number> = {};
        for (const entry of plan.eligible) {
          byReason[entry.reason] = (byReason[entry.reason] ?? 0) + 1;
        }
        queue = {
          total: plan.total,
          enqueued,
          byReason,
          skipped: plan.skipped,
          errors: plan.errors,
        };
        console.log(
          `[GoogleIndexing][cron] requeued ${enqueued}/${plan.eligible.length} of ` +
            `${plan.total} sitemap URLs ` +
            `(skipped: ${plan.skipped.alreadyPending} pending, ` +
            `${plan.skipped.withinCooldown} in cooldown, ${plan.skipped.offHost} off-host)`,
        );
      }
    }

    // Oldest first: rows that have been waiting longest go out first, which also
    // stops a single URL from being retried on every run.
    const [rows] = await conn.query<RowDataPacket[]>(
      `SELECT id, url, action_type
         FROM google_indexing_logs
        WHERE status = 'PENDING'
        ORDER BY requested_at ASC, id ASC
        LIMIT ?`,
      [limit],
    );

    const pending = rows as PendingRow[];

    if (pending.length === 0) {
      return NextResponse.json({
        processed: 0,
        succeeded: 0,
        failed: 0,
        requeued: queue?.enqueued ?? 0,
        pruned,
        message: shouldRequeue
          ? 'Queue drained; nothing left to send'
          : 'No PENDING rows to process',
        queue,
      });
    }

    const batch = pending.slice(0, headroom);
    const deferred = pending.slice(headroom);

    const outcomes: Outcome[] = [];

    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      const error = await publishUrlNotification(row.url, row.action_type);

      outcomes.push({
        id: row.id,
        url: row.url,
        status: error ? 'FAILED' : 'SUCCESS',
        error: error ? error.slice(0, 2000) : null,
      });

      if (i < batch.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    // One batched UPDATE, built from placeholders. The CASE expression maps each
    // id to its own status and message, so a mixed success/failure batch stays
    // one round trip instead of N statements inside a loop.
    await persistOutcomes(conn, outcomes);

    const succeeded = outcomes.filter((o) => o.status === 'SUCCESS').length;
    const failed = outcomes.filter((o) => o.status === 'FAILED').length;

    console.log(
      `[GoogleIndexing][cron] batch=${batch.length} succeeded=${succeeded} failed=${failed} ` +
        `deferred=${deferred.length} quotaUsed=${usedToday + succeeded}`,
    );

    return NextResponse.json({
      processed: outcomes.length,
      succeeded,
      failed,
      deferred: deferred.length,
      requeued: queue?.enqueued ?? 0,
      pruned,
      quota: { used: usedToday + succeeded, limit: SAFE_DAILY_QUOTA },
      queue,
      failures: outcomes
        .filter((o) => o.status === 'FAILED')
        .map((o) => ({ url: o.url, error: o.error })),
    });
  } catch (error) {
    console.error('[GoogleIndexing][cron] failed:', error);
    return NextResponse.json(
      { error: 'Cron batch failed', details: (error as Error).message },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}

/**
 * Applies every outcome in a single statement:
 *   UPDATE google_indexing_logs
 *      SET status = CASE id WHEN ? THEN 'SUCCESS' ... ELSE status END,
 *          error_message = CASE id WHEN ? THEN ? ... END
 *    WHERE id IN (?, ?, ...)
 */
async function persistOutcomes(
  conn: Awaited<ReturnType<typeof mysqlPool.getConnection>>,
  outcomes: Outcome[],
): Promise<void> {
  if (outcomes.length === 0) return;

  const statusCases: string[] = [];
  const errorCases: string[] = [];

  const statusParams: Array<number | string> = [];
  const errorParams: Array<number | string | null> = [];

  for (const outcome of outcomes) {
    statusCases.push('WHEN ? THEN ?');
    statusParams.push(outcome.id, outcome.status);

    errorCases.push('WHEN ? THEN ?');
    errorParams.push(outcome.id, outcome.error);
  }

  const idPlaceholders = outcomes.map(() => '?').join(', ');
  const sql = `
    UPDATE google_indexing_logs
       SET status = CASE id ${statusCases.join(' ')} ELSE status END,
           error_message = CASE id ${errorCases.join(' ')} ELSE error_message END
     WHERE id IN (${idPlaceholders})`;

  // Placeholder order must follow the statement text: all status cases, then all
  // error cases, then the WHERE list. Interleaving them shifts every value after
  // the first row and writes the wrong status/error onto the wrong id.
  const [result] = await conn.execute<ResultSetHeader>(sql, [
    ...statusParams,
    ...errorParams,
    ...outcomes.map((o) => o.id),
  ]);

  if (result.affectedRows !== outcomes.length) {
    console.warn(
      `[GoogleIndexing][cron] batch update touched ${result.affectedRows} of ` +
        `${outcomes.length} rows — some ids may no longer exist`,
    );
  }
}
