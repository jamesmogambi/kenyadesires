// lib/firebase/storage.ts
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Try to get a preconfigured bucket from local './admin'. If that module
// doesn't exist (e.g. in some build environments), fall back to creating
// a bucket from the firebase-admin package.
let bucket: any;
try {
  // Use require to avoid static TS resolution errors when './admin' is missing.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const adminModule = require('./admin');
  bucket = adminModule.bucket;
} catch (e) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin');
  if (!admin.apps || admin.apps.length === 0) {
    try {
      admin.initializeApp();
    } catch (err) {
      // ignore if already initialized in some environments
    }
  }
  bucket = admin.storage().bucket();
}

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