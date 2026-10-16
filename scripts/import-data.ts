import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

const DB_HOST: string = process.env.MYSQL_HOST || '';
const DB_PORT: string = process.env.MYSQL_PORT || '3306';
const DB_USER: string = process.env.MYSQL_USER || '';
const DB_PASSWORD: string = process.env.MYSQL_PASSWORD || '';
const DB_NAME: string = process.env.MYSQL_DATABASE || '';

function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let cur: string = '';
  let str: string | null = null;
  let i: number = 0;

  while (i < sql.length) {
    const ch: string = sql[i];
    const next: string = sql[i + 1];

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
      while (i < sql.length && sql[i] !== '\n') cur += sql[i++];
      continue;
    }
    if (ch === '/' && next === '*') {
      cur += ch + next;
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) cur += sql[i++];
      if (i < sql.length) { cur += sql[i++] + sql[i++]; }
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
      const stmt: string = cur.trim();
      if (stmt) statements.push(stmt);
      cur = '';
    }
    i++;
  }

  const tail: string = cur.trim();
  if (tail) statements.push(tail);
  return statements;
}

async function main(): Promise<void> {
  const schemaPath: string = path.resolve(process.cwd(), 'database/kenyadesires_xyz_schema.sql');
  const sql: string = fs.readFileSync(schemaPath, 'utf-8');

  const statements: string[] = splitSql(sql);
  const insertStatements: string[] = statements.filter((s: string) =>
    /^\s*INSERT\s+INTO/i.test(s)
  );

  console.log('Total statements: ' + statements.length);
  console.log('INSERT statements: ' + insertStatements.length + '\n');

  const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
    connectionLimit: 10,
    connectTimeout: 60000,
    ssl: { rejectUnauthorized: false },
  });

  const conn = await pool.getConnection();
  console.log('Connected to Azure MySQL\n');

  // Disable checks for faster import
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('SET UNIQUE_CHECKS = 0');
  await conn.query("SET SESSION innodb_lock_wait_timeout = 120");

  let executed: number = 0;
  let skipped: number = 0;
  const errors: string[] = [];

  for (let i = 0; i < insertStatements.length; i++) {
    const stmt: string = insertStatements[i];
    const tableMatch: RegExpMatchArray | null = stmt.match(/INSERT\s+INTO\s+`(\w+)`/i);
    const tableName: string = tableMatch ? tableMatch[1] : 'unknown';
    const preview: string = stmt.slice(0, 100).replace(/\n/g, ' ');

    try {
      await conn.query(stmt);
      executed++;
      if (i % 20 === 0 || i === insertStatements.length - 1) {
        console.log('  [' + (i + 1) + '/' + insertStatements.length + '] OK: ' + tableName + ' :: ' + preview.slice(0, 60) + '...');
      }
    } catch (e: any) {
      skipped++;
      const errMsg: string = '  [' + (i + 1) + '/' + insertStatements.length + '] SKIP: ' + tableName + ' :: ' + (e.message || '').slice(0, 120);
      console.log(errMsg);
      if (errors.length < 20) errors.push(errMsg);
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.query('SET UNIQUE_CHECKS = 1');

  console.log('\n=== Import Summary ===');
  console.log('  Executed: ' + executed);
  console.log('  Skipped:  ' + skipped);

  // Show row counts
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nRow counts per table:');
  for (const row of tables as any[]) {
    const name: string = Object.values(row)[0];
    const [countRows] = await conn.query('SELECT COUNT(*) AS c FROM `' + name + '`');
    console.log('  ' + (countRows as any[])[0].c + '\t' + name);
  }

  conn.release();
  await pool.end();
}

main().catch((err: Error) => {
  console.error('FATAL:', err);
  process.exit(1);
});