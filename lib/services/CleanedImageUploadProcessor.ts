import { adminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "escorts-unsigned";

const IS_CLOUDINARY_URL = (url: string): boolean =>
  url.includes("res.cloudinary.com") || url.includes("cloudinary.com");

interface UploadOptions {
  batchSize?: number;
  maxConcurrent?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  timeout?: number;
  resumeFromEscortId?: string;
}

interface UploadStats {
  totalEscorts: number;
  processedEscorts: number;
  failedEscorts: number;
  totalImages: number;
  uploadedImages: number;
  failedImages: number;
  alreadyCloudinary: number;
  startTime: Date;
  endTime?: Date;
  errors: string[];
  checkpoint: {
    lastEscortId: string;
    processedCount: number;
    timestamp: Date;
  };
}

interface EscortData {
  name?: string;
  cleanedImages?: string[];
  imagesMetadata?: Record<string, any>;
  [key: string]: any;
}

export class CleanedImageUploadProcessor {
  private options: Required<UploadOptions>;
  private isProcessing: boolean = false;
  private stats: UploadStats;
  private currentBatch: number = 0;
  private checkpointDocId: string = "cleaned_images_upload_checkpoint";
  private shouldStop: boolean = false;

  constructor(options: UploadOptions = {}) {
    this.options = {
      batchSize: 5,
      maxConcurrent: 3,
      delayBetweenBatches: 2000,
      maxRetries: 3,
      timeout: 60000,
      resumeFromEscortId: "",
      ...options,
    };

    this.stats = {
      totalEscorts: 0,
      processedEscorts: 0,
      failedEscorts: 0,
      totalImages: 0,
      uploadedImages: 0,
      failedImages: 0,
      alreadyCloudinary: 0,
      startTime: new Date(),
      errors: [],
      checkpoint: {
        lastEscortId: "",
        processedCount: 0,
        timestamp: new Date(),
      },
    };
  }

  async processAll(limit?: number): Promise<UploadStats> {
    if (this.isProcessing) {
      throw new Error("Upload processing is already running");
    }

    this.isProcessing = true;
    this.shouldStop = false;
    this.stats.startTime = new Date();
    this.stats.errors = [];

    console.log("\n🚀 Starting cleaned image upload to Cloudinary...");
    console.log(`📊 Configuration:`, {
      batchSize: this.options.batchSize,
      maxConcurrent: this.options.maxConcurrent,
      maxRetries: this.options.maxRetries,
      resumeFrom: this.options.resumeFromEscortId || "start",
    });

    try {
      await this.loadCheckpoint();

      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
        adminDb.collection(COLLECTIONS.ESCORTS)
          .select("name", "cleanedImages", "hasCleanedImages");

      if (this.options.resumeFromEscortId || this.stats.checkpoint.lastEscortId) {
        query = query.orderBy("__name__");
        const resumeId = this.options.resumeFromEscortId || this.stats.checkpoint.lastEscortId;
        if (resumeId) {
          query = query.startAfter(resumeId);
        }
      }

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();

      const escortsWithCleanedImages = snapshot.docs.filter((doc) => {
        const data = doc.data() as EscortData;
        return data.cleanedImages && Array.isArray(data.cleanedImages) && data.cleanedImages.length > 0;
      });

      if (escortsWithCleanedImages.length === 0) {
        console.log("✅ No escorts with cleanedImages found");
        return this.stats;
      }

      if (this.stats.totalEscorts === 0) {
        this.stats.totalEscorts = escortsWithCleanedImages.length + this.stats.checkpoint.processedCount;
        let totalImages = 0;
        for (const doc of escortsWithCleanedImages) {
          const data = doc.data() as EscortData;
          totalImages += (data.cleanedImages || []).length;
        }
        this.stats.totalImages = totalImages;
      }

      console.log(`📊 Found ${escortsWithCleanedImages.length} escorts with cleanedImages`);
      console.log(`📊 Total escorts: ${this.stats.totalEscorts}, Total images: ${this.stats.totalImages}`);
      console.log(`📊 Already processed: ${this.stats.checkpoint.processedCount} escorts`);

      const batches = this.chunkArray(escortsWithCleanedImages, this.options.batchSize);

      for (let i = 0; i < batches.length; i++) {
        if (this.shouldStop) {
          console.log("🛑 Processing stopped by user");
          break;
        }

        this.currentBatch = i + 1;
        const batch = batches[i];

        console.log(`\n📦 Batch ${this.currentBatch}/${batches.length}`);
        console.log(`   ${batch.length} escorts in this batch`);

        await this.processBatch(batch);

        await this.saveCheckpoint();

        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${this.options.delayBetweenBatches}ms before next batch...`);
          await this.delay(this.options.delayBetweenBatches);
        }
      }

      if (!this.shouldStop) {
        await this.clearCheckpoint();
      }

      this.stats.endTime = new Date();
      const duration = (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000;

      console.log("\n🎉 Upload processing completed!");
      console.log(`📊 Duration: ${duration} seconds`);
      console.log(`📊 Escorts: ${this.stats.processedEscorts} processed, ${this.stats.failedEscorts} failed`);
      console.log(`📊 Images: ${this.stats.uploadedImages} uploaded, ${this.stats.failedImages} failed, ${this.stats.alreadyCloudinary} already on Cloudinary`);

      return this.stats;
    } catch (error: any) {
      console.error("❌ Upload processing error:", error);
      this.stats.errors.push(error.message);
      await this.saveCheckpoint();
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private async processBatch(docs: any[]): Promise<void> {
    const maxConcurrent = this.options.maxConcurrent;

    for (let i = 0; i < docs.length; i += maxConcurrent) {
      if (this.shouldStop) break;

      const chunk = docs.slice(i, i + maxConcurrent);
      const chunkPromises = chunk.map((doc) => this.processEscort(doc));
      await Promise.allSettled(chunkPromises);

      if (chunk.length > 0) {
        const lastDoc = chunk[chunk.length - 1];
        this.stats.checkpoint.lastEscortId = lastDoc.id;
        this.stats.checkpoint.processedCount = this.stats.processedEscorts + this.stats.failedEscorts;
        this.stats.checkpoint.timestamp = new Date();
        await this.saveCheckpoint();
      }

      if (i + maxConcurrent < docs.length) {
        await this.delay(500);
      }
    }
  }

  private async processEscort(doc: any): Promise<void> {
    const escortId = doc.id;
    const data: EscortData = doc.data();
    const escortName = data.name || "Unknown";
    const cleanedImages: string[] = data.cleanedImages || [];

    console.log(`\n🔄 Processing escort: ${escortName} (${escortId})`);
    console.log(`   📸 ${cleanedImages.length} cleaned images to upload`);

    try {
      const updatedImages: string[] = [];
      let uploaded = 0;
      let failed = 0;
      let skippable = 0;

      for (let i = 0; i < cleanedImages.length; i++) {
        if (this.shouldStop) break;

        const imageUrl = cleanedImages[i];

        if (IS_CLOUDINARY_URL(imageUrl)) {
          skippable++;
          updatedImages.push(imageUrl);
          continue;
        }

        const result = await this.uploadToCloudinary(imageUrl, escortId, i);
        if (result) {
          updatedImages.push(result.url);
          uploaded++;
        } else {
          updatedImages.push(imageUrl);
          failed++;
        }

        await this.delay(500);
      }

      if (updatedImages.length > 0 && (uploaded > 0 || skippable > 0)) {
        await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
          cleanedImages: updatedImages,
        });
      }

      this.stats.processedEscorts++;
      this.stats.uploadedImages += uploaded;
      this.stats.failedImages += failed;
      this.stats.alreadyCloudinary += skippable;

      console.log(`   ✅ Escort done: ${uploaded} uploaded, ${failed} failed, ${skippable} already on Cloudinary`);
    } catch (error: any) {
      console.error(`   ❌ Failed to process escort ${escortId}:`, error.message);
      this.stats.failedEscorts++;
      this.stats.errors.push(`Escort ${escortId}: ${error.message}`);
    }
  }

  private async uploadToCloudinary(
    imageUrl: string,
    escortId: string,
    index: number,
  ): Promise<{ url: string; publicId: string } | null> {
    const publicId = `cleaned-escort-${escortId.replace(/[^a-zA-Z0-9]/g, "")}-${index}`;

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        console.log(`   ⬆️  Uploading [${attempt + 1}/${this.options.maxRetries}] image ${index + 1}...`);

        const result = await this.uploadViaCurl(imageUrl, publicId, escortId);

        if (result?.secure_url) {
          console.log(`   ✅ Uploaded to ${result.secure_url.substring(0, 60)}...`);
          return { url: result.secure_url, publicId: result.public_id };
        }

        throw new Error("No secure_url in response");
      } catch (err: any) {
        const msg = err.message || String(err);
        console.log(`   ⚠️  Attempt ${attempt + 1} failed: ${msg.substring(0, 120)}`);

        if (msg.includes("rate limit") || msg.includes("429")) {
          await this.delay(5000 * (attempt + 1));
        } else if (attempt < this.options.maxRetries - 1) {
          await this.delay(2000 * (attempt + 1));
        }
      }
    }

    console.log(`   ❌ Failed after ${this.options.maxRetries} attempts`);
    return null;
  }

  private async uploadViaCurl(
    imageUrl: string,
    publicId: string,
    escortId: string,
  ): Promise<any> {
    const { execFileSync } = await import("child_process");
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const args = [
      "-s", "-S",
      "-w", "\n%{http_code}",
      "--max-time", "300",
      "-X", "POST",
      url,
      "-F", `file=${imageUrl}`,
      "-F", `upload_preset=${CLOUDINARY_UPLOAD_PRESET}`,
      "-F", `public_id=${publicId}`,
      "-F", `folder=escorts`,
      "-F", `tags=escort,migrated,cleaned,${escortId}`,
    ];

    const output = execFileSync("curl", args, {
      encoding: "utf-8",
      timeout: 310000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const lines = output.trim().split("\n");
    const httpCode = lines[lines.length - 1];
    const body = lines.slice(0, -1).join("\n");

    if (httpCode !== "200") {
      let errMsg = `HTTP ${httpCode}`;
      try {
        const parsed = JSON.parse(body);
        if (parsed.error?.message) errMsg = parsed.error.message;
      } catch {
        errMsg += `: ${body.substring(0, 200)}`;
      }
      throw new Error(errMsg);
    }

    return JSON.parse(body);
  }

  private async loadCheckpoint(): Promise<void> {
    try {
      const checkpointDoc = await adminDb
        .collection("processing_checkpoints")
        .doc(this.checkpointDocId)
        .get();

      if (checkpointDoc.exists) {
        const data = checkpointDoc.data();
        this.stats.checkpoint = {
          lastEscortId: data?.lastEscortId || "",
          processedCount: data?.processedCount || 0,
          timestamp: data?.timestamp?.toDate() || new Date(),
        };
        this.stats.processedEscorts = this.stats.checkpoint.processedCount;

        console.log(`📌 Checkpoint loaded: ${this.stats.checkpoint.processedCount} escorts processed`);
        console.log(`📌 Last escort: ${this.stats.checkpoint.lastEscortId}`);
      }
    } catch (error) {
      console.log("No checkpoint found, starting from beginning");
    }
  }

  private async saveCheckpoint(): Promise<void> {
    try {
      await adminDb
        .collection("processing_checkpoints")
        .doc(this.checkpointDocId)
        .set({
          lastEscortId: this.stats.checkpoint.lastEscortId,
          processedCount: this.stats.checkpoint.processedCount,
          timestamp: FieldValue.serverTimestamp(),
          totalEscorts: this.stats.totalEscorts,
          totalImages: this.stats.totalImages,
          uploadedImages: this.stats.uploadedImages,
          failedImages: this.stats.failedImages,
          alreadyCloudinary: this.stats.alreadyCloudinary,
          batch: this.currentBatch,
        });
    } catch (error) {
      console.error("Failed to save checkpoint:", error);
    }
  }

  private async clearCheckpoint(): Promise<void> {
    try {
      await adminDb
        .collection("processing_checkpoints")
        .doc(this.checkpointDocId)
        .delete();
      console.log("✅ Checkpoint cleared");
    } catch (error) {
      console.error("Failed to clear checkpoint:", error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats(): UploadStats {
    return this.stats;
  }

  getProgress(): string {
    const total = this.stats.totalEscorts;
    const processed = this.stats.processedEscorts + this.stats.failedEscorts;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

    return `📊 Progress: ${processed}/${total} escorts (${percentage}%) - ${this.stats.uploadedImages} images uploaded, ${this.stats.failedImages} failed, ${this.stats.alreadyCloudinary} already on Cloudinary`;
  }

  isRunning(): boolean {
    return this.isProcessing;
  }

  stop(): void {
    this.shouldStop = true;
  }
}
