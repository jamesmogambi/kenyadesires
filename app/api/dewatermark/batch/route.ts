import { NextRequest, NextResponse } from "next/server";
import { BatchImageProcessor } from "@/lib/services/BatchImageProcessor";

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
            message: "Batch processing is already running",
            stats,
            isRunning: true,
          });
        }

        const processor = new BatchImageProcessor({
          batchSize: batchSize || 5,
          maxConcurrent: maxConcurrent || 3,
          delayBetweenBatches: delayBetweenBatches || 2000,
          maxRetries: maxRetries || 3,
          timeout: timeout || 60000,
          resumeFromEscortId: resumeFromEscortId,
        });

        activeProcessors.set("default", processor);

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
          message: resumeFromEscortId
            ? "Batch processing resumed"
            : "Batch processing started",
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

        if (!processor) {
          return NextResponse.json({
            isRunning: false,
            message: "No active batch processing",
            checkpoint: null,
          });
        }

        const stats = processor.getStats();
        const progress = processor.getProgress();

        return NextResponse.json({
          isRunning: processor.isRunning(),
          stats,
          progress,
          checkpoint: null,
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
          message: "Batch processing stopped.",
        });
      }

      case "reset": {
        const processor = activeProcessors.get("default");
        if (processor) {
          (processor as any).stop?.();
          activeProcessors.delete("default");
        }

        return NextResponse.json({ error: "Not available" }, { status: 503 });
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
