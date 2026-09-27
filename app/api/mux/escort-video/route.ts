import { NextRequest, NextResponse } from "next/server";
import { Mux } from "@mux/mux-node";
import { executeQuery, encodeJsonColumn } from "@/lib/neon";

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

const UPLOAD_TIMEOUT_MS = 120_000;
const UPLOAD_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a direct-upload URL and PUTs the video to it.
 *
 * The upload target is a signed Mux/GCS URL reached from the server, so the
 * socket can drop on a transient network fault (ETIMEDOUT/ECONNRESET) with no
 * code error. A fresh URL is created per attempt because signed upload URLs are
 * single-use, and the response status is checked: a 4xx/5xx here used to be
 * ignored, leaving the caller polling for an asset that will never exist.
 */
async function uploadToMux(file: File, escortId: string) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      const upload: any = await muxClient.video.uploads.create({
        new_asset_settings: {
          playback_policies: ["public"],
          passthrough: escortId,
          test: process.env.NODE_ENV !== "production",
        },
        cors_origin: "*",
      });

      const response = await fetch(upload.url!, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: Buffer.from(await file.arrayBuffer()),
        signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(
          `Mux upload rejected the file: ${response.status} ${response.statusText} ${detail}`.trim(),
        );
      }

      return { uploadId: upload.id };
    } catch (error) {
      lastError = error;
      console.error(
        `Mux upload attempt ${attempt}/${UPLOAD_ATTEMPTS} failed:`,
        error,
      );
      if (attempt < UPLOAD_ATTEMPTS) await sleep(attempt * 1000);
    }
  }

  const cause = (lastError as any)?.cause;
  const code = cause?.code || (lastError as any)?.code;
  throw new Error(
    `Failed to upload video to Mux after ${UPLOAD_ATTEMPTS} attempts${
      code ? ` (${code})` : ""
    }: ${(lastError as any)?.message || String(lastError)}`,
  );
}

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

    const { uploadId } = await uploadToMux(file, escortId);

    const maxAttempts = 30;
    const pollInterval = 2000;
    let playbackId: string | null = null;
    let assetId: string | null = null;
    let assetStatus: string | null = null;

    for (let i = 0; i < maxAttempts; i++) {
      await sleep(pollInterval);

      const uploadStatus = await muxClient.video.uploads.retrieve(uploadId);

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
      const nextVideos = Array.from(
        new Set([...currentVideos, playbackId]),
      );
      await executeQuery(
        "UPDATE escorts SET videos = $1, updated_at = NOW() WHERE id = $2",
        [encodeJsonColumn("videos", nextVideos), escortId],
      );

      return NextResponse.json({
        success: true,
        message: "Video uploaded and processed successfully",
        escortId,
        playbackId,
        assetId,
        uploadId,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Video uploaded. Processing in progress. The video will appear once processing is complete.",
      escortId,
      uploadId,
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
