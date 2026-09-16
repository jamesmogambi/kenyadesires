import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('user:password')) {
  console.error('ERROR: DATABASE_URL is not set or is a placeholder');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  try {
    const version: any = await sql`SELECT version() as version`;
    console.log('PostgreSQL version:', version[0]?.version?.substring(0, 100));

    // Check schemas
    const schemas: any = await sql`SELECT schema_name FROM information_schema.schemata`;
    console.log('\nSchemas:', schemas.map((s: any) => s.schema_name));

    // Check for tables in all schemas
    for (const schema of schemas) {
      const tables: any = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = ${schema.schema_name}
      `;
      if (tables.length > 0) {
        console.log(`\nTables in ${schema.schema_name}:`, tables.map((t: any) => t.table_name));
      }
    }

    // Try a direct query
    const result: any = await sql.raw('SHOW search_path');
    console.log('\nSearch path:', JSON.stringify(result));

    // Try direct CREATE to test
    try {
      await sql.raw('CREATE TABLE IF NOT EXISTS test_table (id TEXT PRIMARY KEY)');
      const check: any = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'test_table')`;
      console.log('Test table exists:', check[0]?.exists);
    } catch (err: any) {
      console.log('Direct CREATE error:', err.message);
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

main();
