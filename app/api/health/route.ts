import { neonPool } from '@/lib/neon';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await neonPool.query('SELECT 1');
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Health Check] Database connection failed:', error);
    return NextResponse.json(
      { ok: false, error: 'Database unavailable' },
      { status: 500 }
    );
  }
}