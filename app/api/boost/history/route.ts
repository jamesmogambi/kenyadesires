import { connection, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBoostHistory, getBoostTarget } from "@/lib/boost";

/**
 * GET /api/boost/history
 *
 * Boost purchases for the signed-in profile, newest first. Records come from
 * `boost_history` (migration 008), written on every purchase/extend/upgrade.
 */
export async function GET(req: Request) {
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 50;

    const target = await getBoostTarget(userId);
    if (!target) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const history = await getBoostHistory(userId, target.userType, limit);
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("[boost/history] error:", error?.message || error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
