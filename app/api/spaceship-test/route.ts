import { NextRequest, NextResponse } from "next/server";

const SPACESHIP_BASE_URL = "https://spaceship.dev";
const TEST_ENDPOINT = "/api/v1/domains?take=1&skip=0";
const TEST_URL = `${SPACESHIP_BASE_URL}${TEST_ENDPOINT}`;

function maskSecret(secret: string): string {
  if (secret.length <= 8) return "****";
  return `${secret.slice(0, 4)}...${secret.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const apiKey = process.env.SPACESHIP_API_KEY;
  const apiSecret = process.env.SPACESHIP_API_SECRET;

  if (!apiKey || !apiSecret) {
    const missing: string[] = [];
    if (!apiKey) missing.push("SPACESHIP_API_KEY");
    if (!apiSecret) missing.push("SPACESHIP_API_SECRET");

    console.log(
      `[SpaceshipTest] Missing env vars: ${missing.join(", ")}`,
    );

    return NextResponse.json(
      {
        ok: false,
        status: 500,
        endpoint: TEST_URL,
        message: `Missing environment variable(s): ${missing.join(", ")}. Set them before testing the API connection.`,
        data: null,
      },
      { status: 500 },
    );
  }

  console.log(
    `[SpaceshipTest] Testing connection to ${TEST_URL}`,
    `with API key: ${maskSecret(apiKey)}, secret: ${maskSecret(apiSecret)}`,
  );

  try {
    const response = await fetch(TEST_URL, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
        Accept: "application/json",
      },
    });

    const responseText = await response.text();

    let responseData: unknown;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      const isAuthError = response.status === 401 || response.status === 403;

      console.log(
        `[SpaceshipTest] Auth failure detected: HTTP ${response.status}`,
        isAuthError
          ? "Credentials are invalid or lack required permissions."
          : `Non-auth error from Spaceship API.`,
      );

      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          endpoint: TEST_URL,
          message: isAuthError
            ? `Authentication failed (HTTP ${response.status}). Check your SPACESHIP_API_KEY and SPACESHIP_API_SECRET, and ensure the API key has the 'domains:read' permission.`
            : `Spaceship API returned HTTP ${response.status}. Response body included for debugging.`,
          data: responseData,
        },
        { status: response.status },
      );
    }

    console.log(
      `[SpaceshipTest] Connection successful (HTTP ${response.status}).`,
    );

    return NextResponse.json({
      ok: true,
      status: response.status,
      endpoint: TEST_URL,
      message:
        "Spaceship API connection is working. Your credentials are valid and the API responded successfully.",
      data: responseData,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    console.error(`[SpaceshipTest] Network failure: ${errorMessage}`);

    return NextResponse.json(
      {
        ok: false,
        status: 503,
        endpoint: TEST_URL,
        message: `Network failure when connecting to Spaceship API: ${errorMessage}. Check your network connectivity and that spaceship.dev is reachable from this server.`,
        data: null,
      },
      { status: 503 },
    );
  }
}
