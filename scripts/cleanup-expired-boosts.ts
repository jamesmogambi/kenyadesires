/**
 * Reset boost columns for profiles whose boost has expired, and close their
 * open boost_history rows.
 *
 * Ranking itself does not depend on this: the listing ORDER BY compares
 * `boost_until > NOW()` and drops expired boosts to priority 0 (lib/boost.ts
 * `boostOrderBy`). This script is for data hygiene and so analytics can count
 * an "expired" end_reason rather than an open row.
 *
 * Safe to run repeatedly. Run it daily (cron / Vercel Cron):
 *   npm run boost:cleanup
 */

import { config } from "dotenv";
import { executeQuery } from "../lib/neon";

config({ path: ".env.development" });

const TABLES = ["escorts", "agencies"] as const;

/**
 * `executeQuery` returns rows, not the mysql2 result object, so the affected
 * count is taken from a COUNT that runs before each UPDATE.
 */
async function countExpired(table: string): Promise<number> {
  const rows = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) AS total FROM ${table}
      WHERE boost_until IS NOT NULL
        AND boost_until <= NOW()
        AND (boost_priority <> 0
             OR active_boost_package_id IS NOT NULL
             OR last_boost_ended_at IS NULL)`,
  );
  return Number(rows?.[0]?.total) || 0;
}

/**
 * A history row is "running" while `ended_at IS NULL`. Its expiry is derived
 * from `started_at + duration_days` — boost_history has no boost_until column.
 */
function expiredOpenHistoryWhere(alias = ""): string {
  const p = alias ? `${alias}.` : "";
  return `${p}ended_at IS NULL
      AND DATE_ADD(${p}started_at, INTERVAL ${p}duration_days DAY) <= NOW()`;
}

async function countOpenHistory(): Promise<number> {
  const rows = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) AS total FROM boost_history WHERE ${expiredOpenHistoryWhere()}`,
  );
  return Number(rows?.[0]?.total) || 0;
}

async function main() {
  let total = 0;

  for (const table of TABLES) {
    const expired = await countExpired(table);
    if (expired === 0) {
      console.log(`[boost:cleanup] ${table}: nothing to reset`);
      continue;
    }

    await executeQuery(
      `UPDATE ${table}
          SET boost_priority = 0,
              active_boost_package_id = NULL,
              boost_credits_spent = 0,
              boost_activated_at = NULL,
              last_boost_ended_at = boost_until
        WHERE boost_until IS NOT NULL
          AND boost_until <= NOW()
          AND (boost_priority <> 0
               OR active_boost_package_id IS NOT NULL
               OR last_boost_ended_at IS NULL)`,
    );
    total += expired;
    console.log(`[boost:cleanup] ${table}: ${expired} expired boost(s) reset`);
  }

  const openHistory = await countOpenHistory();
  if (openHistory > 0) {
    await executeQuery(
      `UPDATE boost_history
          SET ended_at = DATE_ADD(started_at, INTERVAL duration_days DAY),
              end_reason = 'expired'
        WHERE ${expiredOpenHistoryWhere()}`,
    );
  }
  console.log(`[boost:cleanup] boost_history: ${openHistory} row(s) closed as expired`);
  console.log(`[boost:cleanup] done, ${total} profile boost(s) reset`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[boost:cleanup] failed:", err?.message || err);
    process.exit(1);
  });
