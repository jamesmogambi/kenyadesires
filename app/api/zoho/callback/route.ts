import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  storeZohoConnection,
} from "@/lib/zoho/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    const errorDescription = searchParams.get("error_description") || error;
    console.log(`[Zoho] Authorization denied: ${errorDescription}`);
    return NextResponse.redirect(
      new URL("/zoho-connect?error=denied", request.url).toString(),
      302,
    );
  }

  if (!code) {
    console.log("[Zoho] OAuth callback received without code");
    return NextResponse.redirect(
      new URL("/zoho-connect?error=missing_code", request.url).toString(),
      302,
    );
  }

  console.log("[Zoho] OAuth callback received, exchanging code");

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeZohoConnection(tokens);

    console.log("[Zoho] OAuth token exchange successful");

    return NextResponse.redirect(
      new URL("/zoho-connect?success=true", request.url).toString(),
      302,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token exchange failed";
    console.error(`[Zoho] Token exchange failed: ${message}`);
    return NextResponse.redirect(
      new URL("/zoho-connect?error=exchange_failed", request.url).toString(),
      302,
    );
  }
}
