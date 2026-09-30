import { connection, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkBoostEligibility } from "@/lib/boost";

/**
 * GET /api/boost/check-eligibility?packageId=weekly_boost
 *
 * Reports what would happen if the signed-in profile bought `packageId` right
 * now, without mutating anything. Same code path the purchase action uses, so
 * the UI and the server can never disagree about a guardrail.
 */
export async function GET(req: Request) {
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const packageId = new URL(req.url).searchParams.get("packageId");
    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    return NextResponse.json(await checkBoostEligibility(userId, packageId));
  } catch (error: any) {
    console.error("[boost/check-eligibility] error:", error?.message || error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
