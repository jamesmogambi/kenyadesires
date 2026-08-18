import { NextRequest, NextResponse } from "next/server";
import { CleanedImageUploadProcessor } from "@/lib/services/CleanedImageUploadProcessor";

const activeProcessors: Map<string, CleanedImageUploadProcessor> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      limit,
      batchSize,
      maxConcurrent,
      delayBetweenBatches,
      maxRetries,
      timeout,
      resumeFromEscortId,
      resetCheckpoint,
    } = body;

    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (action) {
      case "start": {
        const existingProcessor = activeProcessors.get("default");
        if (existingProcessor && existingProcessor.isRunning()) {
          const stats = existingProcessor.getStats();
          return NextResponse.json({
            message: "Upload processing is already running",
            stats,
            isRunning: true,
          });
        }

        if (resetCheckpoint) {
          const { adminDb } = await import("@/lib/firebase-admin");
          await adminDb
            .collection("processing_checkpoints")
            .doc("cleaned_images_upload_checkpoint")
            .delete();
          console.log("🔄 Checkpoint reset");
        }

        const processor = new CleanedImageUploadProcessor({
          batchSize: batchSize || 5,
          maxConcurrent: maxConcurrent || 3,
          delayBetweenBatches: delayBetweenBatches || 2000,
          maxRetries: maxRetries || 3,
          timeout: timeout || 60000,
          resumeFromEscortId: resumeFromEscortId,
        });

        activeProcessors.set("default", processor);

        processor
          .processAll(limit)
          .then((stats) => {
            console.log(`[CleanedImageUpload] Processing completed:`, stats);
            activeProcessors.delete("default");
          })
          .catch((error) => {
            console.error(`[CleanedImageUpload] Processing failed:`, error);
          });

        return NextResponse.json({
          success: true,
          message: resumeFromEscortId
            ? "Upload processing resumed"
            : "Upload processing started",
          resumeFrom: resumeFromEscortId || "start",
          options: {
            batchSize: batchSize || 5,
            maxConcurrent: maxConcurrent || 3,
            maxRetries: maxRetries || 3,
            limit: limit || "all",
          },
        });
      }

      case "status": {
        const processor = activeProcessors.get("default");

        const { adminDb } = await import("@/lib/firebase-admin");
        const checkpointDoc = await adminDb
          .collection("processing_checkpoints")
          .doc("cleaned_images_upload_checkpoint")
          .get();
        const checkpoint = checkpointDoc.exists ? checkpointDoc.data() : null;

        if (!processor) {
          return NextResponse.json({
            isRunning: false,
            message: "No active upload processing",
            checkpoint: checkpoint
              ? {
                  lastEscortId: checkpoint.lastEscortId,
                  processedCount: checkpoint.processedCount,
                  timestamp: checkpoint.timestamp?.toDate?.() || null,
                  batch: checkpoint.batch || 0,
                  totalImages: checkpoint.totalImages,
                  uploadedImages: checkpoint.uploadedImages,
                  failedImages: checkpoint.failedImages,
                  alreadyCloudinary: checkpoint.alreadyCloudinary,
                }
              : null,
          });
        }

        const stats = processor.getStats();
        const progress = processor.getProgress();

        return NextResponse.json({
          isRunning: processor.isRunning(),
          stats,
          progress,
          checkpoint: checkpoint
            ? {
                lastEscortId: checkpoint.lastEscortId,
                processedCount: checkpoint.processedCount,
                timestamp: checkpoint.timestamp?.toDate?.() || null,
                batch: checkpoint.batch || 0,
                totalImages: checkpoint.totalImages,
                uploadedImages: checkpoint.uploadedImages,
                failedImages: checkpoint.failedImages,
                alreadyCloudinary: checkpoint.alreadyCloudinary,
              }
            : null,
        });
      }

      case "stop": {
        const processor = activeProcessors.get("default");
        if (!processor) {
          return NextResponse.json({
            success: false,
            message: "No active upload processing to stop",
          });
        }

        processor.stop();
        activeProcessors.delete("default");

        return NextResponse.json({
          success: true,
          message: "Upload processing stopped. Checkpoint saved. You can resume later.",
        });
      }

      case "reset": {
        const { adminDb } = await import("@/lib/firebase-admin");
        await adminDb
          .collection("processing_checkpoints")
          .doc("cleaned_images_upload_checkpoint")
          .delete();

        const processor = activeProcessors.get("default");
        if (processor) {
          processor.stop();
          activeProcessors.delete("default");
        }

        return NextResponse.json({
          success: true,
          message: "Checkpoint reset successfully.",
        });
      }

      default: {
        return NextResponse.json(
          {
            error: "Invalid action. Use: start, status, stop, or reset",
          },
          { status: 400 },
        );
      }
    }
  } catch (error: any) {
    console.error("[CleanedImageUpload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
