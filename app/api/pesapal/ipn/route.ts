import { NextRequest, NextResponse } from "next/server";
import {
  getTransactionStatus,
  normalizePesapalStatus,
  PesapalError,
} from "@/lib/pesapal";
import { getOrder, safeEqual, updateOrderStatus } from "@/lib/pesapal-orders";

/**
 * GET|POST /api/pesapal/ipn
 *
 * Pesapal's Instant Payment Notification webhook. Pesapal calls this when a
 * payment status changes.
 *
 * Per Pesapal docs, the IPN (and the browser callback) do NOT carry the payment
 * status for security reasons. We therefore:
 *   1. Read the OrderTrackingId (from query on GET, from JSON body on POST).
 *   2. Call getTransactionStatus() to VERIFY the real status server-to-server.
 *   3. Update the local order idempotently.
 *   4. Respond with the exact shape Pesapal requires:
 *      { orderNotificationType, orderTrackingId, orderMerchantReference, status: 200 }
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  return handleIPN(
    searchParams.get("OrderTrackingId"),
    searchParams.get("OrderMerchantReference"),
    searchParams.get("OrderNotificationType"),
  );
}

export async function POST(req: NextRequest) {
  let body: {
    OrderTrackingId?: string;
    OrderMerchantReference?: string;
    OrderNotificationType?: string;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  return handleIPN(
    body.OrderTrackingId ?? null,
    body.OrderMerchantReference ?? null,
    body.OrderNotificationType ?? null,
  );
}

async function handleIPN(
  orderTrackingId: string | null,
  orderMerchantReference: string | null,
  orderNotificationType: string | null,
) {
  if (!orderTrackingId) {
    return NextResponse.json(
      { error: "Missing OrderTrackingId" },
      { status: 400 },
    );
  }

  try {
    // 1. Verify with Pesapal — never trust the IPN payload alone.
    const tx = await getTransactionStatus(orderTrackingId);
    const status = normalizePesapalStatus(tx.payment_status_description);

    // 2. Cross-check merchant_reference (constant-time) when we have a stored order.
    const existing = await getOrder(orderTrackingId);
    if (existing && !safeEqual(existing.merchant_reference, orderMerchantReference)) {
      console.warn(
        `[Pesapal/IPN] merchant_reference mismatch for ${orderTrackingId}: ` +
          `ipn="${orderMerchantReference}" db="${existing.merchant_reference}" — skipping update`,
      );
      // We still ack so Pesapal stops retrying, but we did not trust the payload.
    }

    // 3. Persist (idempotent — safe to call on every IPN).
    const result = await updateOrderStatus(
      orderTrackingId,
      status,
      orderMerchantReference || null,
      tx,
    );
    console.log(`[Pesapal/IPN] order ${orderTrackingId} → ${status} (prev=${result.previous})`);

    if (status === "completed") {
      // TODO: award credits / activate the escort/agency boost package here.
      //       e.g. await rewardCreditsForOrder(orderTrackingId);
      //       Keep this non-blocking / queued in production.
    }

    // 4. Exact acknowledgement shape required by Pesapal.
    return NextResponse.json(
      {
        orderNotificationType: orderNotificationType || "IPNCHANGE",
        orderTrackingId,
        orderMerchantReference: orderMerchantReference || "",
        status: 200,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[Pesapal/IPN] error:", err?.message || err);
    // A non-2xx response makes Pesapal retry the IPN.
    const status =
      err instanceof PesapalError ? err.status || 502 : 500;
    return NextResponse.json(
      { error: "IPN processing failed", detail: err.message },
      { status },
    );
  }
}
