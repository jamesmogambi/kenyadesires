// lib/firebase/storage.ts
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { bucket } from '../firebase-admin';

export interface UploadResult {
  url: string;
  path: string;
  metadata: Record<string, string>;
}

export async function uploadToFirebase(
  escortId: string,
  imageBuffer: Buffer,
  options?: {
    isPreview?: boolean;
    fileName?: string;
    metadata?: Record<string, string>;
  }
): Promise<UploadResult> {
  try {
    const optimizedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();

    const fileName = options?.fileName || `${uuidv4()}.jpg`;
    const filePath = `escorts/${escortId}/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(optimizedBuffer, {
      metadata: {
        contentType: 'image/jpeg',
        firebaseStorageDownloadTokens: uuidv4(),
        uploadedAt: new Date().toISOString(),
        isCleaned: 'true',
        cleanedBy: 'replicate',
        ...options?.metadata,
      },
    });

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '01-01-2124',
    });

    return {
      url,
      path: filePath,
      metadata: options?.metadata || {},
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : String(error)}`);
  }
}