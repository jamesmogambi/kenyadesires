import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

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

    // Verify escort exists
    const docRef = adminDb.collection("escorts").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Escort not found" },
        { status: 404 },
      );
    }

    // Update the videos array on the escort document
    await docRef.update({
      videos: videos,
      updatedAt: FieldValue.serverTimestamp(),
    });

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

    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Escort not found" },
        { status: 404 },
      );
    }

    const data = doc.data();
    return NextResponse.json({
      success: true,
      videos: data?.videos || [],
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
