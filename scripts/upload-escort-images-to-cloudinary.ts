// scripts/upload-escort-images-to-cloudinary.ts
//
// Uploads all escort images from Firestore to Cloudinary and updates
// the escort documents with the new Cloudinary URLs.
//
// Usage:
//   npm run upload-images                           # all escorts
//   npm run upload-images -- --dry-run              # preview without uploading
//   npm run upload-images -- --limit=50             # only first 50 escorts
//   npm run upload-images -- --start-after=abc123   # resume after doc ID "abc123"
//   npm run upload-images -- --escort-id=abc123      # single escort
//   npm run upload-images -- --collections=images,previewPhoto  # only update specific fields
//
// Image fields handled:
//   - images: string[]          (array of image URLs)
//   - previewPhoto: string      (single image URL)
//   - verificationDocuments.*   (object with idProof, idBack, selfieWithId, policeClearance)
//   - imagesMetadata[].cleanedUrl (cleaned/dewatermarked images from dewatermark API)
//
// Images already hosted on Cloudinary (res.cloudinary.com) are skipped.
// Upload results are tracked in imagesMetadata for resumability.

import { initializeApp, cert, getApps } from "firebase-admin/app";
import {
  getFirestore,
  type DocumentData,
  type Query,
} from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import { execFileSync } from "child_process";

dotenv.config({ path: ".env.development" });

// ── Initialize Firebase Admin ────────────────────────────────────────
const app = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY
          ? process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  : getApps()[0];

const adminDb = getFirestore(app);

// ── Config ───────────────────────────────────────────────────────────

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "";
const FOLDER = process.env.CLOUDINARY_ESCORT_FOLDER || "escorts";
const BATCH_SIZE = 5;
const IMAGE_DELAY_MS = 500;
const MAX_RETRIES = 3;
const CURL_TIMEOUT_MS = 120000;

const IS_CLOUDINARY_URL = (url: string): boolean =>
  url.includes("res.cloudinary.com") || url.includes("cloudinary.com");

// ── Types ────────────────────────────────────────────────────────────

interface EscortImages {
  previewPhoto?: string;
  images: string[];
  verificationDocuments?: {
    idProof?: string;
    idBack?: string;
    selfieWithId?: string;
    policeClearance?: string;
  };
  imagesMetadata?: Record<string, { status: string; cloudinaryUrl?: string; cleanedUrl?: string; error?: string }>;
}

interface Stats {
  totalEscorts: number;
  processedEscorts: number;
  totalImages: number;
  uploadedImages: number;
  failedImages: number;
  skippedImages: number;
  errors: Array<{ escortId: string; escortName?: string; error: string }>;
}

// ── Helpers ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uploadToCloudinary(
  imageUrl: string,
  escortId: string,
  index: number,
): Promise<{ url: string; publicId: string } | null> {
  if (IS_CLOUDINARY_URL(imageUrl)) {
    console.log(`    ⏭️ Already on Cloudinary: ${imageUrl.substring(0, 60)}...`);
    return null;
  }

  const publicId = `escort-${escortId.replace(/[^a-zA-Z0-9]/g, "")}-${index}`;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(
        `    ⬆️  Uploading [${attempt + 1}/${MAX_RETRIES}] image ${index + 1}...`,
      );

      const curlArgs: string[] = [
        "-s", "-S",
        "-w", "\n%{http_code}",
        "--max-time", String(CURL_TIMEOUT_MS / 1000),
        "-X", "POST",
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        "-F", `file=${imageUrl}`,
        "-F", `upload_preset=${CLOUDINARY_UPLOAD_PRESET}`,
        "-F", `public_id=${publicId}`,
        "-F", `folder=${FOLDER}`,
        "-F", `tags=escort,migrated,${escortId}`,
      ];

      const output = execFileSync("curl", curlArgs, {
        timeout: CURL_TIMEOUT_MS + 10000,
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      const httpCode = output.trim().split("\n").pop();
      const body = output.trim().split("\n").slice(0, -1).join("\n");

      if (httpCode !== "200") {
        let errMsg = `HTTP ${httpCode}`;
        try {
          const parsed = JSON.parse(body);
          if (parsed.error?.message) errMsg = parsed.error.message;
          if (parsed.error?.code) errMsg += ` (code: ${parsed.error.code})`;
        } catch {
          errMsg += `: ${body.substring(0, 200)}`;
        }
        throw new Error(errMsg);
      }

      const result = JSON.parse(body);
      if (result.secure_url) {
        console.log(
          `    ✅ Uploaded to ${result.secure_url.substring(0, 60)}...`,
        );
        return { url: result.secure_url, publicId: result.public_id };
      }

      throw new Error("No secure_url in response");
    } catch (err: any) {
      const msg = err.message || String(err);
      console.log(`    ⚠️  Attempt ${attempt + 1} failed: ${msg.substring(0, 120)}`);

      const isNetwork = msg.includes("timeout") || msg.includes("fetch failed");
      if (msg.includes("429") || msg.includes("rate limit")) {
        await sleep(5000 * (attempt + 1));
      } else if (isNetwork && attempt < MAX_RETRIES - 1) {
        await sleep(3000 * (attempt + 1));
      } else if (attempt < MAX_RETRIES - 1) {
        await sleep(2000 * (attempt + 1));
      }
    }
  }

  console.log(`    ❌ Failed after ${MAX_RETRIES} attempts`);
  return null;
}

