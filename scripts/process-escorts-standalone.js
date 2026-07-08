// scripts/process-escorts-standalone.js
const path = require("path");
const fs = require("fs");

// Detect which env file to use
function loadEnvFile() {
  const envFiles = [".env.development", ".env.local", ".env"];

  for (const file of envFiles) {
    const filePath = path.join(__dirname, "../", file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Loading environment from: ${file}`);
      require("dotenv").config({ path: filePath });
      return true;
    }
  }

  console.error("❌ No environment file found!");
  return false;
}

// Load environment variables
if (!loadEnvFile()) {
  process.exit(1);
}

// Check required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "REPLICATE_API_TOKEN",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:");
  missingVars.forEach((varName) => console.error(`  - ${varName}`));
  console.log("\n💡 Check your .env.development file");
  process.exit(1);
}

console.log("✅ All required environment variables are set");

// Import dependencies - FIX: Use require for node-fetch
const admin = require("firebase-admin");
const Replicate = require("replicate");
const fetch = require("node-fetch"); // This is the fix for "fetch is not a function"
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

console.log("✅ All dependencies loaded");

// ============================================
// YOUR FIREBASE ADMIN INITIALIZATION
// ============================================
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

// IMPORTANT: Set the correct bucket name
const STORAGE_BUCKET = "kenyadivas-ffc51.appspot.com";

// Initialize Firebase Admin with environment variables
let adminApp;
try {
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, "");
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  console.log("🔧 Initializing Firebase with:");
  console.log(
    `  - Project ID: ${process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
  );
  console.log(`  - Client Email: ${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`);
  console.log(`  - Storage Bucket: ${STORAGE_BUCKET}`);
  console.log(`  - Private Key: ${privateKey ? "✅ Set" : "❌ Missing"}`);

  adminApp = !getApps().length
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

  console.log("✅ Firebase Admin initialized successfully");
  console.log(`📦 Storage Bucket: ${STORAGE_BUCKET}`);
} catch (error) {
  console.error("❌ Firebase Admin initialization failed:", error.message);
  process.exit(1);
}

const adminDb = getFirestore(adminApp);
const adminStorage = getStorage(adminApp);
const bucket = adminStorage.bucket();

// Verify bucket is accessible
try {
  console.log(`✅ Bucket accessible: ${bucket.name}`);
} catch (error) {
  console.error("❌ Bucket error:", error.message);
  process.exit(1);
}

// ============================================
// REPLICATE INITIALIZATION
// ============================================
let replicate;
try {
  replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });
  console.log("✅ Replicate initialized successfully");
} catch (error) {
  console.error("❌ Replicate initialization failed:", error.message);
  process.exit(1);
}

console.log("\n📦 Environment Check:");
console.log(
  "✅ FIREBASE_ADMIN_PROJECT_ID:",
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);
console.log(
  "✅ FIREBASE_ADMIN_CLIENT_EMAIL:",
  process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? "Set" : "Missing",
);
console.log(
  "✅ FIREBASE_ADMIN_PRIVATE_KEY:",
  process.env.FIREBASE_ADMIN_PRIVATE_KEY
    ? `Set (${process.env.FIREBASE_ADMIN_PRIVATE_KEY.length} chars)`
    : "Missing",
);
console.log(
  "✅ REPLICATE_API_TOKEN:",
  process.env.REPLICATE_API_TOKEN ? "Set" : "Missing",
);
console.log("✅ Storage Bucket:", STORAGE_BUCKET);
console.log("----------------------------------------\n");

