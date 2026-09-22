import { NextRequest, NextResponse } from "next/server";
import AgencyService from "@/lib/services/agency.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const agencies = await AgencyService.getFeaturedAgencies(limit);

    return NextResponse.json({
      success: true,
      data: agencies,
    });
  } catch (error: any) {
    console.error("Error fetching featured agencies:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
