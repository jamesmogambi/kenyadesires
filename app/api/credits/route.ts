import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { getCreditRewardRecord } from "@/server-actions/credit-rewards.action";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const escortSnap = await adminDb
      .collection("escorts")
      .where("clerkUserId", "==", userId)
      .limit(1)
      .get();

    if (!escortSnap.empty) {
      const data = escortSnap.docs[0].data();
      const rewardRecord = await getCreditRewardRecord(userId);
      return NextResponse.json({
        credits: data.credits ?? 0,
        plan: data.plan?.type || "free",
        role: "escort",
        rewardMilestones: rewardRecord?.awardedMilestones || {},
        totalCreditsAwarded: rewardRecord?.totalCreditsAwarded || 0,
        maxWelcomeCredits: 100,
        creditValueKsh: 10,
      });
    }

    const agencySnap = await adminDb
      .collection("agencies")
      .where("ownerId", "==", userId)
      .limit(1)
      .get();

    if (!agencySnap.empty) {
      const data = agencySnap.docs[0].data();
      const rewardRecord = await getCreditRewardRecord(userId);
      return NextResponse.json({
        credits: data.credits ?? 0,
        plan: data.plan?.type || "free",
        role: "agency",
        rewardMilestones: rewardRecord?.awardedMilestones || {},
        totalCreditsAwarded: rewardRecord?.totalCreditsAwarded || 0,
        maxWelcomeCredits: 100,
        creditValueKsh: 10,
      });
    }

    return NextResponse.json({
      credits: 0,
      plan: "free",
      role: null,
      rewardMilestones: {},
      totalCreditsAwarded: 0,
      maxWelcomeCredits: 100,
      creditValueKsh: 10,
    });
  } catch (error: any) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}

