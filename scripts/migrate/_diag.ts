import { mysqlPool, neonPool, log } from './config';

(async () => {
  const [cnt] = await mysqlPool.query('SELECT COUNT(*) n FROM regions');
  log('regions MySQL count:', (cnt as any)[0].n);
  const [neon] = await neonPool.query('SELECT COUNT(*) n FROM regions');
  log('regions Neon count:', (neon as any)[0].n);

  await mysqlPool.end();
  try { await neonPool.end(); } catch {}
  process.exit(0);
})().catch((e) => { console.error('TOP', e && e.message ? e.message : e); process.exit(1); });