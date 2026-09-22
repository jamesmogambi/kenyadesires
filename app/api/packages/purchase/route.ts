import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAdPackageById } from "@/lib/constants/packages";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: "Package ID is required" }, { status: 400 });
    }

    const adPackage = getAdPackageById(packageId);
    if (!adPackage) {
      return NextResponse.json({ error: "Invalid package" }, { status: 404 });
    }

    return NextResponse.json({ error: "Not available" }, { status: 503 });
  } catch (error: any) {
    console.error("Package purchase error:", error);
    return NextResponse.json(
      { error: "Failed to purchase package", detail: error.message },
      { status: 500 },
    );
  }
}
