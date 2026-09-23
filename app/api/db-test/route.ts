import mysqlPool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = (await mysqlPool.query('SELECT 1 AS alive')) as unknown as
      [{ alive: number }];
    return NextResponse.json({
      ok: true,
      db: 'mysql',
      alive: rows?.[0]?.alive ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[db-test] MySQL connection failed:', (error as Error).message);
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 500 }
    );
  }
}
