import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";

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
    const doc = await adminDb.collection("transactions").doc(checkoutRequestId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.userId !== userId) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({ id: doc.id, ...data });
  } catch (error: any) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}
