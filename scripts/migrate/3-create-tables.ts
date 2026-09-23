import { mysqlPool, sqlFile, log, logSection, closePools, checkMysqlReachable, assertMysqlEnv } from './config';
import { readFileSync } from 'fs';

const dryRun = process.argv.includes('--dry-run');

/**
 * Splits a .sql file into individual statements, respecting string literals
 * ('...'), quoted identifiers (`...`), and line (--) / block (/* *\/) comments.
 */
function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let cur = '';
  let str: string | null = null; // ', ", `
  let i = 0;

  const isStatementKeyword = (s: string) =>
    /^\s*(set|create|alter|drop|insert|update|delete|replace)\b/i.test(s);

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (str) {
      cur += ch;
      if (ch === str && !(ch === "'" && next === "'")) {
        str = null;
      } else if (ch === "'" && next === "'") {
        cur += next;
        i += 2;
        continue;
      }
      i++;
      continue;
    }

    // line comment
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') {
        cur += sql[i++];
      }
      continue;
    }
    // block comment
    if (ch === '/' && next === '*') {
      cur += ch + next;
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
        cur += sql[i++];
      }
      if (i < sql.length) {
        cur += sql[i++] + sql[i++];
      }
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      str = ch;
      cur += ch;
      i++;
      continue;
    }

    cur += ch;

    if (ch === ';') {
      const stmt = cur.trim();
      if (stmt && isStatementKeyword(stmt)) {
        statements.push(stmt);
      } else if (stmt) {
        // Keep SET FOREIGN_KEY_CHECKS etc.; isStatementKeyword covers SET already.
        statements.push(stmt);
      }
      cur = '';
    }
    i++;
  }

  const tail = cur.trim();
  if (tail) statements.push(tail);

  return statements;
}

async function main() {
  const sql = readFileSync(sqlFile, 'utf8');
  const statements = splitSql(sql);
  logSection('create-tables');
  log(`[create] Loaded ${statements.length} statements from ${sqlFile}`);
  log(`[create] dry-run = ${dryRun}`);

  if (!dryRun) {
    assertMysqlEnv();
    try {
      await checkMysqlReachable();
      log('[create] MySQL reachable.');
    } catch (e: any) {
      log('[create]', (e as Error).message);
      await closePools();
      process.exit(1);
    }
  }

  if (dryRun) {
    for (const stmt of statements) {
      log('[create][dry-run]', stmt);
    }
    log('[create][dry-run] No statements executed (--dry-run).');
    return;
  }

  let executed = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await mysqlPool.query(stmt);
      executed++;
      const m = stmt.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/);
      if (m) log(`[create] created/verified table: ${m[1]}`);
      else if (/^ALTER TABLE/.test(stmt)) log('[create] applied ALTER:', stmt.slice(0, 100));
      else log('[create] executed:', stmt.slice(0, 60));
    } catch (e: any) {
      skipped++;
      const head = stmt.match(/`(\w+)`/)?.[1] || stmt.slice(0, 30);
      log(`[create] skip: ${head} :: ${(e?.message || String(e)).slice(0, 160)}`);
    }
  }
  log(`[create] done. executed=${executed} skipped=${skipped}`);
  await closePools();
  log('[create] Done.');
}

main().catch(async (err) => {
  console.error('[create] FATAL:', err);
  await closePools();
  process.exit(1);
});
