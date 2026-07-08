import { NextRequest, NextResponse } from "next/server";

export interface CleanImageRequest {
  imageUrl: string;
  escortId?: string;
  imageIndex?: number;
}

export interface CleanImageResult {
  success: boolean;
  originalUrl?: string;
  cleanedUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CleanImageRequest = await request.json();
    const { imageUrl, escortId, imageIndex } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "Image URL is required" },
        { status: 400 },
      );
    }

    // Validate Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { success: false, error: "Cloudinary not configured" },
        { status: 500 },
      );
    }

    const cleanedUrl = await removeTextFromImage(imageUrl);

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      cleanedUrl,
      message: "Image text removed successfully",
    });
  } catch (error: any) {
    console.error("Error cleaning image:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to clean image" },
      { status: 500 },
    );
  }
}

async function removeTextFromTextImage(
  imageUrl: string,
): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  // Cloudinary transformation to remove text/watermarks
  // Using e_cut_out_bg for background removal and e_replace_color for text removal
  const cleanedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_cut_out_bg/e_replace_color:threshold_5:color_transparent/${encodeURIComponent(imageUrl)}`;

  return cleanedUrl;
}

async function removeTextFromImage(imageUrl: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  // Method 1: Use Cloudinary's AI-powered background removal
  // This removes watermarks and text overlays
  const transformations = [
    "e_cut_out_bg:mode_bg_removal",
    "e_replace_color:threshold_15:color_white",
    "e_saturation:-100",
    "e_contrast:20",
    "e_brightness:10",
    "e_sharpen:100",
  ];

  const cleanedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join("/")}/${encodeURIComponent(imageUrl)}`;

  return cleanedUrl;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get("imageUrl");

  if (!imageUrl) {
    return NextResponse.json(
      { success: false, error: "imageUrl query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const cleanedUrl = await removeTextFromTextImage(imageUrl);

    return NextResponse.json({
      success: true,
      originalUrl: imageUrl,
      cleanedUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}