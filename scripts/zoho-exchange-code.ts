import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-icy-band-b44e0e4t-pooler.c-6.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require&channel_binding=require";

const ZOHO_CLIENT_ID = "1000.AMADSC0QBAZZ8Q9DODJBDEEH7B8C0A";
const ZOHO_CLIENT_SECRET = "d162795b4fe6fab17765c4fd9a10d541ad93a5a9e2";
const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com";

async function exchangeCode(code: string): Promise<any> {
  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const code = process.argv[2];

  if (!code) {
    console.log("==============================================");
    console.log("  ZOHO CRM - GET YOUR AUTH CODE");
    console.log("==============================================");
    console.log("");
    console.log("1. Open this URL in your browser:");
    console.log("");
    console.log(`${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?client_id=${ZOHO_CLIENT_ID}&response_type=code&scope=ZohoCRM.modules.ALL&access_type=offline&prompt=consent`);
    console.log("");
    console.log("2. Click Accept on the Zoho permission screen.");
    console.log("3. Copy the code= parameter from the browser address bar.");
    console.log("");
    console.log("4. Run this script IMMEDIATELY with the code:");
    console.log('   npx tsx scripts/zoho-exchange-code.ts YOUR_CODE');
    console.log("");
    console.log("⚠️  The code expires in 10 MINUTES. Don't delay!");
    console.log("==============================================");
    process.exit(0);
  }

  console.log("Exchanging code for tokens (must be fast - 10 min expiry)...");

  try {
    const tokens = await exchangeCode(code);

    console.log("");
    console.log("✅ Token exchange successful!");
    console.log("   Access token:  " + tokens.access_token.substring(0, 50) + "...");
    console.log("   Refresh token: " + tokens.refresh_token.substring(0, 50) + "...");
    console.log("   Expires in:    " + tokens.expires_in + " seconds");

    const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

    try {
      await pool.query("DELETE FROM zoho_connections WHERE provider = 'zoho'");

      const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

      await pool.query(
        `INSERT INTO zoho_connections (id, provider, account_id, refresh_token, access_token, access_token_expires_at, created_at, updated_at)
         VALUES ($1, 'zoho', 'self-client-production', $2, $3, $4, NOW(), NOW())`,
        [crypto.randomUUID(), tokens.refresh_token, tokens.access_token, expiresAt.toISOString()]
      );

      console.log("");
      console.log("✅ Tokens stored in database!");

      const rows = await pool.query("SELECT id, provider, account_id, refresh_token, access_token, access_token_expires_at FROM zoho_connections WHERE provider = 'zoho'");
      if (rows.rows.length > 0) {
        console.log("");
        console.log("--- Stored Connection ---");
        console.log("ID:", rows.rows[0].id);
        console.log("Account:", rows.rows[0].account_id);
        console.log("Refresh Token:", rows.rows[0].refresh_token ? "SET (len:" + rows.rows[0].refresh_token.length + ")" : "MISSING");
        console.log("Access Token:", rows.rows[0].access_token ? "SET (len:" + rows.rows[0].access_token.length + ")" : "MISSING");
        console.log("Expires at:", rows.rows[0].access_token_expires_at);
        console.log("-------------------------");
      }

      console.log("");
      console.log("==============================================");
      console.log("  DONE! Now test with: npx tsx scripts/zoho-test-api.ts");
      console.log("==============================================");
    } finally {
      await pool.end();
    }
  } catch (err: any) {
    console.error("");
    console.error("❌ FAILED:", err.message);
    console.error("");
    console.error("This usually means the code has expired.");
    console.error("Go to the URL above, get a fresh code, and run again immediately.");
    process.exit(1);
  }
}

main();
