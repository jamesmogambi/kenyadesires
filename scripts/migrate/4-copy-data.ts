import { neonPool, mysqlPool, schemaFile, log, logSection, closePools, checkMysqlReachable, assertMysqlEnv } from './config';
import { Schema, ColumnInfo } from './types';
import { readFileSync } from 'fs';

const BATCH = 1000;
const LARGE_BATCH = 5000;
const LARGE_THRESHOLD = 100000;
const dryRun = process.argv.includes('--dry-run');

function mysqlQuoteIdent(name: string): string {
  return '`' + String(name).replace(/`/g, '``') + '`';
}
function pgQuoteIdent(name: string): string {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function transformValue(value: unknown, col: ColumnInfo): unknown {
  if (value === null || value === undefined) return null;
  // bytea -> raw buffer (mysql2 sends as LONGBLOB)
  if (Buffer.isBuffer(value)) return value;
  // boolean -> 1/0
  if (typeof value === 'boolean') return value ? 1 : 0;
  // arrays -> JSON
  if (col.is_array) {
    if (Array.isArray(value)) return JSON.stringify(value);
    if (typeof value === 'string') return value; // best-effort; pg usually parses arrays
    return JSON.stringify(value);
  }
  const udt = (col.udt_name || '').toLowerCase();
  const dt = (col.data_type || '').toLowerCase();
  // json / jsonb -> JSON string
  if (udt === 'json' || udt === 'jsonb' || dt === 'json' || dt === 'jsonb') {
    return JSON.stringify(value);
  }
  // timestamps / datetimes -> 'YYYY-MM-DD HH:mm:ss' (UTC)
  if (value instanceof Date) {
    return value.toISOString().slice(0, 19).replace('T', ' ');
  }
  // objects (e.g. unparsed json, points) -> JSON
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  // numbers and strings: numeric is returned as a string (precision safe),
  // which MySQL DECIMAL/NUMBER columns accept as-is.
  return value;
}

interface PagedCount {
  total: number;
  batch: number;
  large: boolean;
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
  const schema: Schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  logSection('copy-data');
  log(`[copy] ${schema.tables.length} tables from Neon -> MySQL. dry-run=${dryRun}`);

  if (!dryRun) {
    assertMysqlEnv();
    try {
      await checkMysqlReachable();
      log('[copy] MySQL reachable.');
    } catch (e: any) {
      log('[copy]', (e as Error).message);
      await closePools();
      process.exit(1);
    }
  }

  let grandTotal = 0;

  for (const table of schema.tables) {
    const columns = table.columns;
    if (!columns.length) {
      log(`[copy] skip ${table.table_name} (no columns)`);
      continue;
    }
    const colNames = columns.map((c) => c.column_name);
    const colByName = new Map(columns.map((c) => [c.column_name, c]));
    const colsClause = colNames.map(mysqlQuoteIdent).join(', ');
    const insertSql = `INSERT IGNORE INTO ${mysqlQuoteIdent(table.table_name)} (${colsClause}) VALUES ?`;

    const neonTotal = await neonCount(table.table_name);
    const large = neonTotal > LARGE_THRESHOLD;
    const batch = large ? LARGE_BATCH : BATCH;
    log(
      `[copy] ${table.table_name}: neon_rows=${neonTotal}, ` +
        `batch=${batch}, large=${large}, mysql_rows=${dryRun ? 'n/a' : await mysqlCount(table.table_name)}`
    );

    if (dryRun) {
      const sample = await neonPool.query(
        `SELECT ${colNames.map(pgQuoteIdent).join(',')} FROM ${pgQuoteIdent(table.table_name)} ORDER BY ${colNames.map(pgQuoteIdent).join(',')} LIMIT 1`
      );
      log(`[copy][dry-run] ${table.table_name}`);
      log(`  SQL: ${insertSql}`);
      if (sample.rows.length) {
        const transformed = colNames.map((c) =>
          transformValue(sample.rows[0][c], colByName.get(c) as ColumnInfo)
        );
        log(`  sample: ${JSON.stringify(transformed)}`);
      }
      continue;
    }

    // stable ordering for deterministic LIMIT/OFFSET paging
    const orderCols = table.primary_key.length
      ? table.primary_key
      : colNames.slice(0, 1);
    const orderClause = `ORDER BY ${orderCols.map(pgQuoteIdent).join(', ')}`;
    const selectCols = `SELECT ${colNames.map(pgQuoteIdent).join(',')} FROM ${pgQuoteIdent(table.table_name)}`;

    let copied = 0;
    let offset = 0;
    while (copied < neonTotal) {
      const res = await neonPool.query(
        `${selectCols} ${orderClause} LIMIT $1 OFFSET $2`,
        [batch, offset]
      );
      const rows = res.rows;
      if (!rows.length) break;

      const values = rows.map((r) =>
        colNames.map((c) => transformValue(r[c], colByName.get(c) as ColumnInfo))
      );

      if (large) {
        const conn = await mysqlPool.getConnection();
        try {
          await conn.beginTransaction();
          await conn.query(insertSql, [values]);
          await conn.commit();
        } catch (e: any) {
          await conn.rollback();
          log(`[copy] ERROR (rolled back) ${table.table_name} offset=${offset}: ${(e?.message || String(e)).slice(0, 160)}`);
        } finally {
          conn.release();
        }
      } else {
        await mysqlPool.query(insertSql, [values]);
      }

      copied += rows.length;
      offset += rows.length;
      grandTotal += rows.length;
    }

    log(`[copy] ${table.table_name}: copied ${copied}/${neonTotal}`);
  }

  log(`[copy] DONE. total copied = ${grandTotal}`);
  await closePools();
  log('[copy] Done.');
}

main().catch(async (err) => {
  console.error('[copy] FATAL:', err);
  await closePools();
  process.exit(1);
});
