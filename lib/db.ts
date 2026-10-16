import mysql from 'mysql2/promise';

const env = process.env.NODE_ENV || 'development';

// MYSQL_* is this project's established naming; DB_* is accepted as an alias so
// generic/cPanel-oriented snippets work without a second pool.
const DB_HOST = process.env.MYSQL_HOST || process.env.DB_HOST;
const DB_USER = process.env.MYSQL_USER || process.env.DB_USER;
const DB_PASSWORD = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD;
const DB_NAME = process.env.MYSQL_DATABASE || process.env.DB_NAME;
const DB_PORT = process.env.MYSQL_PORT || process.env.DB_PORT || '3306';
const CONNECT_TIMEOUT_MS = Number(process.env.MYSQL_CONNECT_TIMEOUT || process.env.DB_CONNECT_TIMEOUT || 5000);
const IDLE_TIMEOUT_MS = Number(process.env.MYSQL_IDLE_TIMEOUT || process.env.DB_IDLE_TIMEOUT || 60000);

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

const mysqlPool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: Number(DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Fail fast on unreachable/slow DB instead of hanging on mysql2's default 10s
  // TCP connect timeout so queued requests don't pile up and cascade into
  // ETIMEDOUT across concurrent requests.
  connectTimeout: CONNECT_TIMEOUT_MS,
  // Recycle connections idle longer than MySQL's wait_timeout so the pool never
  // hands out a stale connection that would throw ETIMEDOUT/ECONNRESET on use.
  idleTimeout: IDLE_TIMEOUT_MS,
  // Azure MySQL requires TLS. MYSQL_SSL_CA or DB_SSL_CA can point to a CA bundle;
  // rejectUnauthorized is false because Azure presents a self-signed/internally-signed
  // cert that won't chain to any public CA bundle. Setting ca without
  // rejectUnauthorized:false causes HANDSHAKE_SSL_ERROR on self-signed certs.
  ssl: (() => {
    const sslCa = process.env.MYSQL_SSL_CA || process.env.DB_SSL_CA;
    if (sslCa) {
      const fs = require('fs');
      const caPath = /*turbopackIgnore: true*/ sslCa;
      try {
        return { ca: fs.readFileSync(caPath), rejectUnauthorized: false };
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