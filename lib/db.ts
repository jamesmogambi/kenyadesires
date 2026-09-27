import mysql from 'mysql2/promise';

const env = process.env.NODE_ENV || 'development';

console.log(`\n🗄️  [${env.toUpperCase()}] Initializing MySQL connection pool...`);
console.log(`   Host: ${process.env.MYSQL_HOST}`);
console.log(`   Database: ${process.env.MYSQL_DATABASE}`);
console.log(`   User: ${process.env.MYSQL_USER}`);
console.log(`   Port: ${process.env.MYSQL_PORT || 3306}`);

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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