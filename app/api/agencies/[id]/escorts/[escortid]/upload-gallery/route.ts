// app/api/agencies/[id]/escorts/[escortId]/upload-gallery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EscortModel } from "@/lib/models/escort.model";
import { executeQuery } from "@/lib/neon";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; escortId: string } },
) {
  try {
    const { id: agencyId, escortId } = await params;

    const agencyResult: any[] = await executeQuery(
      `SELECT 1 FROM agencies WHERE id = $1`,
      [agencyId],
    );

    if (agencyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Agency not found" },
        { status: 404 },
      );
    }

    const escort = await EscortModel.getById(escortId);
    if (!escort) {
      return NextResponse.json(
        { success: false, error: "Escort not found" },
        { status: 404 },
      );
    }

    if (escort.agencyId !== agencyId) {
      return NextResponse.json(
        { success: false, error: "Escort does not belong to this agency" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("gallery") as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Image storage not available" },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Error uploading gallery:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
