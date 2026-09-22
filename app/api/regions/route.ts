import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
