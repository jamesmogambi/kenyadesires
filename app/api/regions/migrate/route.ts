import { NextRequest, NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}

export async function GET() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
