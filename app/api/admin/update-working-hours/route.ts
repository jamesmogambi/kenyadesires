import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neon";

export async function POST(request: Request) {
  try {
    console.log("🚀 Starting working hours update process for all escorts...");

    const result: any[] = await executeQuery(`SELECT id FROM escorts`);
    const totalEscorts = result.length;
    console.log(`📊 Found ${totalEscorts} escorts to process.`);

    let updatedCount = 0;
    let errorCount = 0;

    const defaultWorkingHours = {
      monday: {start: "08:00", end: "23:00", enabled: true},
      tuesday: {start: "08:00", end: "23:00", enabled: true},
      wednesday: {start: "08:00", end: "23:00", enabled: true},
      thursday: {start: "08:00", end: "23:00", enabled: true},
      friday: {start: "08:00", end: "23:00", enabled: true},
      saturday: {start: "08:00", end: "23:00", enabled: true},
      sunday: {start: "08:00", end: "23:00", enabled: true},
    };

    const defaultOpeningHours = {
      monday: "08:00-23:00",
      tuesday: "08:00-23:00",
      wednesday: "08:00-23:00",
      thursday: "08:00-23:00",
      friday: "08:00-23:00",
      saturday: "08:00-23:00",
      sunday: "08:00-23:00",
    };

    for (const row of result) {
      try {
        await executeQuery(
          `UPDATE escorts SET opening_hours = $1, updated_at = NOW() WHERE id = $2`,
          [JSON.stringify(defaultOpeningHours), row.id],
        );
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error processing escort ${row.id}:`, error);
        errorCount++;
      }
    }

    console.log(`
    ✅ Update completed!
    📊 Total processed: ${totalEscorts}
    🔄 Updated: ${updatedCount}
    ❌ Errors: ${errorCount}
    `);

    return NextResponse.json({
      success: true,
      message: `Successfully updated working hours for ${updatedCount} escorts`,
      stats: { total: totalEscorts, updated: updatedCount, errors: errorCount },
    });
  } catch (error) {
    console.error("Update failed:", error);
    return NextResponse.json(
      {
        error: "Failed to update escorts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to update all escorts with default working hours (08:00-23:00).",
    defaultWorkingHours: {
      monday: {start: "08:00", end: "23:00", enabled: true},
      tuesday: {start: "08:00", end: "23:00", enabled: true},
      wednesday: {start: "08:00", end: "23:00", enabled: true},
      thursday: {start: "08:00", end: "23:00", enabled: true},
      friday: {start: "08:00", end: "23:00", enabled: true},
      saturday: {start: "08:00", end: "23:00", enabled: true},
      sunday: {start: "08:00", end: "23:00", enabled: true},
    },
    defaultOpeningHours: {
      monday: "08:00-23:00",
      tuesday: "08:00-23:00",
      wednesday: "08:00-23:00",
      thursday: "08:00-23:00",
      friday: "08:00-23:00",
      saturday: "08:00-23:00",
      sunday: "08:00-23:00",
    },
  });
}
