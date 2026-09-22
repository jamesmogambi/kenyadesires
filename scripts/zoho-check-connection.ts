import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-icy-band-b44e0e4t-pooler.c-6.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require&channel_binding=require";

async function main() {
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    const rows = await pool.query("SELECT * FROM zoho_connections WHERE provider = 'zoho'");
    if (rows.rows.length === 0) {
      console.log("No Zoho connections stored yet.");
    } else {
      for (const row of rows.rows) {
        console.log("Connection found:");
        console.log("  ID:", row.id);
        console.log("  Account ID:", row.account_id);
        console.log("  Refresh Token:", row.refresh_token ? "SET (length: " + row.refresh_token.length + ")" : "MISSING");
        console.log("  Access Token:", row.access_token ? "SET (length: " + row.access_token.length + ")" : "MISSING");
        console.log("  Expires at:", row.access_token_expires_at);
        console.log("  Created:", row.created_at);
        console.log("  Updated:", row.updated_at);
      }
    }
  } finally {
    await pool.end();
  }
}

main();
