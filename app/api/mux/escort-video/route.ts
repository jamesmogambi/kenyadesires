import { NextRequest, NextResponse } from "next/server";
import { Mux } from "@mux/mux-node";
import { executeQuery } from "@/lib/neon";

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

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 500MB." },
        { status: 400 },
      );
    }

    const result: any[] = await executeQuery(
      "SELECT id FROM escorts WHERE id = $1",
      [escortId],
    );
    if (result.length === 0) {
      return NextResponse.json({ error: "Escort not found" }, { status: 404 });
    }

    const upload = await muxClient.video.uploads.create({
      new_asset_settings: {
        playback_policies: ["public"],
        passthrough: escortId,
        test: process.env.NODE_ENV !== "production",
      },
      cors_origin: "*",
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fetch(upload.url!, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: buffer,
    });

    const maxAttempts = 30;
    const pollInterval = 2000;
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

    if (playbackId) {
      const currentResult: any[] = await executeQuery(
        "SELECT videos FROM escorts WHERE id = $1",
        [escortId],
      );
      const currentVideos: string[] = currentResult[0]?.videos || [];
      await executeQuery(
        "UPDATE escorts SET videos = $1, updated_at = NOW() WHERE id = $2",
        [[...currentVideos, playbackId], escortId],
      );

      return NextResponse.json({
        success: true,
        message: "Video uploaded and processed successfully",
        escortId,
        playbackId,
        assetId,
        uploadId: upload.id,
      });
    }

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
