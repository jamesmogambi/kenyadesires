import { connection } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBoostOverview } from "@/lib/boost";

/**
 * GET /api/boost/active
 *
 * Current boost state for the signed-in profile: the running boost (if any),
 * the post-expiry cooldown, current credits, and the status of every package.
 * The /extend page and the client price list both render from this.
 */
export async function GET() {
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return NextResponse.json(await getBoostOverview(userId));
  } catch (error: any) {
    console.error("[boost/active] error:", error?.message || error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
