import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const { escortId, imageUrl } = await request.json();

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

    console.log("[Dewatermark] Sending to DeWatermark API...");

    const apiKeyDewatermark = process.env.DEWATERMARK_API_KEY;
    if (!apiKeyDewatermark) {
      throw new Error("DEWATERMARK_API_KEY is not configured");
    }

    const eraseUrl =
      "https://platform.dewatermark.ai/api/object_removal/v2/erase_watermark";

    const formData = new FormData();
    formData.append("original_preview_image", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });
    formData.append("remove_text", "true");
    formData.append("predict_mode", "3.0");

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

    const imageData = Buffer.from(imageBase64, "base64");
    console.log(`[Dewatermark] Decoded image size: ${imageData.length} bytes`);

    return NextResponse.json({ error: "Not available" }, { status: 503 });
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
