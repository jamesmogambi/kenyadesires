import mysqlPool from '@/lib/db';
import { client as sanityClient } from '@/lib/sanity/client';
import { NextResponse } from 'next/server';

async function checkMySQL() {
  try {
    const start = Date.now();
    await mysqlPool.query('SELECT 1 AS alive');
    const latency = Date.now() - start;
    return { ok: true, latency, host: process.env.MYSQL_HOST, database: process.env.MYSQL_DATABASE };
  } catch (error) {
    return { ok: false, error: (error as Error).message, host: process.env.MYSQL_HOST, database: process.env.MYSQL_DATABASE };
  }
}

async function checkSanity() {
  try {
    const start = Date.now();
    await sanityClient.fetch('*[_type == "post"][0]._id');
    const latency = Date.now() - start;
    return {
      ok: true,
      latency,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    };
  } catch (error) {
    return {
      ok: false,
      error: (error as Error).message,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    };
  }
}

export async function GET() {
  const env = process.env.NODE_ENV || 'development';
  const [mysql, sanity] = await Promise.all([checkMySQL(), checkSanity()]);

  return NextResponse.json({
    environment: env,
    timestamp: new Date().toISOString(),
    databases: {
      mysql,
      sanity,
    },
    overall: mysql.ok && sanity.ok ? 'healthy' : 'degraded',
  });
}