function isImageURL(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (IS_CLOUDINARY_URL(url)) return false; // already done
  // Basic check: ends with image extension or is an image URL
  return (
    url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) !== null ||
  url.includes("media")
  );
}

function isURL(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return url.startsWith("http://") || url.startsWith("https://");
}

// ── Core logic ───────────────────────────────────────────────────────

async function processEscort(
  escortDoc: DocumentData,
  stats: Stats,
  dryRun: boolean,
  fieldsToUpdate: Set<string>,
): Promise<void> {
  const id = escortDoc.id;
  const data = escortDoc.data();
  const escortName = data.name || "Unknown";
  const startTime = Date.now();

  console.log(`\n📸 ${escortName} (${id})`);

  const images: EscortImages = {
    previewPhoto: data.previewPhoto,
    images: data.images || [],
    verificationDocuments: data.verificationDocuments,
    imagesMetadata: data.imagesMetadata || {},
  };

  // Collect all image URLs to upload
  const urlsToUpload: Array<{ field: string; url: string; index: number }> = [];
  const updates: Record<string, unknown> = {};
  let hasChanges = false;

  // 1. Process `images` array
  const updatedImages: string[] = [...(images.images || [])];

  for (let i = 0; i < (images.images || []).length; i++) {
    const url = images.images[i];
    if (!isURL(url)) {
      updatedImages[i] = url;
      continue;
    }

    if (IS_CLOUDINARY_URL(url)) {
      // Check if already migrated
      if (images.imagesMetadata?.[url]?.status === "completed") {
        stats.skippedImages++;
        continue;
      }
      updatedImages[i] = url;
      stats.skippedImages++;
      continue;
    }

    if (fieldsToUpdate.size === 0 || fieldsToUpdate.has("images")) {
      urlsToUpload.push({ field: "images", url, index: i });
    } else {
      updatedImages[i] = url;
    }
  }

  // 2. Process `previewPhoto`
  let updatedPreview = images.previewPhoto;
  if (images.previewPhoto && !IS_CLOUDINARY_URL(images.previewPhoto) && isURL(images.previewPhoto)) {
    if (fieldsToUpdate.size === 0 || fieldsToUpdate.has("previewPhoto")) {
      urlsToUpload.push({ field: "previewPhoto", url: images.previewPhoto, index: 0 });
    }
  } else if (images.previewPhoto && IS_CLOUDINARY_URL(images.previewPhoto)) {
    stats.skippedImages++;
  }

  // 3. Process verification documents
  const updatedDocs: Record<string, string | undefined> = {};
  const docFields = ["idProof", "idBack", "selfieWithId", "policeClearance"];
  for (const field of docFields) {
    if (images.verificationDocuments && images.verificationDocuments[field as keyof typeof images.verificationDocuments]) {
      const docUrl = images.verificationDocuments[field as keyof typeof images.verificationDocuments] as string;
      if (IS_CLOUDINARY_URL(docUrl)) {
        updatedDocs[field] = docUrl;
        stats.skippedImages++;
      } else if (isURL(docUrl) && (fieldsToUpdate.size === 0 || fieldsToUpdate.has("verificationDocuments"))) {
        urlsToUpload.push({ field: `verificationDocuments.${field}`, url: docUrl, index: 0 });
      } else {
        updatedDocs[field] = docUrl;
      }
    }
  }

  // 4. Process cleaned images from imagesMetadata
  const cleanedUrlsToUpload: Array<{ originalUrl: string; cleanedUrl: string; index: number }> = [];
  let cleanedIndex = 0;
  for (const [originalUrl, meta] of Object.entries(images.imagesMetadata || {})) {
    const cleanedUrl = (meta as any).cleanedUrl;
    if (cleanedUrl && isURL(cleanedUrl) && !IS_CLOUDINARY_URL(cleanedUrl)) {
      if (fieldsToUpdate.size === 0 || fieldsToUpdate.has("cleanedImages")) {
        cleanedUrlsToUpload.push({ originalUrl, cleanedUrl, index: cleanedIndex++ });
      }
    } else if (cleanedUrl && IS_CLOUDINARY_URL(cleanedUrl)) {
      stats.skippedImages++;
    }
  }

  stats.totalImages += cleanedUrlsToUpload.length;

  if (dryRun) {
    console.log(`  📋 DRY RUN: Would upload ${urlsToUpload.length} images + ${cleanedUrlsToUpload.length} cleaned images`);
    return;
  }

  // Upload images
  const newImageURLs: Record<string, string> = {};
  for (const { field, url, index } of urlsToUpload) {
    const escortIdx = stats.processedEscorts;
    const result = await uploadToCloudinary(url, id, escortIdx * 10 + index);
    if (result) {
      newImageURLs[`${field}::${index}`] = result.url;
      images.imagesMetadata = images.imagesMetadata || {};
      images.imagesMetadata[url] = {
        status: "completed",
        cloudinaryUrl: result.url,
      };
      stats.uploadedImages++;
    } else {
      images.imagesMetadata = images.imagesMetadata || {};
      images.imagesMetadata[url] = { status: "failed", error: "Upload failed after retries" };
      stats.failedImages++;
    }

    // Rate limiting
    await sleep(IMAGE_DELAY_MS);
  }

  // Upload cleaned images
  for (const { originalUrl, cleanedUrl, index } of cleanedUrlsToUpload) {
    const escortIdx = stats.processedEscorts;
    const result = await uploadToCloudinary(cleanedUrl, id, escortIdx * 10 + 100 + index);
    if (result) {
      images.imagesMetadata = images.imagesMetadata || {};
      images.imagesMetadata[originalUrl] = {
        ...images.imagesMetadata[originalUrl],
        cleanedUrl: result.url,
        status: "completed",
      };
      hasChanges = true;
      stats.uploadedImages++;
    } else {
      images.imagesMetadata = images.imagesMetadata || {};
      images.imagesMetadata[originalUrl] = {
        ...images.imagesMetadata[originalUrl],
        status: "failed",
        error: "Cleaned image upload failed after retries",
      };
      hasChanges = true;
      stats.failedImages++;
    }

    // Rate limiting
    await sleep(IMAGE_DELAY_MS);
  }

  // Apply URL updates
  for (const [key, newUrl] of Object.entries(newImageURLs)) {
    const [field, idx] = key.split("::");
    const index = parseInt(idx, 10);

    if (field === "images") {
      updatedImages[index] = newUrl;
      hasChanges = true;
    } else if (field === "previewPhoto") {
      updatedPreview = newUrl;
      hasChanges = true;
    } else if (field.startsWith("verificationDocuments.")) {
      const docField = field.split(".")[1];
      updatedDocs[docField] = newUrl;
      hasChanges = true;
    }
  }

  // Write updates to Firestore
  if (hasChanges) {
    const updateData: Record<string, unknown> = {};

    const imagesChanged =
      updatedImages.length !== images.images.length ||
      updatedImages.some((url, i) => url !== images.images[i]);

    if (imagesChanged) {
      updateData.images = updatedImages;
    }
    if (updatedPreview !== images.previewPhoto) {
      updateData.previewPhoto = updatedPreview;
    }
    if (Object.keys(updatedDocs).length > 0) {
      updateData.verificationDocuments = {
        ...images.verificationDocuments,
        ...updatedDocs,
      };
    }
    updateData.imagesMetadata = images.imagesMetadata;

    await adminDb.collection("escorts").doc(id).update(updateData);
    console.log(`  💾 Updated Firestore (${Object.keys(updateData).length} fields)`);
  } else {
    console.log(`  ℹ️  No changes needed`);
  }

  stats.processedEscorts++;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`  ⏱️  Done in ${elapsed}s`);
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const rawArgs = process.argv.slice(2);
  const dryRun = rawArgs.includes("--dry-run");
  const limitArg = rawArgs.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const startAfterArg = rawArgs.find((a) => a.startsWith("--start-after="));
  const startAfter = startAfterArg
    ? startAfterArg.split("=")[1]
    : null;
  const escortIdArg = rawArgs.find((a) => a.startsWith("--escort-id="));
  const escortId = escortIdArg ? escortIdArg.split("=")[1] : null;
  const colsArg = rawArgs.find((a) => a.startsWith("--collections="));
  const fieldsToUpdate = colsArg
    ? new Set(colsArg.split("=")[1].split(","))
    : new Set<string>();

  if (!CLOUD_NAME) {
    console.error("❌ CLOUDINARY_CLOUD_NAME is not set in environment.");
    process.exit(1);
  }

  if (!CLOUDINARY_UPLOAD_PRESET) {
    console.error("❌ CLOUDINARY_UPLOAD_PRESET is not set in environment.");
    process.exit(1);
  }

  console.log("=".repeat(70));
  console.log(`[Cloudinary Upload] ${dryRun ? "DRY RUN" : "LIVE UPLOAD"}`);
  console.log(`Cloud: ${CLOUD_NAME} | Folder: ${FOLDER} | Preset: ${CLOUDINARY_UPLOAD_PRESET}`);
  console.log("=".repeat(70));

  const stats: Stats = {
    totalEscorts: 0,
    processedEscorts: 0,
    totalImages: 0,
    uploadedImages: 0,
    failedImages: 0,
    skippedImages: 0,
    errors: [],
  };

  // Build Firestore query
  let query: Query = adminDb.collection("escorts");

  if (escortId) {
    // Single escort mode
    const escortDoc = await adminDb.collection("escorts").doc(escortId).get();
    if (!escortDoc.exists) {
      console.error(`❌ Escort not found: ${escortId}`);
      process.exit(1);
    }
    stats.totalEscorts = 1;
    console.log(`\n${escortId ? "🎯 Single escort mode" : ""}`);

    try {
      await processEscort(escortDoc, stats, dryRun, fieldsToUpdate);
    } catch (err: any) {
      stats.errors.push({ escortId, escortName: escortDoc.get("name"), error: err.message });
      console.error(`❌ Error: ${err.message}`);
    }
  } else {
    // List mode
    const snapshot = await query
      .select("name", "previewPhoto", "images", "verificationDocuments", "imagesMetadata")
      .get();
    stats.totalEscorts = snapshot.size;
    console.log(`\n🔍 Found ${snapshot.size} escorts in Firestore`);

    let escortDocs = snapshot.docs;

    // Apply start-after filter
    if (startAfter) {
      const startIdx = escortDocs.findIndex((d) => d.id === startAfter);
      if (startIdx === -1) {
        console.log(`⚠️  Start-after ID "${startAfter}" not found. Processing from beginning.`);
      } else {
        escortDocs = escortDocs.slice(startIdx + 1);
        console.log(`⏭️  Resuming after "${startAfter}" — ${escortDocs.length} remaining`);
      }
    }

    // Apply limit
    if (limit !== Infinity) {
      escortDocs = escortDocs.slice(0, limit);
      console.log(`📏 Limited to ${limit} escorts`);
    }

    console.log(`\n📊 Processing ${escortDocs.length} escorts in batches of ${BATCH_SIZE}\n`);

    // Process in batches
    for (let i = 0; i < escortDocs.length; i += BATCH_SIZE) {
      const batch = escortDocs.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(escortDocs.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

      for (const doc of batch) {
        try {
          await processEscort(doc, stats, dryRun, fieldsToUpdate);
        } catch (err: any) {
          stats.errors.push({ escortId: doc.id, escortName: doc.get("name"), error: err.message });
          console.error(`  ❌ Error: ${err.message}`);
        }
      }

      if (i + BATCH_SIZE < escortDocs.length && !dryRun) {
        console.log(`\n⏳ Waiting ${IMAGE_DELAY_MS * 3}ms between batches...`);
        await sleep(IMAGE_DELAY_MS * 3);
      }
    }
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("[Cloudinary Upload] Summary");
  console.log("=".repeat(70));
  console.log(`  Escorts found:     ${stats.totalEscorts}`);
  console.log(`  Escorts updated:   ${stats.processedEscorts}`);
  console.log(`  Total images:      ${stats.totalImages}`);
  console.log(`  Uploaded:          ${stats.uploadedImages}`);
  console.log(`  Failed:            ${stats.failedImages}`);
  console.log(`  Skipped (existing):${stats.skippedImages}`);
  console.log(`  Errors:            ${stats.errors.length}`);

  if (stats.errors.length > 0) {
    console.log("\n  Error details:");
    stats.errors.forEach((e) =>
      console.log(`    - ${e.escortId}: ${e.error}`),
    );
  }
  console.log("=".repeat(70));

  if (stats.errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[Cloudinary Upload] Fatal:", err);
  process.exit(1);
});
