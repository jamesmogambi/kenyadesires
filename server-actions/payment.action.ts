"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdPackageById, getCreditPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";
import { sendPaymentConfirmationEmail } from "./email";

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

async function getUserInfo(userId: string) {
  if (!userId) return { name: "Valued Customer", email: "", ref: null };

  const escortDoc = await adminDb.collection("escorts").doc(userId).get();
  if (escortDoc.exists) {
    const data = escortDoc.data();
    return {
      name: data?.name || "Valued Customer",
      email: data?.email || "",
      ref: escortDoc.ref,
    };
  }

  const agencyDoc = await adminDb.collection("agencies").doc(userId).get();
  if (agencyDoc.exists) {
    const data = agencyDoc.data();
    return {
      name: data?.name || "Valued Customer",
      email: data?.contactEmail || "",
      ref: agencyDoc.ref,
    };
  }

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

export async function purchaseAdPackage(packageId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const adPackage = getAdPackageById(packageId);
    if (!adPackage) {
      return { success: false, error: "Invalid package" };
    }

    const targetRef = await findUserRef(userId);
    if (!targetRef) {
      return { success: false, error: "User profile not found" };
    }

    const targetDoc = await targetRef.get();
    const userData = targetDoc.data();
    const currentCredits = userData?.credits || 0;

    if (currentCredits < adPackage.credits) {
      return {
        success: false,
        error: `Insufficient credits. You need ${adPackage.credits} credits but have ${currentCredits}`,
      };
    }

    const existingPackages = (userData?.activePackages as any[]) || [];
    const activeSameType = existingPackages.filter(
      (p: any) => p.packageId === packageId && p.status === "active",
    );

    if (activeSameType.length > 0) {
      const lastActive = activeSameType[activeSameType.length - 1];
      const expiresAt = lastActive.expiresAt?.toDate?.() || new Date(lastActive.expiresAt);
      if (expiresAt > new Date()) {
        return {
          success: false,
          error: `You already have an active ${adPackage.name}. It expires on ${expiresAt.toLocaleDateString()}`,
        };
      }
    }

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

    const transactionRef = adminDb.collection("transactions").doc();
    const transactionId = transactionRef.id;
    const phoneNumber =
      (userData?.contact?.phone || userData?.contact?.telephone || userData?.whatsappPhone || "").replace(/\D/g, "");

    await transactionRef.set({
      userId,
      type: "ad_purchase",
      packageId: packageId,
      phoneNumber,
      amount: adPackage.credits * 10,
      accountReference: `Ad-${adPackage.name}-${Date.now()}`,
      transactionDesc: `Buy ${adPackage.name} ad package`,
      status: "completed",
      checkoutRequestId: transactionId,
      merchantRequestId: `credit-${Date.now()}`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
    });

    const userInfo = await getUserInfo(userId);
    if (userInfo.email) {
      sendPaymentConfirmationEmail({
        to: userInfo.email,
        name: userInfo.name,
        amount: adPackage.credits * 10,
        receiptNumber: `CREDIT-${Date.now()}`,
        packageName: adPackage.name,
        transactionId,
        date: new Date().toLocaleString(),
        phoneNumber,
      }).catch((err) => console.error("Background email send failed:", err));
    }

    return {
      success: true,
      package: {
        id: newPackage.id,
        packageId: newPackage.packageId,
        name: newPackage.name,
        description: newPackage.description,
        purchasedAt: newPackage.purchasedAt.toDate().toISOString(),
        activatedAt: newPackage.activatedAt.toDate().toISOString(),
        expiresAt: newPackage.expiresAt.toDate().toISOString(),
        status: newPackage.status,
        creditsUsed: newPackage.creditsUsed,
        type: newPackage.type,
      },
      remainingCredits: currentCredits - adPackage.credits,
    };
  } catch (error: any) {
    console.error("Package purchase error:", error);
    return { success: false, error: error.message || "Failed to purchase package" };
  }
}

export async function getUserActivePackages() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized", packages: [] };
    }

    const escortDoc = await adminDb.collection("escorts").doc(userId).get();
    let targetDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    if (escortDoc.exists) {
      targetDoc = escortDoc;
    } else {
      const agencyDoc = await adminDb.collection("agencies").doc(userId).get();
      if (agencyDoc.exists) {
        targetDoc = agencyDoc;
      }
    }

    if (!targetDoc) {
      const escortSnap = await adminDb
        .collection("escorts")
        .where("clerkUserId", "==", userId)
        .limit(1)
        .get();

      if (!escortSnap.empty) {
        targetDoc = escortSnap.docs[0];
      } else {
        const agencySnap = await adminDb
          .collection("agencies")
          .where("ownerId", "==", userId)
          .limit(1)
          .get();

        if (!agencySnap.empty) {
          targetDoc = agencySnap.docs[0];
        }
      }
    }

    if (!targetDoc) {
      return { success: true, packages: [] };
    }

    const userData = targetDoc.data();
    const activePackages = (userData?.activePackages as any[]) || [];

    const now = new Date();
    const validPackages = activePackages.filter((p: any) => {
      const expiresAt = p.expiresAt?.toDate?.() || new Date(p.expiresAt);
      return expiresAt > now && p.status === "active";
    });

    return {
      success: true,
      packages: validPackages.map((p: any) => ({
        ...p,
        activatedAt: p.activatedAt?.toDate?.()?.toISOString() || p.activatedAt,
        expiresAt: p.expiresAt?.toDate?.()?.toISOString() || p.expiresAt,
        purchasedAt: p.purchasedAt?.toDate?.()?.toISOString() || p.purchasedAt,
      })),
    };
  } catch (error: any) {
    console.error("Get packages error:", error);
    return { success: false, error: error.message, packages: [] };
  }
}

export async function getUserCredits() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized", credits: 0 };
    }

    const escortDoc = await adminDb.collection("escorts").doc(userId).get();
    if (escortDoc.exists) {
      const data = escortDoc.data();
      return { success: true, credits: data?.credits || 0 };
    }

    const agencyDoc = await adminDb.collection("agencies").doc(userId).get();
    if (agencyDoc.exists) {
      const data = agencyDoc.data();
      return { success: true, credits: data?.credits || 0 };
    }

    const escortSnap = await adminDb
      .collection("escorts")
      .where("clerkUserId", "==", userId)
      .limit(1)
      .get();

    if (!escortSnap.empty) {
      const data = escortSnap.docs[0].data();
      return { success: true, credits: data?.credits || 0 };
    }

    const agencySnap = await adminDb
      .collection("agencies")
      .where("ownerId", "==", userId)
      .limit(1)
      .get();

    if (!agencySnap.empty) {
      const data = agencySnap.docs[0].data();
      return { success: true, credits: data?.credits || 0 };
    }

    return { success: true, credits: 0 };
  } catch (error: any) {
    console.error("Get credits error:", error);
    return { success: false, error: error.message, credits: 0 };
  }
}
