import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    return NextResponse.json(
      { success: false, error: "Image storage not available" },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Error uploading gallery image:", error);
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

    return NextResponse.json(
      { success: false, error: "Image storage not available" },
      { status: 503 },
    );
  } catch (error: any) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
