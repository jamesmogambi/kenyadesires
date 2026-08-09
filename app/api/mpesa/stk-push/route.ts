import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { initiateSTKPush, STKPushRequest } from "@/lib/mpesa";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { phoneNumber, amount, accountReference, transactionDesc, packageId, type } = body as STKPushRequest & { packageId?: string; type?: string };

    if (!phoneNumber || !amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid phone number or amount" }, { status: 400 });
    }

    const formattedPhone = phoneNumber.replace(/\D/g, "");
    if (formattedPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    }

    const stkResponse = await initiateSTKPush({
      phoneNumber: formattedPhone,
      amount,
      accountReference: accountReference || "KenyaDesires",
      transactionDesc: transactionDesc || "Payment",
    });

    const checkoutRequestId = stkResponse.CheckoutRequestID;

    if (!checkoutRequestId) {
      throw new Error("M-Pesa did not return a CheckoutRequestID");
    }

    const transactionRef = adminDb.collection("transactions").doc(checkoutRequestId);
    await transactionRef.set({
      userId,
      type: type || (packageId ? (packageId.startsWith("credits-") ? "credit_purchase" : "ad_purchase") : "credit_purchase"),
      packageId: packageId || null,
      phoneNumber: formattedPhone,
      amount,
      accountReference: accountReference || "KenyaDesires",
      transactionDesc: transactionDesc || "Payment",
      status: "processing",
      checkoutRequestId,
      merchantRequestId: stkResponse.MerchantRequestID,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      customerMessage: stkResponse.CustomerMessage,
    });
  } catch (error: any) {
    console.error("STK Push error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment", detail: error.message },
      { status: 500 },
    );
  }
}
