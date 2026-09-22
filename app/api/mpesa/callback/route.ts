import { NextResponse } from "next/server";
import { parseSTKCallback } from "@/lib/mpesa";
import { getCreditPackageById, getAdPackageById, PLAN_DETAILS } from "@/lib/constants/packages";
import { sendPaymentConfirmationEmail } from "@/server-actions/email";
import { incrementUserCredits } from "@/server-actions/payment.action";

function toNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  const parsed = parseFloat(String(value ?? ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let callback;
    try {
      callback = parseSTKCallback(body as any);
    } catch (parseError: any) {
      console.error("Callback parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid callback format", detail: parseError.message },
        { status: 400 },
      );
    }

    if (!callback.checkoutRequestId) {
      console.error("Callback missing checkoutRequestId:", callback);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      { error: "Callback processing failed", detail: error.message },
      { status: 500 },
    );
  }
}
