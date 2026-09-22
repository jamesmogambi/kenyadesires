import { executeQuery, executeTransaction } from "@/lib/neon";

const ZOHO_CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const ZOHO_CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const ZOHO_ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || "https://accounts.zoho.com";
const ZOHO_API_BASE_URL = process.env.ZOHO_API_BASE_URL || "https://www.zohoapis.com";

const ZOHO_SCOPES = "ZohoCRM.leads ZohoCRM.contacts";

export function getZohoAuthorizeUrl() {
  if (!ZOHO_CLIENT_ID || !ZOHO_REDIRECT_URI) {
    throw new Error("ZOHO_CLIENT_ID or ZOHO_REDIRECT_URI is not configured");
  }

  const params = new URLSearchParams({
    client_id: ZOHO_CLIENT_ID,
    response_type: "code",
    redirect_uri: ZOHO_REDIRECT_URI,
    scope: ZOHO_SCOPES,
    access_type: "offline",
    prompt: "consent",
  });

  return `${ZOHO_ACCOUNTS_URL}/oauth/v2/auth?${params.toString()}`;
}

interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
}

export async function exchangeCodeForTokens(code: string): Promise<ZohoTokens> {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REDIRECT_URI) {
    throw new Error("Zoho OAuth credentials are not configured");
  }

  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      redirect_uri: ZOHO_REDIRECT_URI,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error_description || data.error || "Token exchange failed";
    throw new Error(`Zoho token exchange failed: ${errorMsg}`);
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

async function refreshAccessToken(refreshToken: string): Promise<ZohoTokens> {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET) {
    throw new Error("Zoho OAuth credentials are not configured");
  }

  const response = await fetch(`${ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Zoho token refresh failed");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
}

export async function storeZohoConnection(tokens: ZohoTokens, accountId?: string | null) {
  await executeTransaction(async (client) => {
    await client.query(
      `DELETE FROM zoho_connections WHERE provider = $1`,
      ["zoho"],
    );

    await client.query(
      `INSERT INTO zoho_connections (id, provider, account_id, refresh_token, access_token, access_token_expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [
        crypto.randomUUID(),
        "zoho",
        accountId || null,
        tokens.refresh_token,
        tokens.access_token,
        new Date(tokens.expires_at).toISOString(),
      ],
    );
  });
}

export async function getStoredZohoConnection() {
  const rows = await executeQuery<{
    id: string;
    provider: string;
    account_id: string | null;
    refresh_token: string;
    access_token: string;
    access_token_expires_at: string;
  }>(
    `SELECT * FROM zoho_connections WHERE provider = $1 LIMIT 1`,
    ["zoho"],
  );

  return rows[0] || null;
}

export async function getZohoAccessToken(): Promise<{
  access_token: string;
  expires_at: number;
}> {
  const connection = await getStoredZohoConnection();

  if (!connection) {
    throw new Error("Zoho CRM is not connected");
  }

  const expiresAt = new Date(connection.access_token_expires_at).getTime();
  const now = Date.now();
  const bufferMs = 60 * 1000;

  if (expiresAt > now + bufferMs) {
    return {
      access_token: connection.access_token,
      expires_at: expiresAt,
    };
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  await storeZohoConnection(refreshed, connection.account_id);

  return {
    access_token: refreshed.access_token,
    expires_at: refreshed.expires_at,
  };
}
