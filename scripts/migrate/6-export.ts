import './_env';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import mysqlPool from '../../lib/db';

const execFileAsync = promisify(execFile);

const dryRun = process.argv.includes('--dry-run');
const schemaOnly = process.argv.includes('--schema-only');
const dataOnly = process.argv.includes('--data-only');
const includeDrop = process.argv.includes('--drop-tables');
const insertIgnore = process.argv.includes('--insert-ignore');

function getMysqlCli(): { host: string; port: string; user: string; password: string; database: string } {
  const host = process.env.MYSQL_HOST || '127.0.0.1';
  const port = process.env.MYSQL_PORT || '3306';
  const user = process.env.MYSQL_USER || '';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || '';
  const missing = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'].filter(
    (v) => !process.env[v]
  );
  if (missing.length) {
    throw new Error(`[export] Missing MYSQL_* env vars: ${missing.join(', ')}. Set them in .env.local.`);
  }
  return { host, port, user, password, database };
}

function buildDumpArgs(
  cli: { host: string; port: string; user: string; password: string; database: string },
  outputFile: string
): string[] {
  const args: string[] = [
    '--host', cli.host,
    '--port', cli.port,
    '--user', cli.user,
    '--password=' + cli.password,
    '--default-character-set=utf8mb4',
    '--single-transaction',
    '--quick',
    '--lock-tables=false',
    '--skip-comments',
    '--skip-quote-names',
  ];

  // Compatibility options for broad cPanel / shared-host support
  args.push('--hex-blob');
  args.push('--skip-triggers');

  if (schemaOnly) {
    args.push('--no-data');
  }
  if (dataOnly) {
    args.push('--no-create-info');
  }
  if (includeDrop) {
    args.push('--add-drop-table');
    args.push('--add-drop-database');
  }
  if (insertIgnore) {
    args.push('--insert-ignore');
  }

  args.push('--result-file', outputFile);
  args.push(cli.database);
  return args;
}

function getOutputPath(): { dir: string; file: string } {
  const exportDir = path.resolve(process.cwd(), 'scripts/migrate/exports');
  fs.mkdirSync(exportDir, { recursive: true });

  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  let suffix = 'full';
  if (schemaOnly) suffix = 'schema';
  if (dataOnly) suffix = 'data';
  const file = `mysql-dump-${stamp}-${suffix}.sql`;
  return { dir: exportDir, file };
}

async function checkMysqlReachable(): Promise<void> {
  try {
    await mysqlPool.query('SELECT 1 AS alive');
  } catch (e: any) {
    const host = process.env.MYSQL_HOST || '(unset)';
    const port = process.env.MYSQL_PORT || '3306';
    const database = process.env.MYSQL_DATABASE || '(unset)';
    throw new Error(
      `[export] Cannot reach MySQL at ${host}:${port} (db=${database}). ` +
        `Start MySQL and verify the MYSQL_* variables in .env.local. ` +
        `Underlying error: ${e?.code || e?.message}`
    );
  }
}

async function main() {
  const cli = getMysqlCli();
  const { dir, file } = getOutputPath();
  const outputFile = path.join(dir, file);

  console.log(`[export] Mode: ${schemaOnly ? 'schema-only' : dataOnly ? 'data-only' : 'schema + data'}${insertIgnore ? ' (insert-ignore)' : ''}`);
  console.log(`[export] Dry-run: ${dryRun}`);
  console.log(`[export] MySQL: ${cli.user}@${cli.host}:${cli.port}/${cli.database}`);
  console.log(`[export] Output: ${outputFile}`);

  if (!dryRun) {
    await checkMysqlReachable();
    console.log('[export] MySQL reachable.');

    const args = buildDumpArgs(cli, outputFile);
    console.log(`[export] Running: mysqldump ${args.map((a) => (a.startsWith('--password=') ? '--password=[HIDDEN]' : a)).join(' ')}`);

    const { stderr } = await execFileAsync('mysqldump', args, {
      maxBuffer: 1024 * 1024 * 50,
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('[export] mysqldump stderr:', stderr);
    }

    const size = fs.statSync(outputFile).size;
    console.log(`[export] Dump complete: ${file} (${(size / 1024).toFixed(1)} KB)`);
    console.log(`[export] To import on production (cPanel phpMyAdmin):`);
    console.log(`           1. Upload ${file} to your computer`);
    console.log(`           2. In cPanel > phpMyAdmin > select your database > Import > Choose File`);
    console.log(`           3. Or use: mysql -h <prod_host> -u <prod_user> -p <prod_db> < ${file}`);
  } else {
    const args = buildDumpArgs(cli, outputFile);
    const visibleArgs = args.map((a) => (a.startsWith('--password=') ? '--password=[HIDDEN]' : a));
    console.log(`[export] Dry-run mysqldump command:`);
    console.log(`           mysqldump ${visibleArgs.join(' ')}`);
  }

  await mysqlPool.end();
}

main().catch(async (err) => {
  console.error('[export] FATAL:', err);
  try {
    await mysqlPool.end();
  } catch {}
  process.exit(1);
});
