import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error) {
    console.error(`Failed to fetch escort:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch escort",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let id: string | undefined;

  try {
    const paramsResult = await params;
    id = paramsResult.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID is required" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error) {
    console.error(`Failed to delete escort ${id ?? "unknown"}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete escort",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
