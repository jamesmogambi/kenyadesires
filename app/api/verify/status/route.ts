import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const verificationDoc = await adminDb
      .collection("kyc_verifications")
      .doc(userId)
      .get();

    if (!verificationDoc.exists) {
      return NextResponse.json({ status: "not_found" });
    }

    const data = verificationDoc.data();

    return NextResponse.json({
      status: data?.status ?? "unknown",
      decision: data?.decision ?? null,
      verifiedAt: data?.verified_at?.toDate?.() ?? null,
      updatedAt: data?.updated_at?.toDate?.() ?? null,
    });
  } catch (error: any) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}