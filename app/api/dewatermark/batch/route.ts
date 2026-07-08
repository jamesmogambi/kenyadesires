import { NextRequest, NextResponse } from "next/server";
// import { BatchImageProcessor } from '@/services/BatchImageProcessor';
import { adminDb } from "@/lib/firebase-admin";
import { BatchImageProcessor } from "@/lib/services/BatchImageProcessor";

// Store active processors
const activeProcessors: Map<string, BatchImageProcessor> = new Map();

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

    // Validate API key
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    switch (action) {
      case "start": {
        // Check if a processor is already running
        const existingProcessor = activeProcessors.get("default");
        if (existingProcessor && existingProcessor.isRunning()) {
          const stats = existingProcessor.getStats();
          return NextResponse.json({
            message: "Batch processing is already running",
            stats,
            isRunning: true,
          });
        }

        // Reset checkpoint if requested
        if (resetCheckpoint) {
          await adminDb
            .collection("processing_checkpoints")
            .doc("batch_processing_checkpoint")
            .delete();
          console.log("🔄 Checkpoint reset");
        }

        // Get the last checkpoint for resume
        let resumeFrom = resumeFromEscortId;
        if (!resumeFrom) {
          const checkpointDoc = await adminDb
            .collection("processing_checkpoints")
            .doc("batch_processing_checkpoint")
            .get();

          if (checkpointDoc.exists) {
            const data = checkpointDoc.data();
            resumeFrom = data?.lastEscortId;
            console.log(`📌 Resuming from: ${resumeFrom}`);
          }
        }

        // Create new processor
        const processor = new BatchImageProcessor({
          batchSize: batchSize || 5,
          maxConcurrent: maxConcurrent || 3,
          delayBetweenBatches: delayBetweenBatches || 2000,
          maxRetries: maxRetries || 3,
          timeout: timeout || 60000,
          resumeFromEscortId: resumeFrom,
        });

        activeProcessors.set("default", processor);

        // Start processing in background
        processor
          .processAllEscorts(limit)
          .then((stats) => {
            console.log(`[Batch] Processing completed:`, stats);
            activeProcessors.delete("default");
          })
          .catch((error) => {
            console.error(`[Batch] Processing failed:`, error);
          });

        return NextResponse.json({
          success: true,
          message: resumeFrom
            ? "Batch processing resumed"
            : "Batch processing started",
          resumeFrom: resumeFrom || "start",
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

        const checkpointDoc = await adminDb
          .collection("processing_checkpoints")
          .doc("batch_processing_checkpoint")
          .get();
        const checkpoint = checkpointDoc.exists ? checkpointDoc.data() : null;

        if (!processor) {
          return NextResponse.json({
            isRunning: false,
            message: "No active batch processing",
            checkpoint: checkpoint
              ? {
                  lastEscortId: checkpoint.lastEscortId,
                  processedCount: checkpoint.processedCount,
                  timestamp: checkpoint.timestamp?.toDate?.() || null,
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
              }
            : null,
        });
      }

      case "stop": {
        const processor = activeProcessors.get("default");
        if (!processor) {
          return NextResponse.json({
            success: false,
            message: "No active batch processing to stop",
          });
        }

        (processor as any).stop?.();
        activeProcessors.delete("default");

        return NextResponse.json({
          success: true,
          message:
            "Batch processing stopped. Checkpoint saved. You can resume later.",
        });
      }

      case "reset": {
        await adminDb
          .collection("processing_checkpoints")
          .doc("batch_processing_checkpoint")
          .delete();

        const processor = activeProcessors.get("default");
        if (processor) {
          (processor as any).stop?.();
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
    console.error("[Batch] Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
