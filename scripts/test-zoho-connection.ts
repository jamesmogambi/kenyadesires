const { Pool } = require("pg");

const dbUrl =
  "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-silent-sun-b4o0zg7w-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    // 1. Test connection
    const conn = await pool.query("SELECT 1 as test");
    console.log("DB connection: OK");

    // 2. Check table
    const exists = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'zoho_connections')"
    );
    console.log("zoho_connections exists:", exists.rows[0].exists);

    if (!exists.rows[0].exists) {
      // 3. Create table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS zoho_connections (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          provider TEXT NOT NULL,
          account_id TEXT,
          refresh_token TEXT NOT NULL,
          access_token TEXT,
          access_token_expires_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log("zoho_connections table created");

      // 4. Create trigger
      try {
        await pool.query(
          "CREATE TRIGGER trigger_zoho_connections_updated_at BEFORE UPDATE ON zoho_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();"
        );
        console.log("Trigger created");
      } catch (e) {
        console.log("Trigger may already exist:", e.message);
      }
    }

    // 5. Check current connections
    const rows = await pool.query("SELECT * FROM zoho_connections LIMIT 1");
    console.log("Existing connections:", rows.rowCount);

    // 6. Test Zoho authorize URL
    console.log("\n=== Test 1: Authorize URL ===");
    const authUrl = "https://accounts.zoho.com/oauth/v2/auth?" + new URLSearchParams({
      client_id: "1000.AMADSC0QBAZZ8Q9DODJBDEEH7B8C0A",
      response_type: "code",
      redirect_uri: "http://localhost:3000/api/zoho/callback",
      scope: "ZohoCRM.leads ZohoCRM.contacts",
      access_type: "offline",
      prompt: "consent",
    }).toString();
    console.log("Authorize URL generated:", authUrl.substring(0, 80) + "...");
    console.log("URL includes all required params:", 
      authUrl.includes("client_id=") &&
      authUrl.includes("response_type=code") &&
      authUrl.includes("redirect_uri=") &&
      authUrl.includes("scope=") &&
      authUrl.includes("access_type=offline") &&
      authUrl.includes("prompt=consent")
    );

    // 7. Test token exchange (would need real code from Zoho)
    console.log("\n=== Test 2: Token Exchange (requires real auth code) ===");
    console.log("To complete OAuth flow:");
    console.log("1. Visit: " + authUrl.substring(0, 60) + "...");
    console.log("2. Authorize the app in Zoho");
    console.log("3. Zoho will redirect to: http://localhost:3000/api/zoho/callback?code=...");
    console.log("4. The callback will exchange the code for tokens");

    // 8. Test getZohoAccessToken with no connection
    console.log("\n=== Test 3: getZohoAccessToken (no connection) ===");
    try {
      // We need to import the module - let's use a direct test
      console.log("Expected: Error 'Zoho CRM is not connected'");
      console.log("This will be tested when calling /api/zoho/test without a stored connection");
    } catch (e) {
      console.log("Error:", e.message);
    }

    pool.end();
  } catch (err) {
    console.error("Error:", err.message);
    pool.end();
  }
}

main();
