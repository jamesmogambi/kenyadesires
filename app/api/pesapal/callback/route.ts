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
 * Returns a fresh, server-side-verified status of the payment.
 *
 * - Full-page flow (default): issues HTTP 302 redirect to /payment/success or /payment/failed
 * - Iframe flow (iframe=true): returns JSON { status, ... } for parent window postMessage
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const orderMerchantReference = searchParams.get("OrderMerchantReference");
  const isIframe = searchParams.get("iframe") === "true";

  if (!orderTrackingId) {
    if (isIframe) {
      return NextResponse.json(
        { error: "Missing OrderTrackingId", status: "failed" },
        { status: 400 },
      );
    }
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

    if (isIframe) {
      return NextResponse.json({
        status: completed ? "completed" : "failed",
        orderTrackingId,
        merchantReference: tx.merchant_reference,
        paymentStatus: tx.payment_status_description,
      });
    }

    return NextResponse.redirect(
      completed ? successTarget(tx.merchant_reference) : failedTarget(status),
    );
  } catch (err: any) {
    console.error("[Pesapal/callback] error:", err?.message || err);
    const detail =
      err instanceof PesapalError
        ? err.message
        : err?.message || "verification_failed";

    if (isIframe) {
      return NextResponse.json(
        { error: detail, status: "failed", orderTrackingId },
        { status: 500 },
      );
    }

    return NextResponse.redirect(failedTarget(detail));
  }
}