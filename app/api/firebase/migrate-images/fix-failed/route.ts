// app/api/migration/fix-failed/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetFlags = false } = body;

    console.log("🔧 Fixing failed migrations...");

    if (resetFlags) {
      // Reset flags so they can be retried
      let resetCount = 0;
      console.log(`✅ Reset ${resetCount} escorts for retry`);

      return NextResponse.json({
        success: true,
        message: `Reset ${resetCount} escorts. Run the migration again.`,
        resetCount,
      });
    }

    return NextResponse.json({
      success: true,
      resetFlags,
      suggestion: "Use resetFlags=true to reset these escorts for retry",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
