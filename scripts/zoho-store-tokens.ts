import { Pool } from "pg";

const dbUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-icy-band-b44e0e4t-pooler.c-6.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require&channel_binding=require";

async function main() {
  console.log("Connecting to database...");
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await pool.query("SELECT 1 as test");
    console.log("DB connection: OK");

    const existing = await pool.query("SELECT * FROM zoho_connections WHERE provider = 'zoho'");
    if (existing.rows.length > 0) {
      console.log("Connection already exists in DB:");
      console.log("  ID:", existing.rows[0].id);
      console.log("  Refresh Token:", existing.rows[0].refresh_token ? "SET" : "MISSING");
      console.log("  Access Token:", existing.rows[0].access_token ? "SET" : "MISSING");
      console.log("  Account ID:", existing.rows[0].account_id);
    } else {
      console.log("No connection found. Inserting tokens...");
      await pool.query("DELETE FROM zoho_connections WHERE provider = 'zoho'");

      const result = await pool.query(
        `INSERT INTO zoho_connections (id, provider, account_id, refresh_token, access_token, access_token_expires_at, created_at, updated_at)
         VALUES ($1, 'zoho', 'self-client-production', $2, $3, NOW() + interval '1 hour', NOW(), NOW())
         RETURNING id, provider, account_id`,
        [
          crypto.randomUUID(),
          "1000.7c7c127a4aec12c34f0454b5a74ed681.1c20da6c65809aa42ffbec96a88f3a75",
          "1000.2ce9937732485042f75a5fa016322a12.32ac2e32a321e4cc00d9a4b62c73a3f9",
        ]
      );

      console.log("Tokens stored successfully!");
      console.log("  Connection ID:", result.rows[0].id);
      console.log("  Account ID:", result.rows[0].account_id);

      const check = await pool.query("SELECT * FROM zoho_connections WHERE provider = 'zoho'");
      console.log("  Refresh Token present:", !!check.rows[0]?.refresh_token);
      console.log("  Access Token present:", !!check.rows[0]?.access_token);
      console.log("  Expires at:", check.rows[0]?.access_token_expires_at);
    }
  } catch (e: any) {
    console.error("Error:", e.message, e.code);
  } finally {
    await pool.end();
  }
}

main();
