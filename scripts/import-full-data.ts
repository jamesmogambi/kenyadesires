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

function extractStatements(sql: string, keyword: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(
    keyword + '\\s+(?:INTO\\s+`?\\w+`?\\s*)?\\([\\s\\S]*?\\);',
    'gi'
  );
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function extractCreateTables(sql: string): string[] {
  const results: string[] = [];
  // Match CREATE TABLE `name` ( ... ) ENGINE=...;
  const regex = /CREATE TABLE `(\w+)`[\s\S]*?\)[\s\S]*?;/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    results.push(match[0]);
  }
  return results;
}

function extractInserts(sql: string): string[] {
  const results: string[] = [];
  // Match INSERT INTO `name` (...) VALUES (...),(...),...;
  const regex = /INSERT INTO `(\w+)`[\s\S]*?VALUES[\s\S]*?;/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(sql)) !== null) {
    results.push(match[0]);
  }
  return results;
}

async function main(): Promise<void> {
  const schemaPath: string = path.resolve(process.cwd(), 'database/kenyadesires_xyz_schema.sql');
  let sql: string = fs.readFileSync(schemaPath, 'utf-8');

  // Fix MariaDB-specific syntax
  sql = sql
    .replace(/DEFAULT uuid\(\)/g, "DEFAULT ''")
    .replace(/DEFAULT _utf8mb4/g, 'DEFAULT NULL');

  const createStatements: string[] = extractCreateTables(sql);
  const insertStatements: string[] = extractInserts(sql);

  console.log('CREATE TABLE statements: ' + createStatements.length);
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

  // Drop all existing tables
  console.log('Dropping existing tables...');
  const [existingTables] = await conn.query('SHOW TABLES');
  for (const row of existingTables as any[]) {
    const name: string = Object.values(row)[0];
    await conn.query('DROP TABLE IF EXISTS `' + name + '`');
  }
  console.log('Dropped ' + (existingTables as any[]).length + ' tables\n');

  // Create tables
  console.log('Creating tables...');
  let created: number = 0;
  for (const stmt of createStatements) {
    try {
      await conn.query(stmt);
      created++;
    } catch (e: any) {
      const tblMatch: RegExpMatchArray | null = stmt.match(/CREATE TABLE `(\w+)`/);
      console.log('  SKIP CREATE ' + (tblMatch ? tblMatch[1] : '?') + ': ' + (e.message || '').slice(0, 100));
    }
  }
  console.log('Created ' + created + ' tables\n');

  // Import data
  console.log('Importing data...');
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('SET UNIQUE_CHECKS = 0');

  let executed: number = 0;
  let skipped: number = 0;
  const skipDetails: string[] = [];

  for (let i = 0; i < insertStatements.length; i++) {
    const stmt: string = insertStatements[i];
    const tableMatch: RegExpMatchArray | null = stmt.match(/INSERT INTO `(\w+)`/i);
    const tableName: string = tableMatch ? tableMatch[1] : 'unknown';
    try {
      await conn.query(stmt);
      executed++;
      if (i % 30 === 0 || i === insertStatements.length - 1) {
        console.log('  [' + (i + 1) + '/' + insertStatements.length + '] ' + tableName);
      }
    } catch (e: any) {
      skipped++;
      const errMsg: string = tableName + ': ' + (e.message || '').slice(0, 120);
      if (skipDetails.length < 20) skipDetails.push(errMsg);
    }
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