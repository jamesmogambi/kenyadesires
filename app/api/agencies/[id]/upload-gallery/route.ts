import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neon";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id: agencyId } = await params;

    const agencyResult: any[] = await executeQuery(
      `SELECT id FROM agencies WHERE id = $1`,
      [agencyId],
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
