import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ checkoutRequestId: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { checkoutRequestId } = await params;

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}
