import { mysqlPool, neonPool, log } from './config';

(async () => {
  const neonRes = await neonPool.query('SELECT * FROM escort_search ORDER BY id LIMIT 1');
  const mysqlRes = await mysqlPool.query('SELECT * FROM escort_search ORDER BY id LIMIT 1');
  log('Neon cols:', Object.keys(neonRes.rows[0]).join(','));
  log('MySQL cols:', Object.keys(mysqlRes[0]).join(','));
  await mysqlPool.end();
  await neonPool.end();
  process.exit(0);
})().catch((e) => { console.error('TOP', e && e.message ? e.message : e); process.exit(1); });