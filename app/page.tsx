import { sql } from '@/app/lib/db';

async function getDbVersion() {
  const result = await sql`SELECT version()`;
  return result[0].version as string;
}

export default async function Home() {
  const version = await getDbVersion();
  return (
    <main>
      <h1>Next.js + Neon</h1>
      <p>PostgreSQL Version: {version}</p>
    </main>
  );
}
