import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neon";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const agencyResult: any[] = await executeQuery(
      `SELECT id FROM agencies WHERE id = $1 AND is_active = TRUE`,
      [id],
    );

    if (agencyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Agency not found" },
        { status: 404 },
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("gallery") as File[];

      if (!files || files.length === 0) {
        return NextResponse.json(
          { success: false, error: "No files provided" },
          { status: 400 },
        );
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { success: false, error: `Invalid file type: ${file.name}` },
            { status: 400 },
          );
        }
      }

      return NextResponse.json({
        success: false,
        error: "Image storage not available",
      }, { status: 503 });
    }

    const body = await request.json();
    const images = body.gallery || body.images || body.files || [];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: "No images provided" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: false,
      error: "Image storage not available",
    }, { status: 503 });
  } catch (error: any) {
    console.error("Error uploading gallery images:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const { indexes } = await request.json();

    if (!indexes || !Array.isArray(indexes) || indexes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No indexes provided" },
        { status: 400 },
      );
    }

    const agencyResult: any[] = await executeQuery(
      `SELECT gallery FROM agencies WHERE id = $1`,
      [id],
    );

    if (agencyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Agency not found" },
        { status: 404 },
      );
    }

    const currentGallery = Array.isArray(agencyResult[0]?.gallery) ? agencyResult[0].gallery : [];
    const validIndexes = indexes.filter((idx) => idx >= 0 && idx < currentGallery.length);
    const invalidIndexes = indexes.filter((idx) => idx < 0 || idx >= currentGallery.length);

    if (validIndexes.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid indexes provided", invalidIndexes },
        { status: 400 },
      );
    }

    const sortedIndexes = [...validIndexes].sort((a, b) => b - a);
    const newGallery = [...currentGallery];
    for (const idx of sortedIndexes) {
      newGallery.splice(idx, 1);
    }

    await executeQuery(
      `UPDATE agencies SET gallery = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newGallery), id],
    );

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: validIndexes.length,
        invalidIndexes,
        remainingImages: newGallery.length,
      },
      message: `Deleted ${validIndexes.length} images successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting gallery images by indexes:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const agencyResult: any[] = await executeQuery(
      `SELECT gallery FROM agencies WHERE id = $1`,
      [id],
    );

    if (agencyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Agency not found" },
        { status: 404 },
      );
    }

    const gallery = Array.isArray(agencyResult[0]?.gallery) ? agencyResult[0].gallery : [];
    const totalImages = gallery.length;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedGallery = gallery.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        images: paginatedGallery,
        total: totalImages,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalImages / limit),
          hasNext: endIndex < totalImages,
          hasPrev: startIndex > 0,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching agency gallery:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
