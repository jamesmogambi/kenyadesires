import { Client } from 'pg';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('user:password')) {
  console.error('ERROR: DATABASE_URL is not set or is a placeholder');
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

  // Functions and triggers that need $$ delimiters - run as raw blocks
  const functions = [
    `-- Function: update_escort_search
CREATE OR REPLACE FUNCTION update_escort_search() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO escort_search (id, name, username, about, town, estate, categories, practices, search_vector)
    SELECT
        NEW.id,
        NEW.name,
        NEW.username,
        NEW.about,
        NEW.locations->>'town',
        NEW.locations->>'estate',
        NEW.categories,
        NEW.practices,
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.username, '') || ' ' || COALESCE(NEW.about, '')), 'A') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.locations->>'town', '') || ' ' || COALESCE(NEW.locations->>'estate', '')), 'B') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.categories, ' ')), 'C') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.practices, ' ')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,

    `-- Function: update_updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,

    `-- Trigger: trigger_escort_search
CREATE OR REPLACE TRIGGER trigger_escort_search
    AFTER INSERT OR UPDATE ON escorts
    FOR EACH ROW EXECUTE FUNCTION update_escort_search();`,

    `-- Triggers for updated_at
CREATE TRIGGER trigger_escorts_updated_at BEFORE UPDATE ON escorts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();`,
  ];

  let success = 0;
  let failed = 0;

  for (const func of functions) {
    const shortLabel = func.substring(0, 60).replace(/\s+/g, ' ');
    try {
      await client.query(func);
      console.log(`  ✅ ${shortLabel}...`);
      success++;
    } catch (err: any) {
      console.log(`  ❌ ${shortLabel}...`);
      console.log(`     Error: ${err.message?.substring(0, 200)}`);
      failed++;
    }
  }

  console.log(`\n✅ Functions & triggers: ${success} applied, ${failed} failed\n`);

  // Final verification
  const result = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name
  `);
  console.log('📊 All tables (' + result.rows.length + '):');
  for (const row of result.rows) {
    console.log(`  - ${row.table_name}`);
  }

  // Check functions
  const funcs = await client.query(`
    SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name
  `);
  console.log(`\n📋 Functions (${funcs.rows.length}):`);
  for (const row of funcs.rows) {
    console.log(`  - ${row.routine_name}`);
  }

  // Check triggers
  const triggers = await client.query(`
    SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table
  `);
  console.log(`\n📋 Triggers (${triggers.rows.length}):`);
  for (const row of triggers.rows) {
    console.log(`  - ${row.trigger_name} ON ${row.event_object_table}`);
  }

  await client.end();
  console.log('\n🎉 Database setup complete!\n');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
