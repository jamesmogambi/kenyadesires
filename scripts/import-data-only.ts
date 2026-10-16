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

function extractCreateTables(sql: string): Map<string, string> {
  const map = new Map<string, string>();
  const regex = /CREATE TABLE `(\w+)`[\s\S]*?\)[\s\S]*?;/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    const tableName: string = match[1];
    let stmt: string = match[0];
    stmt = stmt.replace(/DEFAULT uuid\(\)/g, "DEFAULT ''");
    stmt = stmt.replace(/DEFAULT _utf8mb4/g, 'DEFAULT NULL');
    map.set(tableName, stmt);
  }
  return map;
}

function extractInserts(sql: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const regex = /INSERT INTO `(\w+)`[\s\S]*?VALUES[\s\S]*?;/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    const tableName: string = match[1];
    const arr = map.get(tableName) || [];
    arr.push(match[0]);
    map.set(tableName, arr);
  }
  return map;
}

async function main(): Promise<void> {
  const schemaPath: string = path.resolve(process.cwd(), 'database/kenyadesires_xyz_schema.sql');
  const sql: string = fs.readFileSync(schemaPath, 'utf-8');

  const createMap = extractCreateTables(sql);
  const insertMap = extractInserts(sql);

  console.log('Tables in dump: ' + createMap.size);
  console.log('Tables with data: ' + insertMap.size + '\n');

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

  // Get existing tables
  const [existingRows] = await conn.query('SHOW TABLES');
  const existingTables = new Set<string>((existingRows as any[]).map((r: any) => Object.values(r)[0]));

  // Create missing tables from dump
  console.log('Creating missing tables...');
  for (const [tableName, createStmt] of createMap) {
    if (existingTables.has(tableName)) continue;
    try {
      await conn.query(createStmt);
      existingTables.add(tableName);
      console.log('  Created: ' + tableName);
    } catch (e: any) {
      console.log('  SKIP ' + tableName + ': ' + (e.message || '').slice(0, 100));
    }
  }

  // Import data
  console.log('\nImporting data...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('SET UNIQUE_CHECKS = 0');

  let executed: number = 0;
  let skipped: number = 0;
  const skipDetails: string[] = [];

  for (const [tableName, inserts] of insertMap) {
    for (const stmt of inserts) {
      try {
        await conn.query(stmt);
        executed++;
      } catch (e: any) {
        skipped++;
        const errMsg: string = tableName + ': ' + (e.message || '').slice(0, 120);
        if (skipDetails.length < 30) skipDetails.push(errMsg);
      }
    }
    console.log('  ' + tableName + ': ' + inserts.length + ' inserts');
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.query('SET UNIQUE_CHECKS = 1');

  console.log('\n=== Import Summary ===');
  console.log('  Executed: ' + executed);
  console.log('  Skipped:  ' + skipped);
  if (skipDetails.length > 0) {
    console.log('\nFirst errors:');
    skipDetails.forEach((d: string) => console.log('  ' + d));
  }

  // Show row counts
  const [tables] = await conn.query('SHOW TABLES');
  console.log('\nRow counts:');
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