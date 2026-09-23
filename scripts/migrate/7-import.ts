import './_env';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import mysqlPool from '../../lib/db';

const execAsync = promisify(exec);

const dryRun = process.argv.includes('--dry-run');
const dropTables = process.argv.includes('--drop-tables');

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
    throw new Error(`[import] Missing MYSQL_* env vars: ${missing.join(', ')}. Set them in .env.local.`);
  }
  return { host, port, user, password, database };
}

async function checkMysqlReachable(): Promise<void> {
  try {
    await mysqlPool.query('SELECT 1 AS alive');
  } catch (e: any) {
    const host = process.env.MYSQL_HOST || '(unset)';
    const port = process.env.MYSQL_PORT || '3306';
    const database = process.env.MYSQL_DATABASE || '(unset)';
    throw new Error(
      `[import] Cannot reach MySQL at ${host}:${port} (db=${database}). ` +
        `Start MySQL and verify the MYSQL_* variables in .env.local. ` +
        `Underlying error: ${e?.code || e?.message}`
    );
  }
}

async function main() {
  // Accept dump file path as argument
  const dumpFile = process.argv[2];
  if (!dumpFile) {
    console.error('[import] Usage: npm run migrate:import -- <dump-file.sql>');
    console.error('[import] Example: npm run migrate:import -- scripts/migrate/exports/mysql-dump-20240101-120000-full.sql');
    console.error('[import] Tip: Set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE env vars for the target MySQL.');
    process.exit(1);
  }

  const resolvedPath = path.resolve(dumpFile);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`[import] Dump file not found: ${resolvedPath}`);
    process.exit(1);
  }

  const cli = getMysqlCli();
  const size = fs.statSync(resolvedPath).size;
  console.log(`[import] Dump file: ${resolvedPath} (${(size / 1024).toFixed(1)} KB)`);
  console.log(`[import] Target MySQL: ${cli.user}@${cli.host}:${cli.port}/${cli.database}`);
  console.log(`[import] Drop tables: ${dropTables}`);
  console.log(`[import] Dry-run: ${dryRun}`);

  if (!dryRun) {
    await checkMysqlReachable();
    console.log('[import] Target MySQL reachable.');

    if (dropTables) {
      console.log('[import] Dropping existing tables before import...');
      const dropResult = (await mysqlPool.query(
        "SELECT CONCAT('DROP TABLE IF EXISTS `', table_name, '`') AS drop_sql " +
          'FROM information_schema.tables WHERE table_schema = ?',
        [cli.database]
      )) as any[];
      const tables = dropResult.map((row: any) => row.drop_sql as string);
      if (tables.length) {
        await mysqlPool.query('SET FOREIGN_KEY_CHECKS = 0;');
        for (const dropSql of tables) {
          await mysqlPool.query(dropSql);
          console.log(`[import] Dropped: ${dropSql}`);
        }
        await mysqlPool.query('SET FOREIGN_KEY_CHECKS = 1;');
        console.log(`[import] Dropped ${tables.length} tables.`);
      } else {
        console.log('[import] No tables to drop.');
      }
    }

    console.log('[import] Importing...');
    const safePassword = cli.password.replace(/(['"`\\])/g, '\\$1');
    const cmd =
      `mysql --host ${cli.host} --port ${cli.port} --user ${cli.user} ` +
      `--password='${safePassword}' --database ${cli.database} ` +
      `--default-character-set=utf8mb4 --force < '${resolvedPath}'`;

    const { stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 50 });

    if (stderr) {
      console.error('[import] mysql stderr:', stderr);
    }

    console.log('[import] Import complete.');
    console.log('[import] Verify with: npm run migrate:verify');
  } else {
    console.log(`[import] Dry-run: would import ${resolvedPath} to ${cli.database}@${cli.host}:${cli.port}`);
    console.log('[import] Run without --dry-run to execute.');
  }

  await mysqlPool.end();
}

main().catch(async (err) => {
  console.error('[import] FATAL:', err);
  try {
    await mysqlPool.end();
  } catch {}
  process.exit(1);
});
