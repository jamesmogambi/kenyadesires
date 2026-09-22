import { NextResponse } from "next/server";
import { EscortModel } from "@/lib/models/escort.model";
import { executeQuery } from "@/lib/neon";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; escortId: string } },
) {
  try {
    const { id: agencyId, escortId } = await params;

    console.log("Fetching escort with ID:", escortId, "for agency:", agencyId);

    const rows: any[] = await executeQuery(
      `SELECT 1 FROM agencies WHERE id = $1 AND is_active = TRUE`,
      [agencyId],
    );

    if (rows.length === 0) {
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

    return NextResponse.json({
      success: true,
      data: escort,
    });
  } catch (error: any) {
    console.error("Error fetching escort:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; escortId: string } },
) {
  try {
    const { id: agencyId, escortId } = await params;

    const rows: any[] = await executeQuery(
      `SELECT 1 FROM agencies WHERE id = $1 AND is_active = TRUE`,
      [agencyId],
    );

    if (rows.length === 0) {
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

    const body = await request.json();
    await EscortModel.update(escortId, body);

    return NextResponse.json({
      success: true,
      message: "Escort updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating escort:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; escortId: string } },
) {
  try {
    const { id: agencyId, escortId } = await params;

    const rows: any[] = await executeQuery(
      `SELECT 1 FROM agencies WHERE id = $1 AND is_active = TRUE`,
      [agencyId],
    );

    if (rows.length === 0) {
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

    await EscortModel.delete(escortId);

    return NextResponse.json({
      success: true,
      message: "Escort removed from agency successfully",
    });
  } catch (error: any) {
    console.error("Error deleting escort:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
