import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";


export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const checkoutRequestId = searchParams.get("checkoutRequestId");

    if (!checkoutRequestId) {
      const transactionsSnapshot = await adminDb
        .collection("transactions")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      const transactions = transactionsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          status: data.status,
          packageId: data.packageId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
      });

      return NextResponse.json({ transactions });
    }

    const transactionDoc = await adminDb.collection("transactions").doc(checkoutRequestId).get();

    if (!transactionDoc.exists) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const data = transactionDoc.data();
    return NextResponse.json({
      checkoutRequestId,
      status: data?.status,
      amount: data?.amount,
      packageId: data?.packageId,
      resultCode: data?.resultCode,
      resultDesc: data?.resultDesc,
      receiptNumber: data?.receiptNumber,
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || null,
      completedAt: data?.completedAt?.toDate?.()?.toISOString() || null,
    });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Failed to check status", detail: error.message },
      { status: 500 },
    );
  }
}
