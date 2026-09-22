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
      `SELECT 1 FROM agencies WHERE id = $1`,
      [id],
    );

    if (agencyResult.length === 0) {
      return NextResponse.json(
        { success: false, error: "Agency not found" },
        { status: 404 },
      );
    }

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("gallery") as File[];

      if (files.length === 0) {
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

      return NextResponse.json(
        { success: false, error: "Image storage not available" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const images = body.gallery || body.images || body.files || [];

    return NextResponse.json(
      { success: false, error: "Image storage not available" },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Error uploading gallery images:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
