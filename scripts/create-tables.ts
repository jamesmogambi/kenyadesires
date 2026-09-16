import { Client } from 'pg';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('user:password')) {
  console.error('ERROR: DATABASE_URL is not set or is a placeholder');
  console.error('Set it in .env.local');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected to Neon\n');
  } catch (err: any) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  const schema = readFileSync('./database/schema.sql', 'utf-8');

  // Remove comments but keep the SQL intact
  const cleanSql = schema
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    })
    .join('\n');

  // Split by semicolons (simple parser that handles quoted strings)
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      current = current.trim();
      if (current) statements.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  current = current.trim();
  if (current) statements.push(current);

  console.log(`📋 Found ${statements.length} SQL statements\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const shortLabel = stmt.substring(0, 60).replace(/\s+/g, ' ');
    try {
      await client.query(stmt);
      console.log(`  ✅ [${i + 1}/${statements.length}] ${shortLabel}...`);
      success++;
    } catch (err: any) {
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        console.log(`  ⏭️ [${i + 1}/${statements.length}] SKIP (exists): ${shortLabel}...`);
        success++;
      } else {
        console.log(`  ❌ [${i + 1}/${statements.length}] ERROR: ${shortLabel}...`);
        console.log(`     Error: ${err.message?.substring(0, 200)}`);
        failed++;
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Schema applied: ${success} statements`);
  if (failed > 0) console.log(`⚠️  Failed: ${failed} statements`);
  console.log(`${'='.repeat(50)}\n`);

  // Verify tables
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `);
  console.log('📊 Tables in database:');
  for (const row of result.rows) {
    console.log(`  - ${row.table_name}`);
  }
  console.log(`\n✅ Total tables: ${result.rows.length}`);

  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
