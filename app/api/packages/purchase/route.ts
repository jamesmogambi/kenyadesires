import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdPackageById } from "@/lib/constants/packages";


export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    const adPackage = getAdPackageById(packageId);
    if (!adPackage) {
      return NextResponse.json({ error: "Invalid package" }, { status: 404 });
    }

    const userRef = adminDb.collection("escorts").doc(userId);
    const userDoc = await userRef.get();

    let targetRef = userRef;
    let targetDoc = userDoc;

    if (!userDoc.exists) {
      targetRef = adminDb.collection("agencies").doc(userId);
      targetDoc = await targetRef.get();
      if (!targetDoc.exists) {
        return NextResponse.json({ error: "User profile not found" }, { status: 404 });
      }
    }

    const userData = targetDoc.data();
    const currentCredits = userData?.credits || 0;

    if (currentCredits < adPackage.credits) {
      return NextResponse.json(
        { error: `Insufficient credits. You need ${adPackage.credits} credits but have ${currentCredits}` },
        { status: 402 },
      );
    }

    const existingPackages = (userData?.activePackages as any[]) || [];
    const activeSameType = existingPackages.filter(
      (p: any) => p.packageId === packageId && p.status === "active",
    );

    if (activeSameType.length > 0) {
      const lastActive = activeSameType[activeSameType.length - 1];
      const expiresAt = lastActive.expiresAt?.toDate?.() || new Date(lastActive.expiresAt);
      if (expiresAt > new Date()) {
        return NextResponse.json(
          { error: `You already have an active ${adPackage.name}. It expires on ${expiresAt.toLocaleDateString()}` },
          { status: 409 },
        );
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

    return NextResponse.json({
      success: true,
      package: {
        ...newPackage,
        activatedAt: newPackage.activatedAt.toDate().toISOString(),
        expiresAt: newPackage.expiresAt.toDate().toISOString(),
      },
      remainingCredits: currentCredits - adPackage.credits,
    });
  } catch (error: any) {
    console.error("Package purchase error:", error);
    return NextResponse.json(
      { error: "Failed to purchase package", detail: error.message },
      { status: 500 },
    );
  }
}
