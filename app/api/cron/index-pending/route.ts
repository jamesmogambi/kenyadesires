import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import mysqlPool from '@/lib/db';
import {
  publishUrlNotification,
  sleep,
  assertGoogleConfigured,
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

/**
 * Rows are flushed to the database every N publishes so a request killed by the
 * host or the scheduler cannot discard a whole batch of completed work.
 */
const CHECKPOINT_EVERY = 10;

/**
 * Wall-clock budget for one run. The sitemap fetch alone measured ~17s against
 * production, and each publish costs the 400ms delay plus a Google round trip,
 * so 150 URLs needs ~110s — longer than most scheduler timeouts. The run stops
 * early and cleanly at this budget instead of being killed mid-flight, and the
 * next run resumes with the remaining PENDING rows.
 */
const DEFAULT_RUN_BUDGET_MS = 45_000;

function runBudgetMs(): number {
  const raw = Number(process.env.GOOGLE_INDEXING_RUN_BUDGET_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_RUN_BUDGET_MS;
}

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
  const startedAt = Date.now();
  const budgetMs = runBudgetMs();

  try {
    // Preflight the key before touching the queue. If the service account
    // cannot be loaded, bailing out here is strictly better than requeueing 150
    // URLs: those rows would sit PENDING forever and the run would report
    // nothing useful about the actual cause.
    try {
      assertGoogleConfigured();
    } catch (configError) {
      console.error('[GoogleIndexing][cron] service account not usable:', configError);
      return NextResponse.json(
        {
          error: 'Google service account is not configured correctly',
          details: (configError as Error).message,
          hint: 'Check GOOGLE_SERVICE_ACCOUNT_KEY_FILE points at an existing, readable JSON key, then restart the Node app so it picks up the variable.',
        },
        { status: 500 },
      );
    }

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

    // Checkpointing, not one write at the end. The scheduler (and cPanel
    // Passenger) will kill a request that runs long, and a kill before the
    // final UPDATE leaves every attempted row at PENDING. Because the batch is
    // selected oldest-first, the next run then re-selects the exact same rows —
    // the run repeats forever and never makes progress. Flushing every
    // CHECKPOINT_EVERY rows bounds that loss to a partial chunk.
    const outcomes: Outcome[] = [];
    const failures: Array<{ url: string; error: string | null }> = [];
    let succeeded = 0;
    let failed = 0;
    let stoppedEarly = false;

    for (let i = 0; i < batch.length; i++) {
      // Stop on elapsed time rather than letting the host kill us. Budget is
      // measured from the start of the handler, so a slow sitemap fetch eats
      // into it too — which is correct, since that time counts against the same
      // request.
      if (Date.now() - startedAt > budgetMs) {
        stoppedEarly = true;
        break;
      }

      const row = batch[i];
      const error = await publishUrlNotification(row.url, row.action_type);

      outcomes.push({
        id: row.id,
        url: row.url,
        status: error ? 'FAILED' : 'SUCCESS',
        error: error ? error.slice(0, 2000) : null,
      });

      if (error) {
        failed += 1;
        failures.push({ url: row.url, error });
      } else {
        succeeded += 1;
      }

      if (outcomes.length >= CHECKPOINT_EVERY) {
        await persistOutcomes(conn, outcomes);
        outcomes.length = 0;
      }

      if (i < batch.length - 1) {
        await sleep(REQUEST_DELAY_MS);
      }
    }

    if (outcomes.length > 0) {
      await persistOutcomes(conn, outcomes);
      outcomes.length = 0;
    }

    const processed = succeeded + failed;
    const stillQueued = Math.max(0, pending.length - processed);

    console.log(
      `[GoogleIndexing][cron] batch=${batch.length} processed=${processed} ` +
        `succeeded=${succeeded} failed=${failed} deferred=${deferred.length} ` +
        `stillQueued=${stillQueued} stoppedEarly=${stoppedEarly} ` +
        `elapsedMs=${Date.now() - startedAt} quotaUsed=${usedToday + succeeded}`,
    );

    // 200 even when we stopped early on purpose: the run did what it was asked
    // to do and left a clean, resumable queue. A non-2xx here reads as a failure
    // in the scheduler's event log.
    return NextResponse.json({
      processed,
      succeeded,
      failed,
      deferred: deferred.length,
      stillQueued,
      stoppedEarly,
      runBudgetMs: budgetMs,
      requeued: queue?.enqueued ?? 0,
      pruned,
      quota: { used: usedToday + succeeded, limit: SAFE_DAILY_QUOTA },
      queue,
      failures,
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
