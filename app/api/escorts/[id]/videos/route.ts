import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/neon";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { videos } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Escort ID is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(videos)) {
      return NextResponse.json(
        { success: false, error: "videos must be an array" },
        { status: 400 },
      );
    }

    const result: any[] = await executeQuery(
      "SELECT id FROM escorts WHERE id = $1",
      [id],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Escort not found" },
        { status: 404 },
      );
    }

    await executeQuery(
      "UPDATE escorts SET videos = $1, updated_at = NOW() WHERE id = $2",
      [videos, id],
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${videos.length} video(s) for escort ${id}`,
      escortId: id,
      videoCount: videos.length,
    });
  } catch (error: any) {
    console.error("Failed to sync videos:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to sync videos",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Escort ID is required" },
        { status: 400 },
      );
    }

    const result: any[] = await executeQuery(
      "SELECT videos FROM escorts WHERE id = $1",
      [id],
    );

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: "Escort not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      videos: result[0]?.videos || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch videos",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}
