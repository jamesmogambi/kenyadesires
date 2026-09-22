import { NextRequest, NextResponse } from "next/server";
import { imageCleaner } from "@/lib/services/imageCleaner";
import { executeQuery } from "@/lib/neon";

export async function POST(
  request: NextRequest,
  { params }: { params: { escortId: string } }
) {
  const startTime = Date.now();
  const { escortId } = params;

  try {
    const escortResult: any[] = await executeQuery(
      `SELECT * FROM escorts WHERE id = $1`,
      [escortId],
    );

    if (escortResult.length === 0) {
      return NextResponse.json(
        { success: false, error: `Escort with ID ${escortId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Image storage not available" },
      { status: 503 }
    );
  } catch (error) {
    console.error('Image cleaning route error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { success: false, error: errorMessage || 'Failed to process image' },
      { status: 500 }
    );
  }
}
