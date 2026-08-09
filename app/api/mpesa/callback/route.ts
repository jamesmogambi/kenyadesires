import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { parseSTKCallback } from "@/lib/mpesa";
import { getCreditPackageById, getAdPackageById, PLAN_DETAILS } from "@/lib/constants/packages";
import { sendPaymentConfirmationEmail } from "@/server-actions/email";
import { incrementUserCredits } from "@/server-actions/payment.action";

export const dynamic = "force-dynamic";

async function getUserInfo(userId: string) {
  if (!userId) return { name: "Valued Customer", email: "", ref: null };

  const escortSnap = await adminDb
    .collection("escorts")
    .where("clerkUserId", "==", userId)
    .limit(1)
    .get();

  if (!escortSnap.empty) {
    const data = escortSnap.docs[0].data();
    return {
      name: data?.name || "Valued Customer",
      email: data?.email || "",
      ref: escortSnap.docs[0].ref,
    };
  }

  const agencySnap = await adminDb
    .collection("agencies")
    .where("ownerId", "==", userId)
    .limit(1)
    .get();

  if (!agencySnap.empty) {
    const data = agencySnap.docs[0].data();
    return {
      name: data?.name || "Valued Customer",
      email: data?.contactEmail || "",
      ref: agencySnap.docs[0].ref,
    };
  }

  return { name: "Valued Customer", email: "", ref: null };
}

async function findUserRef(userId: string) {
  if (!userId) return null;

  const escortDoc = await adminDb.collection("escorts").doc(userId).get();
  if (escortDoc.exists) {
    return escortDoc.ref;
  }

  const agencyDoc = await adminDb.collection("agencies").doc(userId).get();
  if (agencyDoc.exists) {
    return agencyDoc.ref;
  }

  const escortSnap = await adminDb
    .collection("escorts")
    .where("clerkUserId", "==", userId)
    .limit(1)
    .get();

  if (!escortSnap.empty) {
    return escortSnap.docs[0].ref;
  }

  const agencySnap = await adminDb
    .collection("agencies")
    .where("ownerId", "==", userId)
    .limit(1)
    .get();

  if (!agencySnap.empty) {
    return agencySnap.docs[0].ref;
  }

  return null;
}

async function findUserIdByPhone(phone: string | undefined): Promise<string | null> {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;

  const escortSnap = await adminDb
    .collection("escorts")
    .where("contact.phone", "==", digits)
    .limit(1)
    .get();

  if (!escortSnap.empty) {
    const data = escortSnap.docs[0].data();
    return data?.clerkUserId || null;
  }

  const escortSnap2 = await adminDb
    .collection("escorts")
    .where("contact.telephone", "==", digits)
    .limit(1)
    .get();

  if (!escortSnap2.empty) {
    const data = escortSnap2.docs[0].data();
    return data?.clerkUserId || null;
  }

  const escortSnap3 = await adminDb
    .collection("escorts")
    .where("whatsappPhone", "==", digits)
    .limit(1)
    .get();

  if (!escortSnap3.empty) {
    const data = escortSnap3.docs[0].data();
    return data?.clerkUserId || null;
  }

  const agencySnap = await adminDb
    .collection("agencies")
    .where("contactPhone", "==", digits)
    .limit(1)
    .get();

  if (!agencySnap.empty) {
    const data = agencySnap.docs[0].data();
    return data?.ownerId || null;
  }

  return null;
}

