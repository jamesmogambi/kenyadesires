import './_env';
import fs from 'fs';
import { types } from 'pg';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import mysqlPool from '../../lib/db';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const migrateDir = __dirname;
export const schemaFile = join(migrateDir, 'schema.json');
export const sqlFile = join(migrateDir, 'schema.sql');
export const logsDir = join(migrateDir, 'logs');

fs.mkdirSync(logsDir, { recursive: true });

function nowStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export const logFile = join(logsDir, `migrate-${nowStamp()}.log`);

// Preserve full precision for bigint / numeric when copying data.
// pg returns these as strings instead of JS numbers (avoids 2^53 overflow).
types.setTypeParser(20, (val: string) => val); // int8
types.setTypeParser(1700, (val: string) => val); // numeric/decimal

export const neonUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!neonUrl) {
  throw new Error('NEON_DATABASE_URL (or DATABASE_URL) is not set in .env.local');
}

import { Pool } from 'pg';

export const neonPool = new Pool({
  connectionString: neonUrl,
  ssl: { rejectUnauthorized: false },
});

export { mysqlPool };

export function log(...args: unknown[]): void {
  const msg = args
    .map((a) => (a && typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ');
  console.log(msg);
  try {
    fs.appendFileSync(logFile, msg + '\n');
  } catch {
    /* ignore logging errors */
  }
}

export function logSection(title: string): void {
  const line = `\n========== ${title} ==========`;
  console.log(line);
  try {
    fs.appendFileSync(logFile, line + '\n');
  } catch {
    /* ignore */
  }
}

export async function closePools(): Promise<void> {
  try {
    await neonPool.end();
  } catch (e) {
    log('[pool] neonPool end error:', (e as Error).message);
  }
  try {
    await mysqlPool.end();
  } catch (e) {
    log('[pool] mysqlPool end error:', (e as Error).message);
  }
}

export async function checkMysqlReachable(): Promise<void> {
  try {
    await mysqlPool.query('SELECT 1 AS alive');
  } catch (e: any) {
    const host = process.env.MYSQL_HOST || '(unset)';
    const port = process.env.MYSQL_PORT || '3306';
    throw new Error(
      `[mysql] Cannot reach MySQL at ${host}:${port} (db=${process.env.MYSQL_DATABASE || '(unset)'}). ` +
        `Start MySQL and verify the MYSQL_* variables in .env.local. ` +
        `Underlying error: ${e?.code || e?.message}`
    );
  }
}

export function assertMysqlEnv(): void {
  const missing = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'].filter(
    (v) => !process.env[v]
  );
  if (missing.length) {
    throw new Error(`[mysql] Missing MYSQL_* env vars: ${missing.join(', ')}. Set them in .env.local.`);
  }
}
