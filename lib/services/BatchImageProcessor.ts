import axios from 'axios';
import FormData from 'form-data';
import { adminDb, COLLECTIONS, bucket } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface ProcessingOptions {
  batchSize?: number;
  maxConcurrent?: number;
  delayBetweenBatches?: number;
  maxRetries?: number;
  timeout?: number;
  resumeFromEscortId?: string;
}

interface ImageMetadata {
  status: 'failed' | 'pending' | 'processed';
  errorMessage?: string;
  processedAt: string;
}

interface ImagesMetadataMap {
  [url: string]: ImageMetadata;
}

interface ProcessingStats {
  totalEscorts: number;
  processedEscorts: number;
  failedEscorts: number;
  totalImages: number;
  processedImages: number;
  failedImages: number;
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
  images: string[];
  imagesMetadata: ImagesMetadataMap;
  [key: string]: any;
}

export class BatchImageProcessor {
  private options: ProcessingOptions;
  private isProcessing: boolean = false;
  private stats: ProcessingStats;
  private currentBatch: number = 0;
  private checkpointDocId: string = 'batch_processing_checkpoint';
  private shouldStop: boolean = false;

  constructor(options: ProcessingOptions = {}) {
    this.options = {
      batchSize: 5,
      maxConcurrent: 3,
      delayBetweenBatches: 2000,
      maxRetries: 3,
      timeout: 60000,
      ...options
    };

    this.stats = {
      totalEscorts: 0,
      processedEscorts: 0,
      failedEscorts: 0,
      totalImages: 0,
      processedImages: 0,
      failedImages: 0,
      startTime: new Date(),
      errors: [],
      checkpoint: {
        lastEscortId: '',
        processedCount: 0,
        timestamp: new Date()
      }
    };
  }

  async processAllEscorts(limit?: number): Promise<ProcessingStats> {
    if (this.isProcessing) {
      throw new Error('Batch processing is already running');
    }

    this.isProcessing = true;
    this.shouldStop = false;
    this.stats.startTime = new Date();
    this.stats.errors = [];

    console.log('\n🚀 Starting batch processing for all escorts...');
    console.log(`📊 Configuration:`, {
      batchSize: this.options.batchSize,
      maxConcurrent: this.options.maxConcurrent,
      maxRetries: this.options.maxRetries,
      timeout: this.options.timeout,
      resumeFrom: this.options.resumeFromEscortId || 'start'
    });

    try {
      // Load checkpoint
      await this.loadCheckpoint();

      // Get all escorts first (Firestore limitation workaround)
      let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection(COLLECTIONS.ESCORTS);
      
      // Only add ordering if we have a resume point
      if (this.options.resumeFromEscortId || this.stats.checkpoint.lastEscortId) {
        query = query.orderBy('id');
        
        // Resume from last processed escort
        const resumeId = this.options.resumeFromEscortId || this.stats.checkpoint.lastEscortId;
        if (resumeId) {
          query = query.startAfter(resumeId);
        }
      }

      // Apply limit if specified
      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      
      // Filter escorts that have images (client-side filtering)
      const escortsWithImages = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.images && Array.isArray(data.images) && data.images.length > 0;
      });

      if (escortsWithImages.length === 0) {
        console.log('✅ No escorts with images found');
        return this.stats;
      }

      // Calculate totals
      if (this.stats.totalEscorts === 0) {
        this.stats.totalEscorts = escortsWithImages.length + this.stats.checkpoint.processedCount;
        let totalImages = 0;
        for (const doc of escortsWithImages) {
          const data = doc.data();
          totalImages += (data.images || []).length;
        }
        this.stats.totalImages = totalImages;
      }

      console.log(`📊 Found ${escortsWithImages.length} escorts with images to process`);
      console.log(`📊 Total escorts: ${this.stats.totalEscorts}, Total images: ${this.stats.totalImages}`);
      console.log(`📊 Already processed: ${this.stats.checkpoint.processedCount} escorts`);

