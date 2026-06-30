// scripts/local-image-cleaner.js
const admin = require("firebase-admin");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, "../.env.development") });

// ============================================
// FIREBASE ADMIN INITIALIZATION
// ============================================
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

const STORAGE_BUCKET = "kenyadivas-ffc51.appspot.com";

let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
if (privateKey) {
  privateKey = privateKey.replace(/^"|"$/g, "");
  privateKey = privateKey.replace(/\\n/g, "\n");
}

const adminApp = !getApps().length
  ? initializeApp({
      credential: cert({
        projectId:
          process.env.FIREBASE_ADMIN_PROJECT_ID ||
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      storageBucket: STORAGE_BUCKET,
    })
  : getApps()[0];

const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);
const bucket = adminStorage.bucket();

console.log("✅ Firebase initialized");
console.log("----------------------------------------\n");

// ============================================
// HELPER FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImageWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios({
        method: "get",
        url: url,
        responseType: "arraybuffer",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.log(`  ⚠️ Download attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await sleep(2000 * (i + 1));
      } else {
        throw error;
      }
    }
  }
}

async function uploadToFirebaseWithRetry(
  buffer,
  escortId,
  fileName,
  maxRetries = 3,
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const filePath = `escorts/${escortId}/${fileName}`;
      const file = bucket.file(filePath);

      // Use streaming upload with smaller chunks for reliability
      const stream = file.createWriteStream({
        metadata: {
          contentType: "image/jpeg",
          metadata: {
            cleaned: "true",
            cleanedBy: "local-sharp",
            uploadedAt: new Date().toISOString(),
          },
        },
        resumable: true,
        timeout: 120000, // 2 minutes
      });

      return new Promise((resolve, reject) => {
        stream.on("error", reject);
        stream.on("finish", async () => {
          try {
            const [url] = await file.getSignedUrl({
              action: "read",
              expires: "03-01-2500",
            });
            resolve(url);
          } catch (error) {
            reject(error);
          }
        });
        stream.end(buffer);
      });
    } catch (error) {
      console.log(`  ⚠️ Upload attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        const delay = 3000 * (i + 1);
        console.log(`  ⏳ Retrying upload in ${delay / 1000} seconds...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}

// ============================================
// LOCAL IMAGE CLEANING WITH SHARP
// ============================================
async function cleanImageLocally(imageBuffer) {
  try {
    console.log("  🔄 Cleaning image locally with sharp...");

    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1200;

    // Strategy: Apply a gentle blur to areas where watermarks typically appear
    // This is a simple but effective approach for common watermark positions

    // 1. Create a blurred version of the entire image
    const blurredBuffer = await sharp(imageBuffer)
      .blur(8)
      .jpeg({ quality: 85 })
      .toBuffer();

    // 2. Create composite with blurred corners (common watermark locations)
    const cornerSize = Math.min(width, height) * 0.15;

    // Get blurred corner sections
    const corners = [
      { left: 0, top: 0 }, // Top-left
      { left: width - cornerSize, top: 0 }, // Top-right
      { left: 0, top: height - cornerSize }, // Bottom-left
      { left: width - cornerSize, top: height - cornerSize }, // Bottom-right
    ];

    const composites = [];
    for (const corner of corners) {
      try {
        const cornerBuffer = await sharp(blurredBuffer)
          .extract({
            left: Math.round(corner.left),
            top: Math.round(corner.top),
            width: Math.round(cornerSize),
            height: Math.round(cornerSize),
          })
          .toBuffer();

        composites.push({
          input: cornerBuffer,
          left: Math.round(corner.left),
          top: Math.round(corner.top),
        });
      } catch (e) {
        // Skip if extraction fails
      }
    }

    // 3. Also apply a subtle blur to the bottom bar (common for text)
    if (height > 100) {
      try {
        const bottomBarHeight = Math.min(height * 0.1, 80);
        const bottomBarBuffer = await sharp(blurredBuffer)
          .extract({
            left: 0,
            top: Math.round(height - bottomBarHeight),
            width: Math.round(width),
            height: Math.round(bottomBarHeight),
          })
          .toBuffer();

        composites.push({
          input: bottomBarBuffer,
          left: 0,
          top: Math.round(height - bottomBarHeight),
        });
      } catch (e) {
        // Skip if extraction fails
      }
    }

    // Apply composites
    let result = sharp(imageBuffer);
    if (composites.length > 0) {
      result = result.composite(composites);
    }

    // Final output with good quality
    const cleanedBuffer = await result
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    console.log("  ✅ Local cleaning successful");
    return cleanedBuffer;
  } catch (error) {
    console.error("  ❌ Local cleaning failed:", error.message);
    // If cleaning fails, return original image
    return imageBuffer;
  }
}

// ============================================
// PROCESS SINGLE ESCORT - WITH FALLBACKS
// ============================================
async function processEscortImages(escortId) {
  if (!escortId || escortId.trim() === "") {
    console.log(`⏭️ Skipping empty escort ID`);
    return { escortId: "(empty)", success: false, error: "Empty escort ID" };
  }

  const displayName = decodeURIComponent(escortId);
  console.log(`\n📸 Processing escort: ${displayName}`);
  const startTime = Date.now();

  try {
    const doc = await adminDb.collection("escorts").doc(escortId).get();
    if (!doc.exists) {
      console.log(`❌ Escort not found`);
      return { escortId, success: false, error: "Escort not found" };
    }

    const data = doc.data();
    const images = data.images || [];
    const previewPhoto = data.previewPhoto;

    console.log(`📊 Found ${images.length} images`);

    if (images.length === 0) {
      return { escortId, success: true, total: 0, processed: 0 };
    }

    const cleanedImages = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < images.length; i++) {
      try {
        const imageUrl = images[i];
        console.log(`  🖼️ Processing image ${i + 1}/${images.length}...`);

        // Download with retry
        const imageBuffer = await downloadImageWithRetry(imageUrl);

        // Clean locally
        const cleanedBuffer = await cleanImageLocally(imageBuffer);

        // Upload with retry
        const fileName = `cleaned_${uuidv4()}.jpg`;
        const uploadedUrl = await uploadToFirebaseWithRetry(
          cleanedBuffer,
          escortId,
          fileName,
        );

        cleanedImages.push(uploadedUrl);
        successful++;
        console.log(`  ✅ Image ${i + 1} cleaned successfully`);
      } catch (error) {
        console.error(`  ❌ Image ${i + 1} failed:`, error.message);
        failed++;
        // Keep original if cleaning fails
        try {
          const originalBuffer = await downloadImageWithRetry(images[i]);
          const fileName = `original_${uuidv4()}.jpg`;
          const url = await uploadToFirebaseWithRetry(
            originalBuffer,
            escortId,
            fileName,
          );
          cleanedImages.push(url);
        } catch (e) {
          cleanedImages.push(images[i]); // Keep original URL as last resort
        }
      }

      // Longer delay between images
      if (i < images.length - 1) {
        console.log("  ⏳ Waiting 5 seconds...");
        await sleep(5000);
      }
    }

    // Update Firestore
    const updateData = {
      images: cleanedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      imageCleaning: {
        completed: true,
        processedAt: new Date().toISOString(),
        total: images.length,
        successful: successful,
        failed: failed,
        method: "local-sharp",
        processingTime: Date.now() - startTime,
      },
    };

    if (previewPhoto && images.length > 0) {
      const previewIndex = images.indexOf(previewPhoto);
      if (previewIndex !== -1 && cleanedImages[previewIndex]) {
        updateData.previewPhoto = cleanedImages[previewIndex];
      }
    }

    await adminDb.collection("escorts").doc(escortId).update(updateData);
    console.log(`✅ Completed: ${successful} cleaned, ${failed} failed`);

    return {
      escortId,
      success: true,
      total: images.length,
      processed: successful,
      failed: failed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    return {
      escortId,
      success: false,
      error: error.message,
      processingTime: Date.now() - startTime,
    };
  }
}

// ============================================
// PROCESS ALL ESCORTS
// ============================================
async function processAllEscorts(options = {}) {
  const {
    batchSize = 1,
    delayBetweenBatches = 15000,
    testMode = false,
  } = options;

  console.log("\n🚀 Starting Local Image Cleaner...");
  console.log(`📋 Configuration:`);
  console.log(`  - Batch Size: ${batchSize}`);
  console.log(`  - Test Mode: ${testMode ? "ON" : "OFF"}`);
  console.log("----------------------------------------\n");

  try {
    let query = adminDb.collection("escorts").where("isActive", "==", true);

    const snapshot = await query.get();
    let escorts = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((e) => e.id && e.id.trim() !== "")
      .filter((e) => e.images && e.images.length > 0);

    console.log(`📊 Found ${escorts.length} escorts with images`);

    const results = {
      total: escorts.length,
      processed: 0,
      successful: 0,
      failed: 0,
      details: [],
      totalImages: 0,
      processedImages: 0,
      startTime: Date.now(),
    };

    for (let i = 0; i < escorts.length; i += batchSize) {
      const batch = escorts.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(escorts.length / batchSize);

      console.log(
        `\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} escorts)`,
      );
      console.log(
        `Progress: ${i}/${escorts.length} (${Math.round((i / escorts.length) * 100)}%)`,
      );

      const batchPromises = batch.map((escort) => {
        if (testMode) {
          console.log(`🧪 TEST: Would process ${escort.id}`);
          return Promise.resolve({
            escortId: escort.id,
            success: true,
            test: true,
            total: escort.images.length,
            processed: escort.images.length,
          });
        }
        return processEscortImages(escort.id);
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        results.details.push(result);
        if (result.success) {
          results.successful++;
          results.totalImages += result.total || 0;
          results.processedImages += result.processed || 0;
        } else {
          results.failed++;
        }
        results.processed++;
      }

      console.log(
        `\n📊 Progress: ${results.processed}/${escorts.length} escorts`,
      );
      console.log(
        `✅ Successful: ${results.successful}, ❌ Failed: ${results.failed}`,
      );
      console.log(
        `📸 Images: ${results.processedImages}/${results.totalImages}`,
      );

      if (i + batchSize < escorts.length) {
        console.log(`⏳ Waiting ${delayBetweenBatches / 1000} seconds...`);
        await sleep(delayBetweenBatches);
      }
    }

    results.endTime = Date.now();
    results.duration = (results.endTime - results.startTime) / 1000;
    results.successRate =
      results.total > 0
        ? Math.round((results.successful / results.total) * 100)
        : 0;

    return results;
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  }
}

// ============================================
// GENERATE REPORT
// ============================================
function generateReport(results) {
  const hours = Math.floor(results.duration / 3600);
  const minutes = Math.floor((results.duration % 3600) / 60);
  const seconds = Math.round(results.duration % 60);

  console.log("\n" + "=".repeat(60));
  console.log("📊 FINAL REPORT");
  console.log("=".repeat(60));
  console.log(`📌 Total Escorts: ${results.total}`);
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${results.successRate}%`);
  console.log(`📸 Total Images: ${results.totalImages}`);
  console.log(`✅ Images Cleaned: ${results.processedImages}`);
  console.log(`⏱️  Duration: ${hours}h ${minutes}m ${seconds}s`);
  console.log("=".repeat(60));

  const failedEscorts = results.details.filter((d) => !d.success);
  if (failedEscorts.length > 0) {
    console.log("\n❌ Failed Escorts:");
    failedEscorts.slice(0, 10).forEach((e) => {
      console.log(`  - ${e.escortId}: ${e.error || "Unknown error"}`);
    });
    if (failedEscorts.length > 10) {
      console.log(`  ... and ${failedEscorts.length - 10} more`);
    }
  }

  const reportPath = path.join(
    __dirname,
    `../local-cleaner-report-${Date.now()}.json`,
  );
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// ============================================
// MAIN EXECUTION
// ============================================
async function main() {
  try {
    const args = process.argv.slice(2);
    const testMode = args.includes("test");

    const config = {
      batchSize: 1,
      delayBetweenBatches: 15000,
      testMode: testMode,
    };

    console.log("🚀 Starting Local Image Cleaner (No Cloudinary)...");
    console.log(`📦 Test Mode: ${testMode ? "ON" : "OFF"}`);
    console.log("🔄 Using sharp for local image processing");
    console.log("🔄 Using Firebase Storage with retry logic");

    const results = await processAllEscorts(config);
    generateReport(results);

    console.log("\n🎉 Processing Complete!");
  } catch (error) {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });
s;
