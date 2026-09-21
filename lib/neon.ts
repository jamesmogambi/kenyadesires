import { Pool, PoolClient, QueryResult } from 'pg';

let pool: Pool | null = null;

const MAX_QUERY_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 10000;

function getPoolConfig(): Record<string, any> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl || databaseUrl.includes('user:password')) {
    throw new Error('DATABASE_URL is not configured');
  }

  return {
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 20,
    min: 2,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 30000,
    statement_timeout: 60000,
    query_timeout: 60000,
    idle_in_transaction_session_timeout: 30000,
    keepalives: 1,
    keepalives_idle: 30,
    keepalives_interval: 10,
    keepalives_count: 5,
    tcpKeepAlive: true,
  };
}

function createPool(): Pool {
  const config = getPoolConfig();
  const newPool = new Pool(config);

  newPool.on('error', (err: Error) => {
    console.error('[Neon] Pool connection error:', err.message);
  });

  newPool.on('connect', (client: PoolClient) => {
    console.info('[Neon] New pool connection established');
  });

  newPool.on('remove', (client: PoolClient) => {
    console.info('[Neon] Pool connection removed');
  });

  return newPool;
}

function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isConnectionError(error: any): boolean {
  if (!error) return false;
  const code = error.code || (error.message || '').toUpperCase();
  const connectionErrorCodes = [
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EPIPE',
    'SQLITE_NOTADB',
    '28P01',
    '08000',
    '08003',
    '08006',
    '08007',
    '08P01',
  ];
  return (
    connectionErrorCodes.some((c) => code === c || code.includes(c)) ||
    /connection|connect|timeout|reset|refused|network|dns|host/i.test(
      error.message || ''
    )
  );
}

async function executeWithRetry<T>(
  fn: (attempt: number) => Promise<T>,
  maxRetries: number = MAX_QUERY_RETRIES
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error: any) {
      lastError = error;

      if (!isConnectionError(error)) {
        throw error;
      }

      if (attempt >= maxRetries) {
        break;
      }

      const delay = Math.min(
        BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1) + Math.random() * 100,
        MAX_RETRY_DELAY_MS
      );

      console.warn(
        `[Neon] Connection error (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms:`,
        error.message
      );

      if (pool) {
        try {
          pool.end();
        } catch {
          // ignore pool end errors
        }
        pool = null;
      }

      await sleep(delay);
    }
  }

  throw lastError;
}

export const neonPool = {
  query: (text: string, params?: any[]): Promise<QueryResult<any>> => {
    return executeWithRetry((attempt) => {
      if (attempt > 1 && pool) {
        try {
          pool.end();
        } catch {
          // ignore
        }
        pool = null;
      }
      return getPool().query(text, params);
    });
  },
  connect: (): Promise<PoolClient> => {
    return executeWithRetry((attempt) => {
      if (attempt > 1 && pool) {
        try {
          pool.end();
        } catch {
          // ignore
        }
        pool = null;
      }
      return getPool().connect();
    });
  },
  end: (): Promise<void> => {
    if (pool) {
      const p = pool;
      pool = null;
      return p.end();
    }
    return Promise.resolve();
  },
};

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  return executeWithRetry((attempt) => {
    if (attempt > 1 && pool) {
      try {
        pool.end();
      } catch {
        // ignore
      }
      pool = null;
    }
    const client = getPool();
    return client.query(query, params).then((result) => result.rows as T[]);
  });
}

export async function executeQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows[0] || null;
}

export async function executeTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  return executeWithRetry((attempt) => {
    if (attempt > 1 && pool) {
      try {
        pool.end();
      } catch {
        // ignore
      }
      pool = null;
    }

    const client = getPool().connect();

    return client.then(async (clientInstance: PoolClient) => {
      try {
        await clientInstance.query('BEGIN');
        const result = await callback(clientInstance);
        await clientInstance.query('COMMIT');
        return result;
      } catch (error) {
        try {
          await clientInstance.query('ROLLBACK');
        } catch {
          // ignore rollback errors
        }
        throw error;
      } finally {
        clientInstance.release();
      }
    });
  });
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  let query = '';
  const params: any[] = [];
  strings.forEach((str, i) => {
    query += str;
    if (i < values.length) {
      params.push(values[i]);
      query += `$${params.length}`;
    }
  });
  return { query, params };
}

export function escapeIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

export function escapeLiteral(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Array.isArray(value)) return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function buildWhereClause(filters: Record<string, any>, paramStart: number = 1): { clause: string; params: any[]; nextParam: number } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = paramStart;

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    
    const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        conditions.push(`${columnName} && $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    } else if (typeof value === 'object' && value.operator) {
      conditions.push(`${columnName} ${value.operator} $${paramIndex}`);
      params.push(value.value);
      paramIndex++;
    } else {
      conditions.push(`${columnName} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
    nextParam: paramIndex,
  };
}

export function buildOrderByClause(sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): string {
  const columnName = sortBy.replace(/([A-Z])/g, '_$1').toLowerCase();
  return `ORDER BY ${columnName} ${sortOrder.toUpperCase()}`;
}

export function buildPaginationClause(page: number, limit: number, paramStart: number): { clause: string; params: any[] } {
  const offset = (page - 1) * limit;
  return {
    clause: `LIMIT $${paramStart} OFFSET $${paramStart + 1}`,
    params: [limit, offset],
  };
}
