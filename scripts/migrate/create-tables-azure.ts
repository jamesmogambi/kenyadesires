import './_env';
import { mysqlPool, log, logSection, closePools, checkMysqlReachable, assertMysqlEnv } from './config';
import { readFileSync } from 'fs';
import { join } from 'path';

const dryRun = process.argv.includes('--dry-run');

function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let cur = '';
  let str: string | null = null;
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

    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') {
        cur += sql[i++];
      }
      continue;
    }
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
  const sqlFile = join(__dirname, 'schema.sql');
  const sql = readFileSync(sqlFile, 'utf8');
  const statements = splitSql(sql);
  logSection('create-tables-azure');
  log(`[create] Loaded ${statements.length} statements from ${sqlFile}`);
  log(`[create] dry-run = ${dryRun}`);

  if (dryRun) {
    for (const stmt of statements.slice(0, 5)) {
      log('[create][dry-run]', stmt.slice(0, 120));
    }
    log('[create][dry-run] ... (showing first 5 of ' + statements.length + ')');
    return;
  }

  assertMysqlEnv();
  try {
    await checkMysqlReachable();
    log('[create] MySQL reachable.');
  } catch (e: any) {
    log('[create]', (e as Error).message);
    await closePools();
    process.exit(1);
  }

  // Drop existing tables first for clean import
  log('[create] Dropping existing tables...');
  const [existingTables] = await mysqlPool.query("SHOW TABLES");
  for (const row of existingTables as any[]) {
    const tableName = Object.values(row)[0];
    try {
      await mysqlPool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      log(`[create] Dropped table: ${tableName}`);
    } catch (e: any) {
      log(`[create] Could not drop ${tableName}: ${e.message}`);
    }
  }

  let executed = 0;
  let skipped = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
    try {
      await mysqlPool.query(stmt);
      executed++;
      if (i % 20 === 0 || stmt.toLowerCase().includes('create table')) {
        log(`  [${i + 1}/${statements.length}] OK: ${preview}...`);
      }
    } catch (e: any) {
      skipped++;
      log(`  [${i + 1}/${statements.length}] SKIP: ${preview}... :: ${(e as any).message.slice(0, 120)}`);
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