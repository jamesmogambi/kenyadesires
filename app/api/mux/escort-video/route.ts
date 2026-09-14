import { NextRequest, NextResponse } from "next/server";
import { Mux } from "@mux/mux-node";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";


const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const escortId = formData.get("escortId") as string;
    const file = formData.get("video") as File;

    if (!escortId) {
      return NextResponse.json(
        { error: "Escort ID is required" },
        { status: 400 },
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 },
      );
    }

    // Validate file type and size
    const validTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!validTypes.includes(file.type) && !file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only video files are allowed." },
        { status: 400 },
      );
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB." },
        { status: 400 },
      );
    }

    // Verify escort exists
    const escortDoc = await adminDb.collection("escorts").doc(escortId).get();
    if (!escortDoc.exists) {
      return NextResponse.json({ error: "Escort not found" }, { status: 404 });
    }

    // Create a Direct Upload to Mux with passthrough = escortId
    const upload = await muxClient.video.uploads.create({
      new_asset_settings: {
        playback_policies: ["public"],
        passthrough: escortId,
        test: process.env.NODE_ENV !== "production",
      },
      cors_origin: "*",
    });

    // Upload the file to the Mux Direct Upload URL
    const buffer = Buffer.from(await file.arrayBuffer());
    await fetch(upload.url!, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: buffer,
    });

    // Poll for the asset to be ready (max 60 seconds)
    const maxAttempts = 30;
    const pollInterval = 2000; // 2 seconds
    let playbackId: string | null = null;
    let assetId: string | null = null;
    let assetStatus: string | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      const uploadStatus = await muxClient.video.uploads.retrieve(upload.id);

      if (uploadStatus.status === "asset_created" && uploadStatus.asset_id) {
        assetId = uploadStatus.asset_id;
        const asset = await muxClient.video.assets.retrieve(assetId);
        assetStatus = asset.status;

        if (asset.status === "ready") {
          playbackId = asset.playback_ids?.[0]?.id || null;
          break;
        }

        if (asset.status === "errored") {
          break;
        }
      }

      if (uploadStatus.status === "errored") {
        break;
      }
    }

    // Update Firestore
    if (playbackId && assetId) {
      const escortData = escortDoc.data();
      const existingVideos = Array.isArray(escortData?.videos)
        ? escortData.videos
        : [];

      await adminDb.collection("escorts").doc(escortId).update({
        videos: [...existingVideos, playbackId],
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        message: "Video uploaded and processed successfully",
        escortId,
        playbackId,
        assetId,
        uploadId: upload.id,
      });
    }

    // Asset still processing — return upload info for webhook follow-up
    return NextResponse.json({
      success: true,
      message:
        "Video uploaded. Processing in progress. The video will appear once processing is complete.",
      escortId,
      uploadId: upload.id,
      assetId,
      status: assetStatus || "processing",
      playbackId,
    });
  } catch (error: any) {
    console.error("Video upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
        details: error?.message || String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to /api/mux/escort-video with form data: escortId (string) and video (file)",
    acceptedFormats: ["video/mp4", "video/webm", "video/quicktime"],
    maxFileSize: "500MB",
  });
}