// ============================================
// HELPER FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const buffer = await response.buffer();
    return buffer;
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
// PROCESS SINGLE ESCORT
// ============================================
async function processEscortImages(escortId) {
  // Skip empty escort IDs
  if (!escortId || escortId.trim() === "") {
    console.log(`⏭️ Skipping empty escort ID`);
    return {
      escortId: "(empty)",
      success: false,
      error: "Empty escort ID",
      total: 0,
      processed: 0,
    };
  }

  console.log(`\n📸 Processing escort: ${escortId}`);
  const startTime = Date.now();

  try {
    // Get escort document
    const doc = await adminDb.collection("escorts").doc(escortId).get();

    if (!doc.exists) {
      console.log(`❌ Escort ${escortId} not found`);
      return { escortId, success: false, error: "Escort not found" };
    }

    const data = doc.data();
    const images = data.images || [];
    const previewPhoto = data.previewPhoto;

    // Decode URL-encoded escort IDs for display
    let displayName = escortId;
    try {
      displayName = decodeURIComponent(escortId);
    } catch (e) {
      // If decoding fails, use original
    }
    console.log(`📊 Found ${images.length} images for escort ${displayName}`);

    if (images.length === 0) {
      console.log(`⏭️ No images to process for escort ${escortId}`);
      return {
        escortId,
        success: true,
        total: 0,
        processed: 0,
        message: "No images to process",
      };
    }

    const cleanedImages = [];
    let successful = 0;
    let failed = 0;

    // Process each image
    for (let i = 0; i < images.length; i++) {
      try {
        const imageUrl = images[i];
        console.log(`  🖼️ Processing image ${i + 1}/${images.length}...`);

        // Download image
        const imageBuffer = await downloadImage(imageUrl);

        // Convert to base64 for Replicate
        const base64 = imageBuffer.toString("base64");
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        console.log(`  🔄 Sending to Replicate...`);

        // Call Replicate API
        const output = await replicate.run("flux-kontext-apps/text-removal", {
          input: {
            input_image: dataUrl,
            aspect_ratio: "match_input_image",
            output_format: "png",
            safety_tolerance: 2,
            guidance_scale: 7.5,
            num_inference_steps: 30,
          },
        });

        // Extract cleaned URL
        let cleanedUrl;
        if (Array.isArray(output)) {
          cleanedUrl = output[0];
        } else if (typeof output === "string") {
          cleanedUrl = output;
        } else if (output && typeof output === "object" && output.url) {
          cleanedUrl = output.url;
        } else {
          throw new Error("Unexpected response format from Replicate");
        }

        console.log(`  ✅ Replicate returned cleaned image`);

        // Download cleaned image
        const cleanedBuffer = await downloadImage(cleanedUrl);

        // Upload to Firebase Storage
        const fileName = `cleaned_${uuidv4()}.jpg`;
        const uploadedUrl = await uploadToFirebaseStorage(
          cleanedBuffer,
          escortId,
          fileName,
        );

        cleanedImages.push(uploadedUrl);
        successful++;
        console.log(`  ✅ Image ${i + 1} processed successfully`);
      } catch (error) {
        console.error(`  ❌ Image ${i + 1} failed:`, error.message);
        failed++;
        // Keep original image if cleaning fails
        cleanedImages.push(images[i]);
      }

      // Small delay between images to avoid rate limits
      if (i < images.length - 1) {
        await sleep(500);
      }
    }

    // Update Firestore
    const updateData = {
      images: cleanedImages,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingStatus: {
        completed: true,
        processedAt: new Date().toISOString(),
        total: images.length,
        successful: successful,
        failed: failed,
        processingTime: Date.now() - startTime,
      },
    };

    // Update preview photo if it was cleaned
    if (previewPhoto && images.length > 0) {
      const previewIndex = images.indexOf(previewPhoto);
      if (previewIndex !== -1 && cleanedImages[previewIndex]) {
        updateData.previewPhoto = cleanedImages[previewIndex];
      }
    }

    await adminDb.collection("escorts").doc(escortId).update(updateData);

    console.log(
      `✅ Completed escort ${displayName}: ${successful} cleaned, ${failed} failed`,
    );

    return {
      escortId,
      success: true,
      total: images.length,
      processed: successful,
      failed: failed,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`❌ Error processing escort ${escortId}:`, error.message);
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
    batchSize = 3,
    delayBetweenBatches = 3000,
    filter = {},
    maxEscorts = Infinity,
    startFrom = 0,
    testMode = false,
  } = options;

  console.log("\n🚀 Starting Mass Processing...");
  console.log("📋 Configuration:");
  console.log(`  - Batch Size: ${batchSize}`);
  console.log(`  - Delay: ${delayBetweenBatches}ms`);
  console.log(
    `  - Max Escorts: ${maxEscorts === Infinity ? "All" : maxEscorts}`,
  );
  console.log(
    `  - Test Mode: ${testMode ? "✅ ON (will not update database)" : "❌ OFF"}`,
  );
  console.log("----------------------------------------\n");

  try {
    // Build query
    let query = adminDb.collection("escorts").where("isActive", "==", true);

    // Add filters
    if (filter.country) {
      query = query.where("country", "==", filter.country);
    }
    if (filter.regions) {
      query = query.where("regions", "array-contains", filter.regions);
    }

    // Get escorts
    const snapshot = await query.get();
    let escorts = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Filter out empty IDs
      .filter((e) => e.id && e.id.trim() !== "");

    // Filter out escorts without images
    escorts = escorts.filter((e) => e.images && e.images.length > 0);

    console.log(`📊 Found ${escorts.length} escorts with images`);

    // Apply limits
    if (startFrom > 0) {
      escorts = escorts.slice(startFrom);
    }
    if (maxEscorts < escorts.length) {
      escorts = escorts.slice(0, maxEscorts);
    }

    console.log(`🎯 Processing ${escorts.length} escorts\n`);

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

    // Process in batches
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

      // Process batch in parallel
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

      // Process results
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

      // Log progress
      console.log(
        `\n📊 Progress: ${results.processed}/${escorts.length} escorts processed`,
      );
      console.log(`✅ Successful: ${results.successful}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log(
        `📸 Images: ${results.processedImages}/${results.totalImages}`,
      );

      // Delay between batches (except last batch)
      if (i + batchSize < escorts.length) {
        console.log(
          `⏳ Waiting ${delayBetweenBatches / 1000} seconds before next batch...`,
        );
        await sleep(delayBetweenBatches);
      }
    }

    // Final results
    results.endTime = Date.now();
    results.duration = (results.endTime - results.startTime) / 1000;
    results.successRate = Math.round(
      (results.successful / results.total) * 100,
    );

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

  // Show failed escorts
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

  // Save report to file
  const reportPath = path.join(
    __dirname,
    `../processing-report-${Date.now()}.json`,
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
      batchSize: 3,
      delayBetweenBatches: 3000,
      maxEscorts: Infinity, // Process ALL escorts
      testMode: testMode,
      filter: {},
    };

    console.log("🚀 Starting script with config:", config);

    if (config.testMode) {
      console.log("\n⚠️  TEST MODE ENABLED - No database changes will be made");
      console.log('To process for real, remove "test" from command line\n');
    }

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
