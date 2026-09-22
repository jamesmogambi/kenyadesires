import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";


export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "checkoutRequestId required" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status", detail: error.message },
      { status: 500 },
    );
  }
}
