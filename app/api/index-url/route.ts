import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import mysqlPool from '@/lib/db';
import {
  publishUrlNotification,
  SAFE_DAILY_QUOTA,
  type IndexingAction,
} from '@/lib/google-indexing';


type IncomingEntry = {
  url: string;
  action: IndexingAction;
};

const ADMIN_TOKEN = process.env.INDEXING_ADMIN_TOKEN;

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Google's Indexing API only accepts URLs on a property verified in the
 * Search Console of the service account's project, over http(s). Anything else
 * is guaranteed to fail, so reject it before spending quota on it.
 */
function normalizeUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.trim() === '') return null;

  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  return parsed.toString();
}

function parseAction(raw: unknown): IndexingAction {
  if (typeof raw === 'string' && raw.toUpperCase().replace(/\s+/g, '_') === 'URL_DELETED') {
    return 'URL_DELETED';
  }
  return 'URL_UPDATED';
}

/**
 * Accepts either `{ url, action }` or `{ urls: string[], action }`.
 * Returns the de-duplicated, validated entries plus what was dropped.
 */
function parseEntries(body: unknown): {
  entries: IncomingEntry[];
  rejected: Array<{ value: unknown; reason: string }>;
} {
  const entries: IncomingEntry[] = [];
  const rejected: Array<{ value: unknown; reason: string }> = [];
  const seen = new Set<string>();

  const push = (rawUrl: unknown, rawAction: unknown) => {
    const url = normalizeUrl(rawUrl);
    if (!url) {
      rejected.push({ value: rawUrl, reason: 'Missing or malformed http(s) URL' });
      return;
    }
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url, action: parseAction(rawAction) });
  };

  if (Array.isArray(body)) {
    const defaultAction = parseAction(undefined);
    for (const item of body) {
      if (typeof item === 'string') push(item, defaultAction);
      else if (item && typeof item === 'object') {
        const rec = item as Record<string, unknown>;
        push(rec.url, rec.action);
      } else {
        rejected.push({ value: item, reason: 'Entry must be a string or { url, action }' });
      }
    }
    return { entries, rejected };
  }

  if (!body || typeof body !== 'object') {
    return { entries, rejected };
  }

  const obj = body as Record<string, unknown>;

  if (Array.isArray(obj.urls)) {
    for (const item of obj.urls) push(item, obj.action);
    return { entries, rejected };
  }

  if (obj.url !== undefined) {
    push(obj.url, obj.action);
    return { entries, rejected };
  }

  rejected.push({ value: body, reason: "Provide 'url' or 'urls'" });
  return { entries, rejected };
}

export async function POST(req: NextRequest) {
  await connection();

  if (ADMIN_TOKEN) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return unauthorized();
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { entries, rejected } = parseEntries(body);

  if (entries.length === 0) {
    return NextResponse.json(
      { error: 'No valid URLs supplied', rejected },
      { status: 400 },
    );
  }

  const conn = await mysqlPool.getConnection();

  try {
    // Log every request as PENDING first. If the process dies mid-publish the
    // rows stay PENDING and the cron route picks them up on its next run.
    const logIds: number[] = [];
    for (const entry of entries) {
      const [result] = await conn.execute<ResultSetHeader>(
        'INSERT INTO google_indexing_logs (url, status, action_type) VALUES (?, ?, ?)',
        [entry.url, 'PENDING', entry.action],
      );
      logIds.push(result.insertId);
    }

    // Count what we have already burned today (rolling 24h window, matching
    // Google's own per-day behaviour closely enough).
    const [countRows] = await conn.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS success_count
         FROM google_indexing_logs
        WHERE status = 'SUCCESS'
          AND requested_at >= NOW() - INTERVAL 1 DAY`,
    );
    const usedToday = Number(countRows[0]?.success_count ?? 0);

    if (usedToday + entries.length > SAFE_DAILY_QUOTA) {
      const remaining = Math.max(0, SAFE_DAILY_QUOTA - usedToday);

      // Release the rows we just claimed: they were never sent to Google, so
      // they must not count against quota or be retried blindly.
      if (logIds.length > 0) {
        await conn.query(
          `DELETE FROM google_indexing_logs
            WHERE id IN (${logIds.map(() => '?').join(', ')})`,
          logIds,
        );
      }

      return NextResponse.json(
        {
          error: 'Google Indexing API daily quota nearly exhausted',
          quota: {
            limit: SAFE_DAILY_QUOTA,
            used: usedToday,
            requested: entries.length,
            remaining,
            resetsAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        { status: 429 },
      );
    }

    const results: Array<{
      url: string;
      action: IndexingAction;
      status: 'SUCCESS' | 'FAILED';
      error: string | null;
    }> = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const logId = logIds[i];

      const error = await publishUrlNotification(entry.url, entry.action);

      if (error) {
        await conn.execute(
          `UPDATE google_indexing_logs
              SET status = 'FAILED', error_message = ?
            WHERE id = ?`,
          [error.slice(0, 2000), logId],
        );
        results.push({
          url: entry.url,
          action: entry.action,
          status: 'FAILED',
          error,
        });
      } else {
        await conn.execute(
          `UPDATE google_indexing_logs
              SET status = 'SUCCESS', error_message = NULL
            WHERE id = ?`,
          [logId],
        );
        results.push({
          url: entry.url,
          action: entry.action,
          status: 'SUCCESS',
          error: null,
        });
      }
    }

    const succeeded = results.filter((r) => r.status === 'SUCCESS').length;

    return NextResponse.json(
      {
        submitted: entries.length,
        succeeded,
        failed: entries.length - succeeded,
        quota: { used: usedToday + succeeded, limit: SAFE_DAILY_QUOTA },
        rejected,
        results,
      },
      { status: succeeded > 0 ? 200 : 207 },
    );
  } catch (error) {
    console.error('[GoogleIndexing] POST /api/index-url failed:', error);
    return NextResponse.json(
      { error: 'Indexing request failed', details: (error as Error).message },
      { status: 500 },
    );
  } finally {
    conn.release();
  }
}
