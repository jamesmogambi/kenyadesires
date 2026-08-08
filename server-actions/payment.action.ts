"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdPackageById } from "@/lib/constants/packages";
import { auth } from "@clerk/nextjs/server";

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

    const userRef = adminDb.collection("escorts").doc(userId);
    const userDoc = await userRef.get();

    let targetRef = userRef;
    let targetDoc = userDoc;

    if (!userDoc.exists) {
      targetRef = adminDb.collection("agencies").doc(userId);
      targetDoc = await targetRef.get();
      if (!targetDoc.exists) {
        return { success: false, error: "User profile not found" };
      }
    }

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

    return {
      success: true,
      package: {
        ...newPackage,
        activatedAt: newPackage.activatedAt.toDate().toISOString(),
        expiresAt: newPackage.expiresAt.toDate().toISOString(),
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

    const userRef = adminDb.collection("escorts").doc(userId);
    const userDoc = await userRef.get();

    let targetDoc = userDoc;
    if (!userDoc.exists) {
      const agencyRef = adminDb.collection("agencies").doc(userId);
      const agencyDoc = await agencyRef.get();
      if (agencyDoc.exists) {
        targetDoc = agencyDoc;
      }
    }

    if (!targetDoc.exists) {
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

    const userRef = adminDb.collection("escorts").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      return { success: true, credits: userDoc.data()?.credits || 0 };
    }

    const agencyRef = adminDb.collection("agencies").doc(userId);
    const agencyDoc = await agencyRef.get();

    if (agencyDoc.exists) {
      return { success: true, credits: agencyDoc.data()?.credits || 0 };
    }

    return { success: true, credits: 0 };
  } catch (error: any) {
    console.error("Get credits error:", error);
    return { success: false, error: error.message, credits: 0 };
  }
}
