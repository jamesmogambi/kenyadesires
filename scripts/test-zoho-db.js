const { Pool } = require("pg");

const dbUrl =
  "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-silent-sun-b4o0zg7w-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    // 1. Test DB connection
    await pool.query("SELECT 1 as test");
    console.log("[1/5] DB connection: OK");

    // 2. Check table
    const exists = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zoho_connections')"
    );
    const tableExists = exists.rows[0].exists;
    console.log("[2/5] zoho_connections exists:", tableExists);

    if (!tableExists) {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS zoho_connections (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), provider TEXT NOT NULL, account_id TEXT, refresh_token TEXT NOT NULL, access_token TEXT, access_token_expires_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());"
      );
      console.log("       Table created");

      try {
        await pool.query(
          "CREATE TRIGGER trigger_zoho_connections_updated_at BEFORE UPDATE ON zoho_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
        );
        console.log("       Trigger created");
      } catch {
        console.log("       Trigger already exists");
      }
    }

    // 3. Verify table structure
    const columns = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'zoho_connections' ORDER BY ordinal_position;"
    );
    console.log("[3/5] Table columns:");
    for (const col of columns.rows) {
      console.log("       " + col.column_name + ": " + col.data_type);
    }

    // 4. Test insert/read
    const testId = "test-" + Date.now();
    await pool.query(
      "INSERT INTO zoho_connections (id, provider, account_id, refresh_token, access_token, access_token_expires_at, created_at, updated_at) VALUES ($1, 'zoho', 'test-account', 'test-refresh-123', 'test-access-456', NOW() + interval '1 hour', NOW(), NOW());",
      [testId]
    );
    console.log("[4/5] Test insert: OK");

    const rows = await pool.query("SELECT * FROM zoho_connections WHERE id = $1", [testId]);
    console.log("       Read back: " + rows.rows.length + " row(s)");
    console.log("       Provider: " + rows.rows[0].provider);
    console.log("       Refresh token masked: " + rows.rows[0].refresh_token.substring(0, 4) + "****");
    console.log("       Access token masked: " + rows.rows[0].access_token.substring(0, 4) + "****");

    // 5. Check connections count
    const zohoRows = await pool.query("SELECT count(*) FROM zoho_connections WHERE provider = 'zoho'");
    console.log("[5/5] Total Zoho connections in DB: " + zohoRows.rows[0].count);

    // Cleanup
    await pool.query("DELETE FROM zoho_connections WHERE id = $1", [testId]);
    console.log("       Test record cleaned up");

    pool.end();
  } catch (err) {
    console.error("Error:", err.message);
    pool.end();
  }
}

main();
