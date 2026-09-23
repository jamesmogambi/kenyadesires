import mysqlPool from '@/lib/db';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

const MAX_QUERY_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 10000;

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
    'PROTOCOL_CONNECTION_LOST',
    'ER_CON_COUNT_ERROR',
  ];
  return (
    connectionErrorCodes.some((c) => code === c || code.includes(c)) ||
    /connection|connect|timeout|reset|refused|network|dns|host/i.test(
      error.message || ''
    )
  );
}

function convertParams(query: string, params: any[]): { query: string; params: any[] } {
  let paramIndex = 0;
  const newQuery = query.replace(/\$(\d+)/g, (_, numStr) => {
    const idx = parseInt(numStr, 10) - 1;
    if (idx >= 0 && idx < params.length) {
      return '?';
    }
    return '?';
  });
  return { query: newQuery, params };
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
        `[MySQL] Connection error (attempt ${attempt}/${maxRetries}), retrying in ${Math.round(delay)}ms:`,
        error.message
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

export const neonPool = {
  query: (text: string, params?: any[]): Promise<[RowDataPacket[], any]> => {
    return executeWithRetry(async () => {
      const { query, params: newParams } = convertParams(text, params || []);
      return mysqlPool.query(query, newParams) as Promise<[RowDataPacket[], any]>;
    });
  },
  connect: (): Promise<PoolConnection> => {
    return executeWithRetry(async () => {
      return mysqlPool.getConnection();
    });
  },
  end: (): Promise<void> => {
    return mysqlPool.end();
  },
};

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  return executeWithRetry(async () => {
    const { query: newQuery, params: newParams } = convertParams(query, params);
    const [rows] = await mysqlPool.query(newQuery, newParams);
    return rows as T[];
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
  callback: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  return executeWithRetry(async () => {
    const connection = await mysqlPool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
      }
      throw error;
    } finally {
      connection.release();
    }
  });
}

export function sql(strings: TemplateStringsArray, ...values: any[]) {
  let query = '';
  const params: any[] = [];
  strings.forEach((str, i) => {
    query += str;
    if (i < values.length) {
      params.push(values[i]);
      query += '?';
    }
  });
  return { query, params };
}

export function escapeIdentifier(identifier: string): string {
  return `\`${identifier.replace(/`/g, '``')}\``;
}

export function escapeLiteral(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
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
        conditions.push(`${escapeIdentifier(columnName)} && $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    } else if (typeof value === 'object' && value.operator) {
      conditions.push(`${escapeIdentifier(columnName)} ${value.operator} $${paramIndex}`);
      params.push(value.value);
      paramIndex++;
    } else {
      conditions.push(`${escapeIdentifier(columnName)} = $${paramIndex}`);
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
  return `ORDER BY ${escapeIdentifier(columnName)} ${sortOrder.toUpperCase()}`;
}

export function buildPaginationClause(page: number, limit: number, paramStart: number): { clause: string; params: any[] } {
  const offset = (page - 1) * limit;
  return {
    clause: `LIMIT $${paramStart} OFFSET $${paramStart + 1}`,
    params: [limit, offset],
  };
}