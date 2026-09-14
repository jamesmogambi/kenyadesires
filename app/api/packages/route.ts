import { NextResponse } from "next/server";
import { CREDIT_PACKAGES, AD_PACKAGES } from "@/lib/constants/packages";


export async function GET() {
  return NextResponse.json({
    creditPackages: CREDIT_PACKAGES,
    adPackages: AD_PACKAGES,
  });
}
