import { NextResponse } from "next/server";
import regionsData from "../../../data/development/regions.json";
import { executeQuery } from "@/lib/neon";

export interface IRegion {
  name: string;
  countyCode: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Seeding only allowed in development environment" },
        { status: 403 },
      );
    }

    const regions = Array.isArray(regionsData) ? regionsData : [regionsData];

    console.log(`📊 Processing ${regions.length} regions...`);

    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const region of regions) {
      try {
        if (!region.name || !region.countyCode) {
          console.error(`❌ Invalid region data: missing name or countyCode`);
          errors++;
          continue;
        }

        const existing: any[] = await executeQuery(
          `SELECT COUNT(*) as count FROM regions WHERE name = $1 AND county_code = $2`,
          [region.name, region.countyCode],
        );

        if (parseInt(existing[0]?.count || "0", 10) > 0) {
          console.log(`⚠️ Skipping ${region.name} (${region.countyCode}) - already exists`);
          skipped++;
          continue;
        }

        await executeQuery(
          `INSERT INTO regions (name, county_code, is_active, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())`,
          [region.name, region.countyCode, region.isActive !== undefined ? region.isActive : true],
        );

        added++;
        console.log(`✅ Added: ${region.name} (County: ${region.countyCode})`);
      } catch (error) {
        console.error(`❌ Error processing ${region.name}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: { added, skipped, errors, total: regions.length },
      message: `Successfully added ${added} regions to Neon DB`,
    });
  } catch (error) {
    console.error("Seeding failed:", error);
    return NextResponse.json(
      {
        error: "Failed to seed regions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
