import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { initiateSTKPush, STKPushRequest } from "@/lib/mpesa";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = process.env.NODE_ENV === 'development' ? { userId: 'dev-test-user' } : await auth();
    if (!userId && process.env.NODE_ENV !== 'development') {
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

    const checkoutRequestId = `STK_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const transactionRef = adminDb.collection("transactions").doc(checkoutRequestId);

    try {
      await transactionRef.set({
        userId,
        type: type || (packageId ? (packageId.startsWith("credits-") ? "credit_purchase" : "ad_purchase") : "credit_purchase"),
        packageId: packageId || null,
        phoneNumber: formattedPhone,
        amount,
        accountReference: accountReference || "KenyaDesires",
        transactionDesc: transactionDesc || "Payment",
        status: "pending",
        checkoutRequestId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (firestoreError: any) {
      console.error("Firestore transaction creation error:", firestoreError);
      return NextResponse.json(
        { error: `Failed to create transaction: ${firestoreError.message}` },
        { status: 500 },
      );
    }

    try {
      const stkResponse = await initiateSTKPush({
        phoneNumber: formattedPhone,
        amount,
        accountReference: accountReference || "KenyaDesires",
        transactionDesc: transactionDesc || "Payment",
      });

      try {
        await transactionRef.update({
          merchantRequestId: stkResponse.MerchantRequestID,
          status: "processing",
          updatedAt: Timestamp.now(),
        });
      } catch (updateError: any) {
        console.error("Firestore transaction update error:", updateError);
      }

      return NextResponse.json({
        success: true,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        customerMessage: stkResponse.CustomerMessage,
      });
    } catch (mpesaError: any) {
      console.error("M-Pesa STK Push error:", mpesaError);
      
      try {
        await transactionRef.update({
          status: "failed",
          error: mpesaError.message,
          updatedAt: Timestamp.now(),
        });
      } catch (updateError: any) {
        console.error("Firestore transaction update error:", updateError);
      }
      
      return NextResponse.json(
        { error: mpesaError.message || "Failed to initiate payment" },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("STK Push route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initiate payment" },
      { status: 500 },
    );
  }
}
