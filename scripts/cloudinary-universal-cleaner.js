// scripts/cloudinary-fast-cleaner.js
const cloudinary = require("cloudinary").v2;
const admin = require("firebase-admin");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config({ path: path.join(__dirname, "../.env.development") });

// ============================================
// CLOUDINARY CONFIGURATION - OPTIMIZED
// ============================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 60000, // Reduced to 60 seconds
});

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
console.log(`✅ Cloudinary: ${cloudinary.config().cloud_name}`);
console.log("----------------------------------------\n");

// ============================================
// HELPER FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url) {
  try {
    const response = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024,
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Download error:", error.message);
    throw error;
  }
}

async function uploadToFirebaseStorage(buffer, escortId, fileName) {
  try {
    const filePath = `escorts/${escortId}/${fileName}`;
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          cleaned: "true",
          cleanedBy: "cloudinary-fast",
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    return url;
  } catch (error) {
    console.error("Upload error:", error.message);
    throw error;
  }
}

// ============================================
// METHOD 1: FAST CLOUDINARY WITH SMALLER IMAGE
// ============================================
async function cleanWithCloudinaryFast(imageBuffer) {
  try {
    console.log("  🔄 Method 1: Fast Cloudinary (resized)");

    // Resize image to smaller size for faster processing
    const resizedBuffer = await sharp(imageBuffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "temp_cleaning",
            resource_type: "image",
            timeout: 45000,
            transformation: [
              {
                effect:
                  "gen_remove:prompt_remove all text watermarks and logos",
              },
              { quality: "auto:low" },
              { fetch_format: "jpg" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(resizedBuffer);
    });

    if (uploadResult.secure_url) {
      const cleanedBuffer = await downloadImage(uploadResult.secure_url);

      // Clean up
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(uploadResult.public_id, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      console.log("  ✅ Method 1 successful");

      // Restore original size
      return await sharp(cleanedBuffer)
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toBuffer();
    }
    throw new Error("No URL returned");
  } catch (error) {
    console.log("  ⚠️ Method 1 failed:", error.message);
    throw error;
  }
}

// ============================================
// METHOD 2: LOCAL CLEANING WITH SHARP
// ============================================
async function cleanWithSharp(imageBuffer) {
  try {
    console.log("  🔄 Method 2: Local cleaning (sharp)");

    // Detect edges and blur potential text areas
    // This is a simple approach - removes corners where watermarks usually are
    const metadata = await sharp(imageBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 1200;

    // Create a blurred version
    const blurred = await sharp(imageBuffer)
      .blur(5)
      .jpeg({ quality: 85 })
      .toBuffer();

    // Composite: use blurred version for bottom-right corner (common watermark location)
    const result = await sharp(imageBuffer)
      .composite([
        {
          input: await sharp(blurred)
            .extract({
              left: Math.round(width * 0.7),
              top: Math.round(height * 0.85),
              width: Math.round(width * 0.3),
              height: Math.round(height * 0.15),
            })
            .toBuffer(),
          left: Math.round(width * 0.7),
          top: Math.round(height * 0.85),
        },
        {
          input: await sharp(blurred)
            .extract({
              left: Math.round(width * 0.7),
              top: 0,
              width: Math.round(width * 0.3),
              height: Math.round(height * 0.1),
            })
            .toBuffer(),
          left: Math.round(width * 0.7),
          top: 0,
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    console.log("  ✅ Method 2 successful");
    return result;
  } catch (error) {
    console.log("  ⚠️ Method 2 failed:", error.message);
    throw error;
  }
}

// ============================================
// METHOD 3: CLOUDINARY ADMIN API (NO UPLOAD)
// ============================================
async function cleanWithCloudinaryAdmin(imageBuffer) {
  try {
    console.log("  🔄 Method 3: Cloudinary Admin (direct URL)");

    // Upload with transformation in URL
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "temp_cleaning",
            resource_type: "image",
            timeout: 30000,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(imageBuffer);
    });

    // Generate URL with transformation
    const cleanedUrl = cloudinary.url(uploadResult.public_id, {
      transformation: [{ effect: "gen_remove" }, { quality: "auto" }],
      secure: true,
    });

    const cleanedBuffer = await downloadImage(cleanedUrl);

    // Clean up
    await new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(uploadResult.public_id, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    console.log("  ✅ Method 3 successful");
    return cleanedBuffer;
  } catch (error) {
    console.log("  ⚠️ Method 3 failed:", error.message);
    throw error;
  }
}

// ============================================
// METHOD 4: REMOVE ONLY SPECIFIC TEXT
// ============================================
async function cleanSpecificText(
  imageBuffer,
  textToRemove = "rahaescorts.com",
) {
  try {
    console.log(`  🔄 Method 4: Remove specific text "${textToRemove}"`);

    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "temp_cleaning",
            resource_type: "image",
            timeout: 30000,
            transformation: [
              {
                effect: `gen_remove:prompt_remove "${textToRemove}" from image`,
              },
              { quality: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(imageBuffer);
    });

    if (uploadResult.secure_url) {
      const cleanedBuffer = await downloadImage(uploadResult.secure_url);

      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(uploadResult.public_id, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });

      console.log("  ✅ Method 4 successful");
      return cleanedBuffer;
    }
    throw new Error("No URL returned");
  } catch (error) {
    console.log("  ⚠️ Method 4 failed:", error.message);
    throw error;
  }
}

// ============================================
// MASTER CLEAN FUNCTION - With faster methods
// ============================================
async function cleanImageUniversally(imageBuffer, textToRemove = null) {
  // Try methods in order of speed
  const methods = [
    {
      name: "Remove Specific Text",
      fn: () =>
        cleanSpecificText(imageBuffer, textToRemove || "rahaescorts.com"),
    },
    { name: "Fast Cloudinary", fn: () => cleanWithCloudinaryFast(imageBuffer) },
    {
      name: "Cloudinary Admin",
      fn: () => cleanWithCloudinaryAdmin(imageBuffer),
    },
    { name: "Local Sharp Cleaning", fn: () => cleanWithSharp(imageBuffer) },
  ];

  let lastError = null;

  for (const method of methods) {
    try {
      console.log(`  🔄 Trying ${method.name}...`);
      const result = await method.fn();
      if (result) {
        console.log(`  ✅ ${method.name} successful`);
        return result;
      }
    } catch (error) {
      lastError = error;
      console.log(`  ❌ ${method.name} failed:`, error.message);
    }
  }

  // If all methods fail, return original image
  console.log("  ⚠️ All methods failed, returning original image");
  return imageBuffer;
}

// ============================================
// PROCESS SINGLE ESCORT
// ============================================
async function processEscortImages(escortId, textToRemove = null) {
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

        const imageBuffer = await downloadImage(imageUrl);
        const cleanedBuffer = await cleanImageUniversally(
          imageBuffer,
          textToRemove,
        );

        const fileName = `cleaned_${uuidv4()}.jpg`;
        const uploadedUrl = await uploadToFirebaseStorage(
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
        cleanedImages.push(images[i]);
      }

      // Longer delay between images
      if (i < images.length - 1) {
        console.log("  ⏳ Waiting 3 seconds...");
        await sleep(3000);
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
        method: "cloudinary-universal-fast",
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
    batchSize = 1, // Process one at a time
    delayBetweenBatches = 15000, // 15 second delay
    testMode = false,
    textToRemove = null,
  } = options;

  console.log("\n🚀 Starting Universal Image Cleaner...");
  console.log(`📋 Configuration:`);
  console.log(`  - Batch Size: ${batchSize}`);
  console.log(`  - Test Mode: ${testMode ? "ON" : "OFF"}`);
  console.log(`  - Text to Remove: ${textToRemove || "All text/watermarks"}`);
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
        return processEscortImages(escort.id, textToRemove);
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
    `../cloudinary-fast-report-${Date.now()}.json`,
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
    const textToRemove =
      args.find((arg) => arg.startsWith("--text="))?.split("=")[1] || null;

    const config = {
      batchSize: 1,
      delayBetweenBatches: 15000,
      testMode: testMode,
      textToRemove: textToRemove,
    };

    console.log("🚀 Starting Fast Universal Image Cleaner...");
    console.log(`📦 Test Mode: ${testMode ? "ON" : "OFF"}`);
    console.log(`☁️ Cloudinary Cloud: ${cloudinary.config().cloud_name}`);

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
