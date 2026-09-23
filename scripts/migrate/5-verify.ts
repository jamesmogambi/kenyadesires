import {
  neonPool,
  mysqlPool,
  schemaFile,
  log,
  logSection,
  closePools,
  checkMysqlReachable,
  assertMysqlEnv,
} from './config';
import { Schema } from './types';
import { readFileSync } from 'fs';

function mysqlQuoteIdent(name: string): string {
  return '`' + String(name).replace(/`/g, '``') + '`';
}
function pgQuoteIdent(name: string): string {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

async function neonCount(table: string): Promise<number> {
  const r = await neonPool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM ${pgQuoteIdent(table)}`
  );
  return Number(r.rows[0].count);
}

async function mysqlCount(table: string): Promise<number> {
  const [rows] = (await mysqlPool.query(
    `SELECT COUNT(*) AS count FROM ${mysqlQuoteIdent(table)}`
  )) as unknown as [{ count: number | string }];
  return Number(rows[0].count);
}

async function main() {
  assertMysqlEnv();
  logSection('verify');
  const schema: Schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  log(`[verify] comparing ${schema.tables.length} tables`);

  try {
    await checkMysqlReachable();
  } catch (e: any) {
    log('[verify] ' + (e as Error).message);
    log(
      '[verify] Aborting: MySQL is not reachable. Create tables first (npm run migrate:create) ' +
        'and ensure MySQL is running with the MYSQL_* vars set in .env.local.'
    );
    await closePools();
    process.exit(1);
  }

  let mismatches = 0;
  const colW = 28;
  log(`${'TABLE'.padEnd(colW)} | ${'Neon'.padStart(10)} | ${'MySQL'.padStart(10)} | Match`);

  for (const t of schema.tables) {
    let neo: string;
    let my: string;
    try {
      neo = String(await neonCount(t.table_name));
    } catch (e: any) {
      neo = `ERR:${(e?.code ? e.code.toString() : '?').slice(0, 8)}`;
    }
    try {
      my = String(await mysqlCount(t.table_name));
    } catch (e: any) {
      my = `ERR:${(e?.code ? e.code.toString() : '?').slice(0, 8)}`;
    }
    const match = neo === my;
    if (!match) mismatches++;
    log(`${t.table_name.padEnd(colW)} | ${neo.padStart(10)} | ${my.padStart(10)} | ${match ? 'PASS' : 'FAIL'}`);
  }

  log('');
  const summary = `Mismatches: ${mismatches}`;
  log(summary);
  await closePools();
  log('[verify] Done.');
  process.exit(mismatches > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error('[verify] FATAL:', err);
  await closePools();
  process.exit(1);
});
