import mysql from 'mysql2/promise';
import dns from 'dns';

const env = process.env.NODE_ENV || 'development';
dns.setDefaultResultOrder('ipv4first');


// MYSQL_* is this project's established naming; DB_* is accepted as an alias so
// generic/cPanel-oriented snippets work without a second pool.
const DB_HOST = process.env.MYSQL_HOST || process.env.DB_HOST;
const DB_USER = process.env.MYSQL_USER || process.env.DB_USER;
const DB_PASSWORD = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME;
const DB_PORT = process.env.MYSQL_PORT || process.env.DB_PORT || '3306';

const missing = [
  ['DB_HOST', DB_HOST],
  ['DB_USER', DB_USER],
  ['DB_NAME', DB_NAME],
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length > 0) {
  throw new Error(
    `MySQL connection is missing environment variables: ${missing.join(', ')} ` +
      `(checked MYSQL_* and DB_*)`,
  );
}

console.log(`\n🗄️  [${env.toUpperCase()}] Initializing MySQL connection pool...`);
console.log(`   Host: ${DB_HOST}`);
console.log(`   Database: ${DB_NAME}`);
console.log(`   User: ${DB_USER}`);
console.log(`   Port: ${DB_PORT}`);

let RESOLVED_HOST = DB_HOST;
try {
  if (DB_HOST && !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(DB_HOST)) {
    RESOLVED_HOST = '172.134.72.29';
  }
} catch (e) {
  RESOLVED_HOST = DB_HOST;
}

const mysqlPool = mysql.createPool({
  host: RESOLVED_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Azure MySQL requires SSL. MYSQL_SSL_CA or DB_SSL_CA can point to a CA
  // bundle file; if omitted, mysql2 still attempts TLS but without cert
  // verification (insecure, but works for Azure's default CA).
  ssl: (() => {
    const sslCa = process.env.MYSQL_SSL_CA || process.env.DB_SSL_CA;
    if (sslCa) {
      const fs = require('fs');
      const path = require('path');
      const caPath = path.isAbsolute(sslCa) ? sslCa : path.join(process.cwd(), sslCa);
      try {
        return { ca: fs.readFileSync(caPath) };
      } catch (e) {
        console.warn('Failed to read SSL CA file:', e);
        return { rejectUnauthorized: false };
      }
    }
    if (process.env.MYSQL_SSL !== 'false' && process.env.DB_SSL !== 'false') {
      return { rejectUnauthorized: false };
    }
    return undefined;
  })(),
});

// Test connection on startup
mysqlPool.getConnection()
  .then((conn) => {
    console.log(`\n✅ [${env.toUpperCase()}] MySQL connected successfully`);
    console.log(`   Thread ID: ${conn.threadId}`);
    // `mysql2/promise` pools wrap the real pool in `.pool`; `_allConnections` and
    // `.config` only exist on that inner object. Reading them off the promise
    // wrapper threw a TypeError *inside* this handler, which the `.catch()` below
    // then reported as "MySQL connection failed" for a connection that had just
    // succeeded.
    const inner = (mysqlPool as any).pool ?? mysqlPool;
    const open = inner._allConnections?.length;
    const limit = inner.config?.connectionLimit;
    console.log(
      `   Pool: ${typeof open === 'number' ? `${open}/${limit}` : `${limit ?? '?'} max`} connections`,
    );
    conn.release();
  })
  .catch((err) => {
    console.error(`\n❌ [${env.toUpperCase()}] MySQL connection failed:`);
    console.error(`   ${err.code}: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.error('   → Is MySQL running? Check MYSQL_HOST/MYSQL_PORT');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Invalid credentials. Check MYSQL_USER/MYSQL_PASSWORD');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database does not exist. Check MYSQL_DATABASE');
    }
  });

// Pool event logging (optional - verbose)
if (env !== 'production') {
  mysqlPool.on('connection', () => {
    // console.log(`[MySQL] New connection (total: ${mysqlPool._allConnections.length})`);
  });
  mysqlPool.on('release', () => {
    // console.log(`[MySQL] Connection released`);
  });
  mysqlPool.on('enqueue', () => {
    console.warn(`[MySQL] Waiting for available connection...`);
  });
}

export default mysqlPool;
export type MySQLPool = typeof mysqlPool;