      // Process escorts in batches
      const escortBatches = this.chunkArray(escortsWithImages, this.options.batchSize || 5);

      for (let i = 0; i < escortBatches.length; i++) {
        if (this.shouldStop) {
          console.log('🛑 Processing stopped by user');
          break;
        }

        this.currentBatch = i + 1;
        const batch = escortBatches[i];
        
        console.log(`\n📦 Processing batch ${this.currentBatch}/${escortBatches.length}`);
        console.log(`   ${batch.length} escorts in this batch`);

        await this.processEscortBatch(batch);

        // Save checkpoint after each batch
        await this.saveCheckpoint();

        // Delay between batches
        if (i < escortBatches.length - 1) {
          console.log(`⏳ Waiting ${this.options.delayBetweenBatches}ms before next batch...`);
          await this.delay(this.options.delayBetweenBatches || 2000);
        }
      }

      // Clear checkpoint when complete
      if (!this.shouldStop) {
        await this.clearCheckpoint();
      }

      this.stats.endTime = new Date();
      const duration = (this.stats.endTime.getTime() - this.stats.startTime.getTime()) / 1000;
      
      console.log('\n🎉 Batch processing completed!');
      console.log(`📊 Duration: ${duration} seconds`);
      console.log(`📊 Escorts: ${this.stats.processedEscorts} processed, ${this.stats.failedEscorts} failed`);
      console.log(`📊 Images: ${this.stats.processedImages} processed, ${this.stats.failedImages} failed`);

