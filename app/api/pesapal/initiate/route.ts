import { NextResponse } from "next/server";
import { connection } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { submitOrder, validatePesapalConfig, PesapalError, getAuthToken } from "@/lib/pesapal";
import { createOrder } from "@/lib/pesapal-orders";
import { PesapalSubmitOrderRequest } from "@/types/pesapal";
import { isValidPhoneNumber, formatPhoneNumber } from "@/lib/phone";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Pesapal `id` charset: alphanumeric + - _ . : (<=50 chars).
const REFERENCE_REGEX = /^[A-Za-z0-9\-_ .:]{1,50}$/;
// Kenyan mobile regex: Safaricom (07xx, 011x) and Airtel (073x, 078x)
const KENYAN_MOBILE_REGEX = /^(?:\+?254|0)(7\d{8}|1\d{8})$/;

function getCarrier(phone: string): "safaricom" | "airtel" | "unknown" {
  const digits = phone.replace(/\D/g, "");
  let national = "";
  if (digits.startsWith("254")) {
    national = "0" + digits.slice(3);
  } else if (digits.startsWith("0")) {
    national = digits;
  } else if (digits.length === 9 && (digits.startsWith("7") || digits.startsWith("1"))) {
    national = "0" + digits;
  }
  
  if (national.startsWith("07") || national.startsWith("011")) return "safaricom";
  if (national.startsWith("073") || national.startsWith("078")) return "airtel";
  return "unknown";
}

async function isAuthenticated(req: Request): Promise<{ userId: string } | null> {
  try {
    const { userId } = await auth();
    if (userId) return { userId };
  } catch {
    /* fall through to API-key check */
  }

  // For Request (not NextRequest), we need to get headers differently
  const headers = new Headers(req.headers);
  const provided = headers.get("x-api-key");
  const expected = process.env.INTERNAL_API_KEY;
  if (!provided || !expected) return null;

  // constant-time comparison
  let diff = 0;
  const a = provided;
  const b = expected;
  const len = Math.min(a.length, b.length);
  diff |= a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  if (diff === 0) {
    return { userId: "internal-api" };
  }
  return null;
}

