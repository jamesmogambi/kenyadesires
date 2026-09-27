import { connection, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCreditRewardRecord } from "@/server-actions/credit-rewards.action";
import { executeQuery } from "@/lib/neon";

export async function GET(req: Request) {
  // Request-time only: stops static generation from invoking this handler.
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result: any[] = await executeQuery(
      `SELECT credits, plan_type, plan_is_active FROM escorts WHERE clerk_user_id = $1 LIMIT 1`,
      [userId],
    );

    if (result.length > 0) {
      const row = result[0];
      const rewardRecord: any = await getCreditRewardRecord(userId);
      return NextResponse.json({
        credits: row.credits ?? 0,
        plan: row.plan_type || "free",
        role: "escort",
        rewardMilestones: rewardRecord?.awardedMilestones || {},
        totalCreditsAwarded: rewardRecord?.totalCreditsAwarded || 0,
        maxWelcomeCredits: 100,
        creditValueKsh: 10,
      });
    }

    const agencyResult: any[] = await executeQuery(
      `SELECT credits, plan_type, plan_is_active FROM agencies WHERE owner_id = $1 LIMIT 1`,
      [userId],
    );

    if (agencyResult.length > 0) {
      const row = agencyResult[0];
      const rewardRecord: any = await getCreditRewardRecord(userId);
      return NextResponse.json({
        credits: row.credits ?? 0,
        plan: row.plan_type || "free",
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
