import { NextRequest, NextResponse } from "next/server";
import {
  getTransactionStatus,
  isPaymentCompleted,
  normalizePesapalStatus,
  PesapalError,
} from "@/lib/pesapal";
import { updateOrderStatus } from "@/lib/pesapal-orders";

/**
 * GET /api/pesapal/callback
 *
 * Pesapal redirects the customer's browser here (callback_url) after payment.
 * Returns a fresh, server-side-verified status of the payment and redirects the
 * customer to /payment/success or /payment/failed.
 *
 * The redirect is issued as an HTTP 302 so it works even if JavaScript is
 * disabled. The loading page at /payment/callback forwards here.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const orderMerchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId) {
    return NextResponse.json(
      { error: "Missing OrderTrackingId" },
      { status: 400 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

  const successTarget = (ref?: string) =>
    `${appUrl}/payment/success?orderTrackingId=${encodeURIComponent(orderTrackingId)}${ref ? `&reference=${encodeURIComponent(ref)}` : ""}`;
  const failedTarget = (reason?: string) =>
    `${appUrl}/payment/failed?orderTrackingId=${encodeURIComponent(orderTrackingId)}${reason ? `&error=${encodeURIComponent(reason)}` : ""}`;

  try {
    // Verify the real payment status with Pesapal (do NOT trust the URL params).
    const tx = await getTransactionStatus(orderTrackingId);
    const status = normalizePesapalStatus(tx.payment_status_description);

    // Best-effort local update (idempotent) so the DB is in sync even if the
    // IPN is delayed.
    await updateOrderStatus(orderTrackingId, status, orderMerchantReference, tx);

    const completed = isPaymentCompleted(tx.payment_status_description);
    return NextResponse.redirect(
      completed ? successTarget(tx.merchant_reference) : failedTarget(status),
    );
  } catch (err: any) {
    console.error("[Pesapal/callback] error:", err?.message || err);
    // Verification failed — send them to the failed page with the reason.
    const detail =
      err instanceof PesapalError
        ? err.message
        : err?.message || "verification_failed";
    return NextResponse.redirect(failedTarget(detail));
  }
}
