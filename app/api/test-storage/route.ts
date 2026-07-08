// app/api/test-storage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { bucket } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    // Test write permission
    const testFile = bucket.file("test-permissions.txt");
    await testFile.save("Testing permissions", {
      metadata: {
        contentType: "text/plain",
      },
      public: true,
    });

    // Clean up
    await testFile.delete();

    return NextResponse.json({
      success: true,
      message: "✅ Storage permissions are working correctly!",
      bucket: bucket.name,
    });
  } catch (error: any) {
    console.error("Storage test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.errors || error,
      },
      { status: 500 },
    );
  }
}
