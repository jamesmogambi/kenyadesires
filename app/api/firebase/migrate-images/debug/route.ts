import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/neon";

export async function DELETE(request: Request) {
  try {
    await executeQuery(`DELETE FROM processing_checkpoints WHERE id = 'cleaned_images_upload_checkpoint'`);
    console.log("🔄 Checkpoint reset");

    return NextResponse.json({ success: true, message: "Checkpoint reset" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
