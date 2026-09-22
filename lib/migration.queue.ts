// lib/migration-queue.ts
// Firebase references removed - migration queue is no longer operational

export interface MigrationJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "paused";
  totalEscorts: number;
  processedEscorts: number;
  totalImages: number;
  uploadedImages: number;
  failedImages: number;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  errors: string[];
  currentBatch: number;
  lastProcessedId?: string;
}

class MigrationQueue {
  private static instance: MigrationQueue;
  private isProcessing = false;
  private isPaused = false;
  private currentJob: MigrationJob | null = null;
  private batchSize = 5;
  private delayBetweenBatches = 2000;
  private delayBetweenImages = 500;

  static getInstance(): MigrationQueue {
    if (!MigrationQueue.instance) {
      MigrationQueue.instance = new MigrationQueue();
    }
    return MigrationQueue.instance;
  }

  async startMigration(_options?: {
    batchSize?: number;
    delay?: number;
    imageDelay?: number;
    maxEscorts?: number;
  }) {
    return {
      success: false,
      message: "Migration queue is not operational (Firebase removed)",
      job: null,
    };
  }

  async pauseMigration() {
    return { success: false, message: "No migration in progress" };
  }

  async resumeMigration() {
    return { success: false, message: "No paused migration found" };
  }

  getJobStatus() {
    return { status: "no_job", message: "No migration job has been started" };
  }

  async cancelMigration() {
    return { success: false, message: "No migration in progress" };
  }

  async resetAllMigrationFlags() {
    return { success: false, message: "Not operational (Firebase removed)" };
  }
}

export const migrationQueue = MigrationQueue.getInstance();