import { NextRequest, NextResponse } from "next/server";
import { getZohoAuthorizeUrl } from "@/lib/zoho/auth";

export async function GET(request: NextRequest) {
  try {
    const url = getZohoAuthorizeUrl();
    return NextResponse.redirect(url, 302);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Authorization failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
