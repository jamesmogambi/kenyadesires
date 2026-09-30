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

export async function POST(req: Request) {
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

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
    };

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
    if (!phone || !isValidPhoneNumber(String(phone))) {
      errors.push("A valid Kenyan phone number is required (e.g. +254712345678)");
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

    const e164Phone = formatPhoneNumber(String(phone), { format: "e164" });
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
      redirect_mode: "TOP_WINDOW",
      notification_id: process.env.PESAPAL_IPN_ID!,
      billing_address: {
        email_address: String(email),
        phone_number: e164Phone,
        country_code: "KE",
        first_name: String(firstName),
        last_name: String(lastName),
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