      return this.stats;

    } catch (error: any) {
      console.error('❌ Batch processing error:', error);
      this.stats.errors.push(error.message);
      
      // Save checkpoint on error
      await this.saveCheckpoint();
      
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private async processEscortBatch(escortDocs: any[]): Promise<void> {
    const maxConcurrent = this.options.maxConcurrent || 3;

    for (let i = 0; i < escortDocs.length; i += maxConcurrent) {
      if (this.shouldStop) break;

      const chunk = escortDocs.slice(i, i + maxConcurrent);
      
      const chunkPromises = chunk.map(doc => this.processSingleEscort(doc));
      await Promise.allSettled(chunkPromises);

      // Update checkpoint after each chunk
      if (chunk.length > 0) {
        const lastDoc = chunk[chunk.length - 1];
        this.stats.checkpoint.lastEscortId = lastDoc.id;
        this.stats.checkpoint.processedCount = this.stats.processedEscorts + this.stats.failedEscorts;
        this.stats.checkpoint.timestamp = new Date();
        await this.saveCheckpoint();
      }

      if (i + maxConcurrent < escortDocs.length) {
        await this.delay(500);
      }
    }
  }

  private async processSingleEscort(doc: any): Promise<void> {
    const escortId: string = doc.id;
    const data: EscortData = doc.data();
    const imageUrls: string[] = data.images || [];
    const metadata: ImagesMetadataMap = data.imagesMetadata || {};

    try {
      console.log(`\n🔄 Processing escort: ${data.name || escortId}`);
      console.log(`   📸 ${imageUrls.length} images to process`);

      const pendingUrls: string[] = imageUrls.filter((url: string) =>
        !metadata[url] || metadata[url]?.status === "failed" || metadata[url]?.status === "pending"
      );

      if (pendingUrls.length === 0) {
        console.log(`   ✅ All images already processed`);
        this.stats.processedEscorts++;
        return;
      }

      await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
        watermarkStatus: 'processing',
        lastProcessedAt: FieldValue.serverTimestamp()
      });

      let processed = 0;
      let failed = 0;

      for (let i = 0; i < pendingUrls.length; i++) {
        if (this.shouldStop) break;

        const imageUrl = pendingUrls[i];
        
        try {
          console.log(`   📸 Processing image ${i + 1}/${pendingUrls.length}`);
          
          const result = await this.processSingleImageWithRetry(
            escortId,
            imageUrl,
            metadata
          );

          if (result.success) {
            processed++;
          } else {
            failed++;
          }
        } catch (error: any) {
          console.error(`   ❌ Image failed:`, error.message);
          failed++;
          
          metadata[imageUrl] = {
            ...metadata[imageUrl],
            status: 'failed',
            errorMessage: error.message || 'Unknown error',
            processedAt: new Date().toISOString()
          };
        }

        // Update progress after each image
        await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
          imagesMetadata: metadata,
          totalImagesProcessed: FieldValue.increment(processed),
          totalImagesFailed: FieldValue.increment(failed)
        });
      }

      const hasCleanedImages = Object.values(metadata).some(
        (m: any) => m.status === "completed" && m.cleanedUrl
      );

      const status = failed === 0 ? "completed" : "failed";
      await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
        watermarkStatus: status,
        watermarkError: failed > 0 ? `${failed} images failed` : null,
        lastProcessedAt: FieldValue.serverTimestamp(),
        hasCleanedImages,
      });

      this.stats.processedEscorts++;
      this.stats.processedImages += processed;
      this.stats.failedImages += failed;

      console.log(`   ✅ Escort processed: ${processed} images, ${failed} failed`);

    } catch (error: any) {
      console.error(`❌ Failed to process escort ${escortId}:`, error);
      this.stats.failedEscorts++;
      this.stats.errors.push(`Escort ${escortId}: ${error.message}`);

      const hasCleanedImages = Object.values(metadata).some(
        (m: any) => m.status === "completed" && m.cleanedUrl
      );

      await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
        watermarkStatus: "failed",
        watermarkError: error.message || "Unknown error",
        lastProcessedAt: FieldValue.serverTimestamp(),
        hasCleanedImages,
      });
    }
  }

  private async processSingleImageWithRetry(
    escortId: string,
    imageUrl: string,
    metadata: any
  ): Promise<{ success: boolean; error?: string }> {
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= (this.options.maxRetries || 3); attempt++) {
      try {
        // Update status to processing
        metadata[imageUrl] = {
          ...metadata[imageUrl],
          status: 'processing',
          attempt: attempt,
          processedAt: new Date().toISOString()
        };

        await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
          imagesMetadata: metadata
        });

        // Process the image
        const result = await this.processSingleImage(escortId, imageUrl);
        
        if (result.success) {
          metadata[imageUrl] = {
            ...metadata[imageUrl],
            cleanedUrl: result.cleanedUrl,
            status: 'completed',
            processedAt: new Date().toISOString(),
            cleanedBy: 'dewatermark',
            attempts: attempt
          };

          await adminDb.collection(COLLECTIONS.ESCORTS).doc(escortId).update({
            imagesMetadata: metadata
          });

          return { success: true };
        } else {
          lastError = result.error || 'Unknown error';
          console.log(`   ⚠️ Attempt ${attempt} failed: ${lastError}`);
        }
      } catch (error: any) {
        lastError = error.message || String(error);
        console.log(`   ⚠️ Attempt ${attempt} error: ${lastError}`);
      }

      if (attempt < (this.options.maxRetries || 3)) {
        const waitTime = 2000 * Math.pow(2, attempt - 1);
        await this.delay(waitTime);
      }
    }

    // Mark as failed after all retries
    metadata[imageUrl] = {
      ...metadata[imageUrl],
      status: 'failed',
      errorMessage: String(lastError || 'Failed after max retries'),
      processedAt: new Date().toISOString()
    };

    return { success: false, error: lastError || 'Failed after max retries' };
  }

  private async processSingleImage(
    escortId: string,
    imageUrl: string
  ): Promise<{ success: boolean; cleanedUrl?: string; error?: string }> {
    try {
      // Download image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const imageBuffer = Buffer.from(imageResponse.data);
      console.log(`   📥 Downloaded ${imageBuffer.length} bytes`);

      // Send to DeWatermark
      const formData = new FormData();
      formData.append('original_preview_image', imageBuffer, {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('remove_text', 'true');
      formData.append('predict_mode', '3.0');

      const dewatermarkResponse = await axios.post(
        'https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark',
        formData,
        {
          headers: {
            'X-API-KEY': process.env.DEWATERMARK_API_KEY,
            ...formData.getHeaders()
          },
          timeout: this.options.timeout || 60000
        }
      );

      if (!dewatermarkResponse.data?.edited_image?.image) {
        throw new Error('Invalid response from DeWatermark');
      }

      const imageBase64 = dewatermarkResponse.data.edited_image.image;
      const sessionId = dewatermarkResponse.data.session_id;
      const imageData = Buffer.from(imageBase64, 'base64');

      // Save to Firebase Storage
      const sanitizedEscortId = escortId.replace(/[^a-zA-Z0-9-]/g, '_');
      const fileName = `cleaned_images/${sanitizedEscortId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const file = bucket.file(fileName);

      await file.save(imageData, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: {
            processedBy: 'dewatermark',
            processedAt: new Date().toISOString(),
            escortId: escortId,
            cleanedBy: 'dewatermark',
            sessionId: sessionId
          }
        },
        public: true
      });

      await file.makePublic();
      const cleanedUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      console.log(`   ✅ Image processed successfully`);
      return { success: true, cleanedUrl };

    } catch (error: any) {
      console.error(`   ❌ Image processing error:`, error.message);
      return { success: false, error: error.message || String(error) };
    }
  }

  // Checkpoint Management
  private async loadCheckpoint(): Promise<void> {
    try {
      const checkpointDoc = await adminDb
        .collection('processing_checkpoints')
        .doc(this.checkpointDocId)
        .get();

      if (checkpointDoc.exists) {
        const data = checkpointDoc.data();
        this.stats.checkpoint = {
          lastEscortId: data?.lastEscortId || '',
          processedCount: data?.processedCount || 0,
          timestamp: data?.timestamp?.toDate() || new Date()
        };
        this.stats.processedEscorts = this.stats.checkpoint.processedCount;
        
        console.log(`📌 Checkpoint loaded: ${this.stats.checkpoint.processedCount} escorts processed`);
        console.log(`📌 Last escort: ${this.stats.checkpoint.lastEscortId}`);
      }
    } catch (error) {
      console.log('No checkpoint found, starting from beginning');
    }
  }

  private async saveCheckpoint(): Promise<void> {
    try {
      await adminDb
        .collection('processing_checkpoints')
        .doc(this.checkpointDocId)
        .set({
          lastEscortId: this.stats.checkpoint.lastEscortId,
          processedCount: this.stats.checkpoint.processedCount,
          timestamp: FieldValue.serverTimestamp(),
          totalEscorts: this.stats.totalEscorts,
          totalImages: this.stats.totalImages,
          processedImages: this.stats.processedImages,
          failedImages: this.stats.failedImages,
          batch: this.currentBatch
        });
    } catch (error) {
      console.error('Failed to save checkpoint:', error);
    }
  }

  private async clearCheckpoint(): Promise<void> {
    try {
      await adminDb
        .collection('processing_checkpoints')
        .doc(this.checkpointDocId)
        .delete();
      console.log('✅ Checkpoint cleared');
    } catch (error) {
      console.error('Failed to clear checkpoint:', error);
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): ProcessingStats {
    return this.stats;
  }

  getProgress(): string {
    const total = this.stats.totalEscorts;
    const processed = this.stats.processedEscorts + this.stats.failedEscorts;
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    
    return `📊 Progress: ${processed}/${total} escorts (${percentage}%) - ${this.stats.processedImages} images processed, ${this.stats.failedImages} failed`;
  }

  isRunning(): boolean {
    return this.isProcessing;
  }
}