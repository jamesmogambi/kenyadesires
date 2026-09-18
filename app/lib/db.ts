import { neon, neonConfig } from '@neondatabase/serverless';

// Use HTTP for queries instead of WebSockets to avoid needing the 'ws' package
neonConfig.poolQueryViaFetch = true;

export const sql = neon(process.env.DATABASE_URL!);
