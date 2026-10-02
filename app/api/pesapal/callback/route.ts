import { NextRequest, NextResponse } from "next/server";
import {
  getTransactionStatus,
  isPaymentCompleted,
  normalizePesapalStatus,
} from "@/lib/pesapal";
import { updateOrderStatus, getOrder } from "@/lib/pesapal-orders";
import { sendPaymentConfirmationEmail } from "@/server-actions/email";

/**
 * GET /api/pesapal/callback
 *
 * Pesapal redirects the customer's browser here (callback_url) after payment.
 * Returns a fresh, server-side-verified status of the payment.
 *
 * - Full-page flow (default): issues HTTP 302 redirect to /payment/success or /payment/failed
 * - Iframe flow (iframe=true): returns JSON { status, ... } for parent window postMessage
 *   and for the modal's status poller.
 *
 * The iframe response reports "pending" verbatim while the payment is still
 * being settled. Collapsing that into "failed" is what made phones sit on a
 * dead "Verifying payment" screen: the redirect back never completed, and the
 * single non-pending-or-failed answer was treated as a hard failure.
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
    const updateResult = await updateOrderStatus(orderTrackingId, status, orderMerchantReference, tx);

    const completed = isPaymentCompleted(tx.payment_status_description);

    // Send payment confirmation email on first completion
    if (completed && updateResult.updated && updateResult.previous !== "completed") {
      try {
        // Get billing details from stored order
        const storedOrder = await getOrder(orderTrackingId);
        await sendPaymentConfirmationEmail({
          to: storedOrder?.email || (tx.merchant_reference?.includes("@") ? tx.merchant_reference : ""),
          name: `${storedOrder?.email?.split("@")[0] || "Customer"}`,
          amount: Number(tx.amount) || 0,
          receiptNumber: tx.merchant_reference || "",
          packageName: tx.description || "Boost Package",
          transactionId: orderTrackingId,
          date: new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" }),
          phoneNumber: storedOrder?.phone_number || "N/A",
          paymentMethod: tx.payment_method || "Pesapal (M-Pesa / Airtel Money / Card)",
        });
      } catch (emailErr) {
        console.error("[Pesapal/callback] Failed to send confirmation email:", emailErr);
      }
    }

    // Only a real decline is terminal.
    //
    // Pesapal reports INVALID (status_code 0) for an order that was never
    // authorised — the customer closed the frame, or the M-Pesa STK push was
    // never completed. That is a "not paid *yet*" state, not a decline, and
    // lib/pesapal-orders.ts deliberately keeps `invalid` at the lowest upgrade
    // priority (STATUS_PRIORITY) precisely so a later COMPLETED IPN still
    // applies the package. Collapsing it into "failed" is what sent customers
    // to /payment/failed for payments that could still settle.
    const finalStatus = completed
      ? "completed"
      : status === "failed" || status === "reversed"
        ? "failed"
        : "pending";

    if (isIframe) {
      // Normalise the Pesapal status onto our own three-value vocabulary so
      // callers never have to guess: "pending" (keep waiting), "completed" or
      // "failed" (terminal).
      return NextResponse.json({
        status: finalStatus,
        orderTrackingId,
        merchantReference: tx.merchant_reference,
        paymentStatus: tx.payment_status_description,
      });
    }

    // The full-page flow has nowhere to park an unsettled order (the success
    // page asserts "Payment Successful"), so it still leaves for /payment/failed
    // — but with a code the page maps to safe copy instead of the raw upstream
    // token, which is what rendered a bare "INVALID" on screen.
    const reason = completed
      ? undefined
      : status === "failed"
        ? "declined"
        : status === "reversed"
          ? "reversed"
          : "unverified";

    return NextResponse.redirect(
      completed ? successTarget(tx.merchant_reference) : failedTarget(reason),
    );
  } catch (err: any) {
    console.error("[Pesapal/callback] error:", err?.message || err);

    // `err.message` is assembled by PesapalError.fromAxios and carries the
    // internal endpoint name, an HTTP status and raw upstream prose, e.g.
    // "GetTransactionStatus (HTTP 401): <Pesapal message>". That stays in the
    // server log; the browser only ever receives a fixed code, so no internals
    // leak into the address bar, Referer or history.
    if (isIframe) {
      return NextResponse.json(
        {
          error: "We could not reach Pesapal to verify this payment. Please try again.",
          status: "failed",
          orderTrackingId,
        },
        { status: 500 },
      );
    }

    return NextResponse.redirect(failedTarget("unverified"));
  }
}