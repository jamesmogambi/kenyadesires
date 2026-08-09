import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { parseSTKCallback } from "@/lib/mpesa";
import { getCreditPackageById, getAdPackageById } from "@/lib/constants/packages";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let callback;
    try {
      callback = parseSTKCallback(body as any);
    } catch (parseError: any) {
      console.error("Callback parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid callback format", detail: parseError.message },
        { status: 400 },
      );
    }

    const transactionRef = adminDb.collection("transactions").doc(callback.checkoutRequestId);
    const transactionDoc = await transactionRef.get();

    if (!transactionDoc.exists) {
      console.error("Transaction not found:", callback.checkoutRequestId);
      return NextResponse.json({ received: true });
    }

    const transactionData = transactionDoc.data();
    const transactionType = transactionData?.type || "credit_purchase";
    const packageId = transactionData?.packageId;
    const amount = callback.amount || transactionData?.amount || 0;

    if (callback.resultCode === 0) {
      const userId = transactionData?.userId;

      if (transactionType === "ad_purchase" && userId && packageId) {
        const creditsFromPayment = Math.floor(amount / 10);

        if (creditsFromPayment > 0) {
          const userRef = adminDb.collection("escorts").doc(userId);
          const userDoc = await userRef.get();
          let targetRef = userRef;
          let targetDoc = userDoc;

          if (!userDoc.exists) {
            targetRef = adminDb.collection("agencies").doc(userId);
            targetDoc = await targetRef.get();
          }

          if (targetDoc.exists) {
            await targetRef.update({
              credits: FieldValue.increment(creditsFromPayment),
              updatedAt: Timestamp.now(),
            });
          }
        }

        const adPackage = getAdPackageById(packageId);
        if (adPackage && userId) {
          const userRef = adminDb.collection("escorts").doc(userId);
          const userDoc = await userRef.get();
          let targetRef = userRef;
          let targetDoc = userDoc;

          if (!userDoc.exists) {
            targetRef = adminDb.collection("agencies").doc(userId);
            targetDoc = await targetRef.get();
          }

          if (targetDoc.exists) {
            const userData = targetDoc.data();
            const currentCredits = userData?.credits || 0;

            if (currentCredits >= adPackage.credits) {
              const existingPackages = (userData?.activePackages as any[]) || [];
              const activeSameType = existingPackages.filter(
                (p: any) => p.packageId === packageId && p.status === "active",
              );

              const now = new Date();
              const hasActiveSameType = activeSameType.some((p: any) => {
                const expiresAt = p.expiresAt?.toDate?.() || new Date(p.expiresAt);
                return expiresAt > now;
              });

              if (!hasActiveSameType) {
                const newPackage = {
                  id: `${packageId}_${Date.now()}`,
                  packageId,
                  name: adPackage.name,
                  description: adPackage.description,
                  purchasedAt: Timestamp.now(),
                  activatedAt: Timestamp.now(),
                  expiresAt: Timestamp.fromDate(
                    new Date(Date.now() + adPackage.durationDays * 24 * 60 * 60 * 1000),
                  ),
                  status: "active",
                  creditsUsed: adPackage.credits,
                  type: adPackage.type,
                };

                await targetRef.update({
                  credits: FieldValue.increment(-adPackage.credits),
                  activePackages: [...existingPackages, newPackage],
                  updatedAt: Timestamp.now(),
                });
              }
            }
          }
        }
      } else if (transactionType === "credit_purchase" && userId) {
        const creditPackage = getCreditPackageById(packageId || "");
        const creditsToAdd = creditPackage?.credits || Math.floor(amount / 10);

        if (creditsToAdd > 0) {
          const userRef = adminDb.collection("escorts").doc(userId);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            const agencyRef = adminDb.collection("agencies").doc(userId);
            const agencyDoc = await agencyRef.get();
            if (agencyDoc.exists) {
              await agencyRef.update({
                credits: FieldValue.increment(creditsToAdd),
                updatedAt: Timestamp.now(),
              });
            }
          } else {
            await userRef.update({
              credits: FieldValue.increment(creditsToAdd),
              updatedAt: Timestamp.now(),
            });
          }
        }
      }

      await transactionRef.update({
        status: "completed",
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
        receiptNumber: callback.receiptNumber,
        phoneNumber: callback.phoneNumber,
        transactionDate: callback.transactionDate,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      await transactionRef.update({
        status: "failed",
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
        failedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      { error: "Callback processing failed", detail: error.message },
      { status: 500 },
    );
  }
}
