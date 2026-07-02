import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { adminDb, COLLECTIONS, bucket } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: NextRequest) {
  try {
    const { escortId, imageUrl } = await request.json();

    // Validate API key for your internal endpoint
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!escortId || !imageUrl) {
      return NextResponse.json(
        { error: "Missing escortId or imageUrl" },
        { status: 400 },
      );
    }

    console.log(`[Dewatermark] Processing image for escort ${escortId}`);
    console.log(`[Dewatermark] Image URL: ${imageUrl.substring(0, 100)}...`);

    // 1. Download the image from Firebase
    console.log("[Dewatermark] Downloading image from Firebase...");
    let imageBuffer: Buffer;
    try {
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      imageBuffer = Buffer.from(imageResponse.data);
      console.log(`[Dewatermark] Downloaded ${imageBuffer.length} bytes`);
    } catch (downloadError: any) {
      console.error("[Dewatermark] Download failed:", downloadError.message);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to download image: ${downloadError.message}`,
        },
        { status: 500 },
      );
    }

    // 2. Prepare the request for DeWatermark API
    console.log("[Dewatermark] Sending to DeWatermark API...");

    const apiKeyDewatermark = process.env.DEWATERMARK_API_KEY;
    if (!apiKeyDewatermark) {
      throw new Error("DEWATERMARK_API_KEY is not configured");
    }

    const eraseUrl =
      "https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark";

    // Create FormData
    const formData = new FormData();

    // Add the image file
    formData.append("original_preview_image", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    // Add remove_text parameter
    formData.append("remove_text", "true");

    // Add predict_mode for better results
    formData.append("predict_mode", "3.0");

    // 3. Make the API request
    const startTime = Date.now();
    let dewatermarkResponse;

    try {
      dewatermarkResponse = await axios.post(eraseUrl, formData, {
        headers: {
          "X-API-KEY": apiKeyDewatermark,
          ...formData.getHeaders(),
        },
        timeout: 60000,
      });
    } catch (error: any) {
      console.error("[Dewatermark] API request failed:", error.message);

      if (error.response) {
        console.error("[Dewatermark] Response status:", error.response.status);
        console.error("[Dewatermark] Response data:", error.response.data);

        if (error.response.status === 402) {
          return NextResponse.json(
            {
              success: false,
              error:
                "Insufficient credits. Please check your DeWatermark plan.",
            },
            { status: 402 },
          );
        } else if (error.response.status === 401) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid API key. Please check your DeWatermark API key.",
            },
            { status: 401 },
          );
        }
      }

      throw error;
    }

    const duration = Date.now() - startTime;
    console.log(`[Dewatermark] API responded in ${duration}ms`);

    // 4. Parse the response
    const responseData = dewatermarkResponse.data;
    console.log("[Dewatermark] Response received");

    if (
      !responseData ||
      !responseData.edited_image ||
      !responseData.edited_image.image
    ) {
      console.error("[Dewatermark] Invalid response format:", responseData);
      throw new Error("Invalid response format from DeWatermark API");
    }

    const imageBase64 = responseData.edited_image.image;
    const sessionId = responseData.session_id;

    console.log(`[Dewatermark] Session ID: ${sessionId}`);
    console.log(`[Dewatermark] Image data length: ${imageBase64.length}`);

    // 5. Convert base64 to buffer
    const imageData = Buffer.from(imageBase64, "base64");
    console.log(`[Dewatermark] Decoded image size: ${imageData.length} bytes`);

    // 6. Save to Firebase Storage
    console.log("[Dewatermark] Saving cleaned image to Firebase Storage...");

    if (!bucket) {
      throw new Error("Firebase Storage bucket is not initialized.");
    }

    console.log(`[Dewatermark] Using bucket: ${bucket.name}`);

    // Clean the escortId to use as a folder name
    const sanitizedEscortId = escortId.replace(/[^a-zA-Z0-9-]/g, "_");
    const fileName = `cleaned_images/${sanitizedEscortId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    console.log(`[Dewatermark] File path: ${fileName}`);

    const file = bucket.file(fileName);

    // Save the image
    await file.save(imageData, {
      metadata: {
        contentType: "image/jpeg",
        metadata: {
          processedBy: "dewatermark",
          processedAt: new Date().toISOString(),
          escortId: escortId,
          cleanedBy: "dewatermark",
          sessionId: sessionId,
        },
      },
      public: true,
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    console.log(`[Dewatermark] Saved to Firebase: ${publicUrl}`);

    // 7. Update the escort's images metadata
    console.log("[Dewatermark] Updating escort metadata...");

    try {
      const escortDoc = await adminDb
        .collection(COLLECTIONS.ESCORTS)
        .doc(escortId)
        .get();

      if (escortDoc.exists) {
        const escortData = escortDoc.data();
        const imagesMetadata = escortData?.imagesMetadata || {};

        imagesMetadata[imageUrl] = {
          ...imagesMetadata[imageUrl],
          cleanedUrl: publicUrl,
          status: "completed",
          processedAt: new Date().toISOString(),
          cleanedBy: "dewatermark",
          sessionId: sessionId,
          duration: duration,
        };

        await adminDb
          .collection(COLLECTIONS.ESCORTS)
          .doc(escortId)
          .update({
            imagesMetadata: imagesMetadata,
            totalImagesProcessed: FieldValue.increment(1),
            lastProcessedAt: FieldValue.serverTimestamp(),
          });

        console.log("[Dewatermark] Escort metadata updated successfully");
      } else {
        console.warn(`[Dewatermark] Escort ${escortId} not found in Firestore`);
      }
    } catch (updateError: any) {
      console.error(
        "[Dewatermark] Failed to update escort metadata:",
        updateError.message,
      );
    }

    return NextResponse.json({
      success: true,
      cleanedUrl: publicUrl,
      sessionId: sessionId,
      duration: duration,
      message: "Watermark removed successfully using DeWatermark",
      escortId: escortId,
    });
  } catch (error: any) {
    console.error("[Dewatermark] Error:", error.message);

    if (error.response) {
      console.error("[Dewatermark] Response status:", error.response.status);
      console.error("[Dewatermark] Response data:", error.response.data);
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        details: error.response?.data || undefined,
      },
      { status: error.response?.status || 500 },
    );
  }
}