async function updateUserPlan(userId: string, packageId: string | null | undefined) {
  if (!userId || !packageId) return;

  const creditPackage = getCreditPackageById(packageId);
  if (!creditPackage) return;

  let planType: string | null = null;
  if (packageId === "credits-50") planType = "basic";
  else if (packageId === "credits-180") planType = "premium";

  if (!planType) return;

  const targetRef = await findUserRef(userId);
  if (!targetRef) return;

  await targetRef.update({
    "plan.type": planType,
    "plan.isActive": true,
    "plan.activatedAt": Timestamp.now(),
    "plan.expiresAt": Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
    "plan.features": PLAN_DETAILS[planType as keyof typeof PLAN_DETAILS]?.features || [],
    updatedAt: Timestamp.now(),
  });
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = parseFloat(String(value ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function parseMpesaTransactionDate(value: unknown): Timestamp | string | number | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value);
  if (!/^\d{14}$/.test(str)) return str;
  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  const hour = str.slice(8, 10);
  const minute = str.slice(10, 12);
  const second = str.slice(12, 14);
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  if (Number.isNaN(date.getTime())) return str;
  return Timestamp.fromDate(date);
}

function isTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp;
}

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

    if (!callback.checkoutRequestId) {
      console.error("Callback missing checkoutRequestId:", callback);
      return NextResponse.json({ received: true });
    }

    const transactionRef = adminDb.collection("transactions").doc(callback.checkoutRequestId);
    const transactionDoc = await transactionRef.get();
    const isSuccess = Number(callback.resultCode) === 0;
    const amount = toNumber(callback.amount || transactionDoc.data()?.amount || 0);
    const transactionDate = parseMpesaTransactionDate(callback.transactionDate);

    const transactionData = transactionDoc.data();
    const transactionType = transactionData?.type || "credit_purchase";
    const packageId = transactionData?.packageId;

    if (!transactionDoc.exists) {
      console.error("Transaction not found:", callback.checkoutRequestId);
      const resolvedUserId = await findUserIdByPhone(callback.phoneNumber);
      await transactionRef.set({
        userId: resolvedUserId,
        type: "credit_purchase",
        packageId: null,
        phoneNumber: callback.phoneNumber || "",
        amount,
        accountReference: "KenyaDesires",
        transactionDesc: "Payment",
        status: isSuccess ? "completed" : "failed",
        checkoutRequestId: callback.checkoutRequestId,
        merchantRequestId: callback.merchantRequestId,
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
        receiptNumber: callback.receiptNumber,
        transactionDate: transactionDate ?? callback.transactionDate,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(isSuccess ? { completedAt: Timestamp.now() } : { failedAt: Timestamp.now() }),
      });

      if (isSuccess && resolvedUserId) {
        const creditPackage = getCreditPackageById(packageId || "");
        const creditsToAdd = creditPackage?.credits || Math.floor(amount / 10);

        if (creditsToAdd > 0) {
          await incrementUserCredits(resolvedUserId, creditsToAdd);
        }

        await updateUserPlan(resolvedUserId, packageId);

        const userInfo = await getUserInfo(resolvedUserId);
        if (userInfo.email) {
          const pkg = packageId ? getCreditPackageById(packageId) || getAdPackageById(packageId) : null;
          const dateStr = isTimestamp(transactionDate)
            ? transactionDate.toDate().toLocaleString()
            : callback.transactionDate
              ? new Date(callback.transactionDate).toLocaleString()
              : new Date().toLocaleString();
          sendPaymentConfirmationEmail({
            to: userInfo.email,
            name: userInfo.name,
            amount,
            receiptNumber: callback.receiptNumber || "",
            packageName: pkg?.name || "Payment",
            transactionId: callback.checkoutRequestId,
            date: dateStr,
            phoneNumber: callback.phoneNumber || "",
          }).catch((err) => console.error("Background email send failed:", err));
        }
      }

      return NextResponse.json({ received: true });
    }

    if (isSuccess) {
      const userId = transactionData?.userId;

      try {
        if (transactionType === "ad_purchase" && userId && packageId) {
          const creditsFromPayment = Math.floor(amount / 10);

          if (creditsFromPayment > 0) {
            const targetRef = await findUserRef(userId);
            if (targetRef) {
              await targetRef.update({
                credits: FieldValue.increment(creditsFromPayment),
                updatedAt: Timestamp.now(),
              });
            }
          }

          const adPackage = getAdPackageById(packageId);
          if (adPackage && userId) {
            const targetRef = await findUserRef(userId);
            if (targetRef) {
              const targetDoc = await targetRef.get();
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
            await incrementUserCredits(userId, creditsToAdd);
          }

          await updateUserPlan(userId, packageId);
        }
      } catch (creditError: any) {
        console.error("Credit/package processing error:", creditError);
      }

      await transactionRef.update({
        status: "completed",
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
        receiptNumber: callback.receiptNumber,
        phoneNumber: callback.phoneNumber,
        transactionDate: transactionDate ?? callback.transactionDate,
        amount,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const resolvedUserId = userId || transactionData?.userId || (await findUserIdByPhone(callback.phoneNumber));
      const userInfo = await getUserInfo(resolvedUserId || "");
      if (userInfo.email) {
        const pkg = packageId ? getCreditPackageById(packageId) || getAdPackageById(packageId) : null;
        const dateStr = isTimestamp(transactionDate)
          ? transactionDate.toDate().toLocaleString()
          : callback.transactionDate
            ? new Date(callback.transactionDate).toLocaleString()
            : new Date().toLocaleString();
        sendPaymentConfirmationEmail({
          to: userInfo.email,
          name: userInfo.name,
          amount,
          receiptNumber: callback.receiptNumber || "",
          packageName: pkg?.name || transactionData?.transactionDesc || "Payment",
          transactionId: callback.checkoutRequestId,
          date: dateStr,
          phoneNumber: callback.phoneNumber || transactionData?.phoneNumber || "",
        }).catch((err) => console.error("Background email send failed:", err));
      }
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
