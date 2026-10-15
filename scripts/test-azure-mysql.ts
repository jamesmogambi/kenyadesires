#!/usr/bin/env node
/**
 * Azure MySQL connectivity test.
 * Run: npx tsx scripts/test-azure-mysql.ts
 *
 * Set these env vars before running:
 *   MYSQL_HOST=kenyadesires.mysql.database.azure.com
 *   MYSQL_USER=jamesadmin
 *   MYSQL_PASSWORD=your_password
 *   MYSQL_DATABASE=your_database
 *   MYSQL_SSL_CA=/path/to/BaltimoreCyberTrustRoot.crt.pem  (optional)
 */

import mysql from 'mysql2/promise';

async function testAzureConnection() {
  const host = process.env.MYSQL_HOST || process.env.DB_HOST;
  const user = process.env.MYSQL_USER || process.env.DB_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
  const database = process.env.MYSQL_DATABASE || process.env.DB_NAME;
  const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || '3306');
  const sslCa = process.env.MYSQL_SSL_CA || process.env.DB_SSL_CA;

  if (!host || !user || !password || !database) {
    console.error('❌ Missing required env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE');
    process.exit(1);
  }

  console.log('Testing Azure MySQL connection...');
  console.log(`   Host: ${host}`);
  console.log(`   User: ${user}`);
  console.log(`   Database: ${database}`);
  console.log(`   Port: ${port}`);
  console.log(`   SSL CA: ${sslCa ? sslCa : '(none - using rejectUnauthorized:false)'}`);

  const config: mysql.ConnectionOptions = {
    host,
    user,
    password,
    database,
    port,
    ssl: sslCa
      ? { ca: require('fs').readFileSync(sslCa) }
      : { rejectUnauthorized: false },
  };

  let conn: mysql.Connection | null = null;
  try {
    conn = await mysql.createConnection(config);
    const [rows] = await conn.query('SELECT VERSION() AS version, CURRENT_USER() AS user, DATABASE() AS db');
    console.log('\n✅ Connection successful!');
    console.log(`   MySQL Version: ${(rows as any)[0].version}`);
    console.log(`   Connected as: ${(rows as any)[0].user}`);
    console.log(`   Database: ${(rows as any)[0].db}`);

    // Test a simple table query
    const [tables] = await conn.query(
      `SELECT COUNT(*) AS count FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [database],
    );
    console.log(`   Tables in database: ${(tables as any)[0].count}`);
  } catch (err: any) {
    console.error('\n❌ Connection failed:');
    console.error(`   Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Is the server running? Check host/port/firewall.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Invalid credentials. Check MYSQL_USER/MYSQL_PASSWORD.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database does not exist. Check MYSQL_DATABASE.');
    } else if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      console.error('   → Network timeout. Check firewall rules and SSL settings.');
    }
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

testAzureConnection();