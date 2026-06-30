// lib/services/imageCleaner.ts
import { getReplicateClient, REPLICATE_MODELS, CLEANING_OPTIONS } from './replicate.service';
// Import firebase admin bucket dynamically to avoid build-time module resolution
// errors when the ../firebase/admin module or its types are not present.
let bucket: any = null;
try {
  // Use require to allow this file to compile even if the module is missing.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const adminModule = require('../firebase/admin');
  bucket = adminModule?.bucket ?? null;
} catch (e) {
  bucket = null;
}
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

export interface CleaningOptions {
  model?: 'text-removal' | 'magi-cleaner' | 'inpaint';
  outputFormat?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  maxSize?: number;
}

export interface CleaningResult {
  success: boolean;
  cleanedBuffer: Buffer;
  processingTime: number;
  method: string;
  error?: string;
  originalSize: number;
  cleanedSize: number;
}

export class ImageCleaner {
  private static instance: ImageCleaner;
  private constructor() {}

  public static getInstance(): ImageCleaner {
    if (!ImageCleaner.instance) {
      ImageCleaner.instance = new ImageCleaner();
    }
    return ImageCleaner.instance;
  }

  async cleanImage(imageBuffer: Buffer, options: CleaningOptions = {}): Promise<CleaningResult> {
    const startTime = Date.now();
    const originalSize = imageBuffer.length;

    try {
      await this.validateImage(imageBuffer);

      // Upload to temporary storage for Replicate
      const tempUrl = await this.uploadTempImage(imageBuffer);

      // Choose and execute cleaning method
      const model = options.model || 'text-removal';
      let cleanedUrl: string;

      switch (model) {
        case 'text-removal':
          cleanedUrl = await this.cleanWithTextRemoval(tempUrl);
          break;
        case 'magi-cleaner':
          cleanedUrl = await this.cleanWithMagiCleaner(tempUrl);
          break;
        case 'inpaint':
          cleanedUrl = await this.cleanWithInpainting(tempUrl);
          break;
        default:
          cleanedUrl = await this.cleanWithTextRemoval(tempUrl);
      }

      // Download cleaned image
      const cleanedBuffer = await this.downloadImage(cleanedUrl);
      
      // Post-process
      const finalBuffer = await this.postProcess(cleanedBuffer, options);

      // Clean up temporary files
      await this.cleanupTempImage(tempUrl);

      return {
        success: true,
        cleanedBuffer: finalBuffer,
        processingTime: Date.now() - startTime,
        method: model,
        originalSize,
        cleanedSize: finalBuffer.length,
      };

    } catch (error: unknown) {
      console.error('Image cleaning error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        cleanedBuffer: imageBuffer,
        processingTime: Date.now() - startTime,
        method: options.model || 'text-removal',
        error: errorMessage,
        originalSize,
        cleanedSize: imageBuffer.length,
      };
    }
  }

  private async cleanWithTextRemoval(imageUrl: string): Promise<string> {
    const replicate = getReplicateClient();
    
    const output = await replicate.run(
      REPLICATE_MODELS.TEXT_REMOVAL,
      {
        input: {
          input_image: imageUrl,
          ...CLEANING_OPTIONS.textRemoval,
        }
      }
    );

    return this.extractImageUrl(output);
  }

  private async cleanWithMagiCleaner(imageUrl: string): Promise<string> {
    const replicate = getReplicateClient();
    
    const output = await replicate.run(
      REPLICATE_MODELS.MAGI_CLEANER,
      {
        input: {
          image_path: imageUrl,
          ...CLEANING_OPTIONS.magiCleaner,
        }
      }
    );

    return this.extractImageUrl(output);
  }

  private async cleanWithInpainting(imageUrl: string): Promise<string> {
    const replicate = getReplicateClient();
    const maskUrl = await this.createGenericMask(imageUrl);
    
    const output = await replicate.run(
      REPLICATE_MODELS.STABLE_DIFFUSION_INPAINT,
      {
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: "Clean image, no text, no watermarks, no logos, no writing, no branding",
          negative_prompt: "text, watermark, logo, writing, words, brand, signature, copyright, subtitles, captions, labels",
          num_outputs: 1,
          ...CLEANING_OPTIONS.inpainting,
        }
      }
    );

    return this.extractImageUrl(output);
  }

  private extractImageUrl(output: any): string {
    if (Array.isArray(output)) {
      return output[0];
    }
    if (typeof output === 'object' && 'url' in output) {
      return output.url;
    }
    if (typeof output === 'string') {
      return output;
    }
    throw new Error('Unexpected response format from Replicate');
  }

  private async uploadTempImage(buffer: Buffer): Promise<string> {
    const fileName = `temp/${uuidv4()}.jpg`;
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        temporary: 'true',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 30 * 60 * 1000,
    });

    // Auto cleanup after 30 minutes
    setTimeout(async () => {
      try {
        await file.delete();
      } catch (e) {
        console.log('Temp file already deleted');
      }
    }, 30 * 60 * 1000);

    return url;
  }

  private async cleanupTempImage(url: string): Promise<void> {
    try {
      // Extract path from URL and delete
      const path = url.split('/o/')[1]?.split('?')[0];
      if (path) {
        const decodedPath = decodeURIComponent(path);
        const file = bucket.file(decodedPath);
        await file.delete();
      }
    } catch (error) {
      console.log('Failed to delete temp file:', error);
    }
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async createGenericMask(imageUrl: string): Promise<string> {
    const imageBuffer = await this.downloadImage(imageUrl);
    const metadata = await sharp(imageBuffer).metadata();
    
    const maskBuffer = await sharp({
      create: {
        width: metadata.width!,
        height: metadata.height!,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .png()
      .toBuffer();

    return this.uploadTempImage(maskBuffer);
  }

  private async validateImage(buffer: Buffer): Promise<void> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image dimensions');
      }

      if (metadata.width < 100 || metadata.height < 100) {
        throw new Error('Image too small (minimum 100x100)');
      }

      if (metadata.width > 4096 || metadata.height > 4096) {
        throw new Error('Image too large (maximum 4096x4096)');
      }

      if (buffer.length > 10 * 1024 * 1024) {
        throw new Error('File size exceeds 10MB limit');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Validation failed: ${message}`);
    }
  }

  private async postProcess(buffer: Buffer, options: CleaningOptions): Promise<Buffer> {
    let image = sharp(buffer);

    if (options.outputFormat === 'jpeg') {
      image = image.jpeg({ quality: options.quality || 90, progressive: true });
    } else if (options.outputFormat === 'webp') {
      image = image.webp({ quality: options.quality || 85 });
    } else if (options.outputFormat === 'png') {
      image = image.png({ compressionLevel: 9, adaptiveFiltering: true });
    }

    if (options.maxSize) {
      image = image.resize({
        width: options.maxSize,
        height: options.maxSize,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    return await image.toBuffer();
  }
}

export const imageCleaner = ImageCleaner.getInstance();