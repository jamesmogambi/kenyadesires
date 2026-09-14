// app/api/admin/images/migrate/route.ts
import { NextRequest, NextResponse } from "next/server";
// import { cloudinaryMigrationService } from "@/lib/services/cloudinary.service";

export const maxDuration = 300; // 5 minutes for longer migrations

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Cloudinary migration service is currently disabled." },
    { status: 501 },
  );
}
