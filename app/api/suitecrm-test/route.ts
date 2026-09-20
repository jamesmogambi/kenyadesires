import { NextRequest, NextResponse } from "next/server";

const SUITECRM_BASE_URL =
  (process.env.SUITECRM_URL as string) || "http://localhost";
const OAUTH_TOKEN_ENDPOINT = `${SUITECRM_BASE_URL}/oauth/token`;
const TEST_ENDPOINT = `${SUITECRM_BASE_URL}/api/v8/Settings`;

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "****";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

async function getAccessToken(): Promise<{
  token: string;
  maskedKey: string;
  error?: string;
}> {
  const clientId = process.env.SUITECRM_CLIENT_ID;
  const clientSecret = process.env.SUITECRM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      token: "",
      maskedKey: "",
      error: "Missing SUITECRM_CLIENT_ID or SUITECRM_CLIENT_SECRET",
    };
  }

  console.log(
    `[SuiteCRM] Requesting OAuth token from ${OAUTH_TOKEN_ENDPOINT}`,
    `client_id: ${maskSecret(clientId)}`,
  );

  try {
    const res = await fetch(OAUTH_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = await res.text();
      }
      console.error(
        `[SuiteCRM] OAuth token request failed: HTTP ${res.status}`,
        body,
      );
      return {
        token: "",
        maskedKey: maskSecret(clientSecret),
        error: `OAuth token request failed with HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as OAuthTokenResponse;
    console.log(
      `[SuiteCRM] OAuth token received, expires in ${data.expires_in}s`,
    );
    return { token: data.access_token, maskedKey: maskSecret(clientSecret) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SuiteCRM] Network failure during OAuth: ${msg}`);
    return {
      token: "",
      maskedKey: maskSecret(clientSecret),
      error: `Network failure: ${msg}`,
    };
  }
}

export async function GET(request: NextRequest) {
  console.log("[SuiteCRM] Starting connection test...");

  // Step 1: Check environment variables
  const missing: string[] = [];
  if (!process.env.SUITECRM_URL) missing.push("SUITECRM_URL");
  if (!process.env.SUITECRM_CLIENT_ID) missing.push("SUITECRM_CLIENT_ID");
  if (!process.env.SUITECRM_CLIENT_SECRET) missing.push("SUITECRM_CLIENT_SECRET");

  if (missing.length > 0) {
    console.log(`[SuiteCRM] Missing env vars: ${missing.join(", ")}`);
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        endpoint: TEST_ENDPOINT,
        message: `Missing environment variable(s): ${missing.join(", ")}. Add them before testing.`,
        data: null,
      },
      { status: 500 },
    );
  }

  console.log(`[SuiteCRM] Base URL: ${SUITECRM_BASE_URL}`);

  // Step 2: Get OAuth token
  const { token, maskedKey, error: oauthError } = await getAccessToken();

  if (oauthError || !token) {
    return NextResponse.json(
      {
        ok: false,
        status: 401,
        endpoint: OAUTH_TOKEN_ENDPOINT,
        message: oauthError || "Failed to obtain OAuth access token.",
        data: null,
      },
      { status: 401 },
    );
  }

  // Step 3: Test authenticated endpoint
  console.log(`[SuiteCRM] Testing authenticated endpoint: ${TEST_ENDPOINT}`);

  try {
    const res = await fetch(TEST_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const responseText = await res.text();

    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!res.ok) {
      console.error(
        `[SuiteCRM] Authenticated request failed: HTTP ${res.status}`,
        responseData,
      );

      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          endpoint: TEST_ENDPOINT,
          message: `SuiteCRM API returned HTTP ${res.status}. Check token permissions and API version.`,
          data: responseData,
        },
        { status: res.status },
      );
    }

    console.log(`[SuiteCRM] Connection test successful (HTTP ${res.status})`);

    return NextResponse.json({
      ok: true,
      status: res.status,
      endpoint: TEST_ENDPOINT,
      message:
        "SuiteCRM connection is working. OAuth auth succeeded and API responded.",
      data: responseData,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[SuiteCRM] Network failure on test endpoint: ${msg}`);

    return NextResponse.json(
      {
        ok: false,
        status: 503,
        endpoint: TEST_ENDPOINT,
        message: `Network failure reaching SuiteCRM API: ${msg}`,
        data: null,
      },
      { status: 503 },
    );
  }
}
