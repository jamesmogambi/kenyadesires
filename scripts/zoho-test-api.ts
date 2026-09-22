const ZOHO_API_BASE_URL = "https://www.zohoapis.com";

async function getZohoAccessToken() {
  const dbUrl = "postgresql://neondb_owner:npg_FVarfndqK9m1@ep-icy-band-b44e0e4t-pooler.c-6.us-east-2.aws.neon.tech/neondb?uselibpqcompat=true&sslmode=require&channel_binding=require";
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    const rows = await pool.query("SELECT * FROM zoho_connections WHERE provider = 'zoho' LIMIT 1");
    await pool.end();

    if (rows.rows.length === 0) {
      throw new Error("Zoho CRM is not connected");
    }

    const connection = rows.rows[0];
    const expiresAt = new Date(connection.access_token_expires_at).getTime();
    const now = Date.now();

    if (expiresAt > now + 60000) {
      return { access_token: connection.access_token, expires_at: expiresAt };
    }

    // Refresh needed
    const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com";
    const ZOHO_CLIENT_ID = "1000.J9MGTMSFQ80M0WYI3OYDDCVVMHM58J";
    const ZOHO_CLIENT_SECRET = "995bf5acbe11b49d1c0229bda7f203f6467f8e4e54";

    const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: connection.refresh_token,
        client_id: ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Token refresh failed");

    const newExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    await pool.query(
      "UPDATE zoho_connections SET access_token = $1, access_token_expires_at = $2, updated_at = NOW() WHERE provider = 'zoho'",
      [data.access_token, new Date(newExpiresAt).toISOString()]
    );
    await pool.end();

    return { access_token: data.access_token, expires_at: newExpiresAt };
  } catch (e) {
    await pool.end();
    throw e;
  }
}

async function main() {
  console.log("Testing Zoho CRM API...");
  try {
    const tokenData = await getZohoAccessToken();
    console.log("Token obtained:", tokenData.access_token.substring(0, 40) + "...");
    console.log("Expires at:", tokenData.expires_at);

    const url = `${ZOHO_API_BASE_URL}/crm/v2/Leads`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Zoho-oauthtoken ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("API Status:", response.status);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2).substring(0, 500));
  } catch (err: any) {
    console.error("FAILED:", err.message);
  }
}

main();
