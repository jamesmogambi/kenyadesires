import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl || databaseUrl.includes('user:password')) {
      throw new Error('DATABASE_URL is not configured');
    }
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000,
      statement_timeout: 60000,
      query_timeout: 60000,
    });
  }
  return pool;
}

export const neonPool = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
  end: () => pool?.end(),
};

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const client = getPool();
  const result = await client.query(query, params);
  return result.rows as T[];
}

export async function executeQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  const rows = await executeQuery<T>(query, params);
  return rows[0] || null;
}

export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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

// Query builder helpers
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
      // Support for operators like { operator: '>', value: 10 }
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