export async function POST(req: Request) {
  await connection();

  try {
    const authResult = await isAuthenticated(req);
    if (!authResult) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const cfg = validatePesapalConfig();
    if (!cfg.valid) {
      return NextResponse.json({ error: cfg.error }, { status: 500 });
    }

    // Force a fresh token check early so we fail fast on mis-config before
    // accepting the request — the price of the order is settled below.
    await getAuthToken();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
      orderId,
      amount,
      email,
      phone,
      firstName,
      lastName,
      description,
      packageId,
      packageName,
      idType,
      flow,
    } = body as {
      orderId: string;
      amount: number | string;
      email: string;
      phone: string;
      firstName: string;
      lastName: string;
      description: string;
      packageId?: string;
      packageName?: string;
      idType?: string;
      flow?: string;
    };

    // How the customer is sent to Pesapal. This decides a top-level navigation,
    // so it is whitelisted and never passed through from the request body.
    //
    //   "inline"   -> PARENT_WINDOW: checkout renders in our own modal's iframe
    //                 (desktop). The frame is sized and styled by us.
    //   "redirect" -> TOP_WINDOW:   Pesapal's own hosted checkout page takes
    //                 over the browser (phones). No iframe, so no sandbox, no
    //                 focus trap and no pointer-events fighting — the form is
    //                 Pesapal's to lay out, and they already do it correctly at
    //                 phone widths.
    //
    // Defaulting to "inline" keeps the existing desktop behaviour for any caller
    // that has not been updated.
    const checkoutFlow: "inline" | "redirect" =
      flow === "redirect" ? "redirect" : "inline";

    // ---- Input validation ----
    const errors: string[] = [];
    if (!orderId || !REFERENCE_REGEX.test(String(orderId))) {
      errors.push("orderId must be 1-50 chars and contain only letters, numbers, -, _, ., or :");
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      errors.push("amount must be a number greater than 0");
    }
    if (!email || !EMAIL_REGEX.test(String(email))) {
      errors.push("A valid email address is required");
    }
    if (phone) {
      const phoneStr = String(phone);
      const normalized = phoneStr.replace(/\s+/g, "");
      
      // Validate Kenyan mobile format if provided
      if (normalized && !KENYAN_MOBILE_REGEX.test(normalized)) {
        errors.push("Invalid Kenyan phone number. Use format: 07XXXXXXXX, +2547XXXXXXXX, or 2547XXXXXXXX");
      } else if (normalized) {
        // Detect carrier for logging/debugging
        const carrier = getCarrier(phoneStr);
        console.log(`[Pesapal] Detected carrier: ${carrier} for phone: ${phoneStr}`);
        // TODO: Extend for Telkom (077x) / Equitel (076x) if needed
      }
    }
    if (!firstName || String(firstName).trim().length === 0) {
      errors.push("firstName is required");
    }
    if (!lastName || String(lastName).trim().length === 0) {
      errors.push("lastName is required");
    }
    if (!description || String(description).trim().length === 0) {
      errors.push("description is required");
    }
    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 },
      );
    }

    const baseAmount = numericAmount;

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
    if (!appUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_APP_URL is not configured" },
        { status: 500 },
      );
    }

    // ---- Build the Pesapal order payload ----
    const payload: PesapalSubmitOrderRequest = {
      id: String(orderId),
      currency: "KES",
      amount: baseAmount,
      description: String(description).slice(0, 100),
      callback_url: `${appUrl}/payment/callback`,
      redirect_mode: checkoutFlow === "redirect" ? "TOP_WINDOW" : "PARENT_WINDOW",
      notification_id: process.env.PESAPAL_IPN_ID!,
      billing_address: {
        email_address: String(email),
        country_code: "KE",
        first_name: String(firstName),
        last_name: String(lastName),
        ...(phone ? { phone_number: formatPhoneNumber(String(phone), { format: "e164" }) } : {}),
      },
    };

    const order = await submitOrder(payload);

    if (!order.order_tracking_id || !order.redirect_url) {
      throw new PesapalError(
        order.error?.message ||
          "Pesapal did not return an order_tracking_id / redirect_url",
        200,
        order.error?.code,
      );
    }

    // ---- Persist the order locally ----
    // TODO: Adapt `createOrder` in lib/pesapal-orders.ts to your exact schema.
    //       It currently inserts into the `pesapal_orders` MySQL table (see the
    //       CREATE TABLE in its header). Map columns/renames as your DB requires.
    const e164Phone = phone ? formatPhoneNumber(String(phone), { format: "e164" }) : undefined;
    await createOrder({
      orderTrackingId: order.order_tracking_id,
      merchantReference: String(orderId),
      userId,
      amount: baseAmount,
      currency: "KES",
      description: String(description),
      phoneNumber: e164Phone,
      email: String(email),
      packageId: packageId || null,
      packageName: packageName || null,
      idType: idType || null,
      metadata: {
        packageId: packageId ?? null,
        packageName: packageName ?? null,
        idType: idType ?? null,
        amount: baseAmount,
        currency: "KES",
      },
    });

    console.log(
      `[Pesapal] Order created: ${order.order_tracking_id} for user ${userId} (KES ${baseAmount})`,
    );

    return NextResponse.json(
      {
        success: true,
        order_tracking_id: order.order_tracking_id,
        redirect_url: order.redirect_url,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[Pesapal] initiate error:", err?.message || err);
    const status = err instanceof PesapalError ? err.status || 500 : 500;
    return NextResponse.json(
      {
        error: "Failed to initiate Pesapal payment",
        detail: err.message,
        code: err.code,
      },
      { status },
    );
  }
}
