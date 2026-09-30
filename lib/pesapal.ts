/**
 * Pesapal v3 (API 3.0 - JSON) client.
 *
 * Why a custom axios wrapper instead of the unofficial `pesapal-v3` npm package:
 *  1. `pesapal-v3` (mwondhaf/pesapal-v3) is an unmaintained community package
 *     with no automatic token caching/refrescing tied to `expiryDate`.
 *  2. This codebase already follows a "custom API client" pattern — see
 *     `lib/mpesa.ts`. Keeping one convention avoids mixing styles.
 *  3. axios gives us typed errors, timeouts, and a single place to centralise
 *     the 401 → refresh → retry logic required by this integration.
 *
 * Security:
 *  - CONSUMER_KEY / CONSUMER_SECRET are read from the server-only env and are
 *    NEVER logged or returned to the client.
 *  - The bearer token is cached in memory only (per-process) and discarded on
 *    expiry or when invalidated.
 *
 * Reference: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/
 */

import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  PesapalIPNResponse,
  PesapalSubmitOrderRequest,
  PesapalSubmitOrderResponse,
  PesapalTokenResponse,
  PesapalTransactionStatusResponse,
} from "@/types/pesapal";

export class PesapalError extends Error {
  public readonly status?: number;
  public readonly code?: string | number;
  public readonly payload?: unknown;

  constructor(
    message: string,
    status?: number,
    code?: string | number,
    payload?: unknown,
  ) {
    super(message);
    this.name = "PesapalError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }

  static fromAxios(err: unknown, context: string): PesapalError {
    if (err instanceof PesapalError) return err;

    const anyErr = err as {
      response?: { status?: number; data?: any };
      code?: string;
      message?: string;
      config?: { url?: string };
    };

    const status = anyErr?.response?.status;
    const data = anyErr?.response?.data;
    const pesapalMsg =
      data?.error?.message || data?.message || anyErr?.message || "Pesapal API error";
    const code = data?.error?.code;

    let detail = context;
    if (status) detail += ` (HTTP ${status})`;
    detail += `: ${pesapalMsg}`;

    return new PesapalError(detail, status, code, data);
  }
}

export const PESAPAL_BASE_URLS = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3/api",
  production: "https://pay.pesapal.com/v3/api",
} as const;

const TOKEN_TTL_FALLBACK_MS = 4 * 60 * 1000; // 4 min — tokens live ~5 min
const TOKEN_REFRESH_BUFFER_MS = 30_000; // refresh 30s before real expiry
const REQUEST_TIMEOUT_MS = 30_000;

export function getPesapalEnv(): "sandbox" | "production" {
  const env = (process.env.PESAPAL_ENV || "sandbox").trim().toLowerCase();
  if (env !== "sandbox" && env !== "production") {
    throw new PesapalError(
      `Invalid PESAPAL_ENV "${process.env.PESAPAL_ENV}". Expected "sandbox" or "production".`,
    );
  }
  return env;
}

export function getPesapalBaseUrl(): string {
  return PESAPAL_BASE_URLS[getPesapalEnv()];
}

export function validatePesapalConfig(): { valid: boolean; error?: string } {
  const missing: string[] = [];
  if (!process.env.PESAPAL_CONSUMER_KEY) missing.push("PESAPAL_CONSUMER_KEY");
  if (!process.env.PESAPAL_CONSUMER_SECRET) missing.push("PESAPAL_CONSUMER_SECRET");
  if (!process.env.PESAPAL_IPN_ID) missing.push("PESAPAL_IPN_ID");
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Pesapal configuration incomplete. Missing: ${missing.join(", ")}`,
    };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// In-memory bearer-token cache
// ---------------------------------------------------------------------------
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/** Discard the cached token so the next call re-authenticates. */
export function invalidateToken(): void {
  cachedToken = null;
  tokenExpiry = null;
}

/**
 * Returns a valid bearer token, fetching a new one only when the cache is
 * empty or expired. Tokens last ~5 minutes.
 */
export async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const data = await requestToken();

  cachedToken = data.token;
  let exp = 0;
  if (data.expiryDate) {
    const parsed = Date.parse(data.expiryDate);
    if (!Number.isNaN(parsed)) exp = parsed;
  }
  // Use the real expiry when sane, otherwise fall back to the 4-min default.
  tokenExpiry =
    exp && exp > now ? exp - TOKEN_REFRESH_BUFFER_MS : now + TOKEN_TTL_FALLBACK_MS;

  return cachedToken;
}

/** Exchange consumer key/secret for a Pesapal bearer token (no caching here). */
async function requestToken(): Promise<PesapalTokenResponse> {
  const key = process.env.PESAPAL_CONSUMER_KEY;
  const secret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!key || !secret) {
    throw new PesapalError(
      "Pesapal credentials are not configured (PESAPAL_CONSUMER_KEY / PESAPAL_CONSUMER_SECRET).",
      401,
    );
  }

  const base = getPesapalBaseUrl();
  const url = `${base}/Auth/RequestToken`;

  try {
    const res: AxiosResponse<PesapalTokenResponse> = await axios.post(
      url,
      { consumer_key: key, consumer_secret: secret },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    const data = res.data;
    if (!data.token) {
      throw new PesapalError(
        data.message || "Pesapal did not return a token. Check your credentials.",
        res.status,
        data.error?.code,
        data.error,
      );
    }
    return data;
  } catch (err) {
    throw PesapalError.fromAxios(err, "RequestToken");
  }
}

// ---------------------------------------------------------------------------
// Authenticated request helper (with 401 refresh + single retry)
// ---------------------------------------------------------------------------
async function pesapalRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  query?: Record<string, string | number>,
): Promise<T> {
  const base = getPesapalBaseUrl();
  const url = `${base}${path}`;

  const cfg = (token: string): AxiosRequestConfig => ({
    method,
    url,
    data: body,
    params: query,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const token = await getAuthToken();
  try {
    const res = await axios.request<T>(cfg(token));
    return res.data;
  } catch (err: any) {
    const is401 = err?.response?.status === 401;
    // Max 2 attempts: the original + exactly one refresh-retry.
    if (is401) {
      invalidateToken();
      const refreshed = await getAuthToken();
      try {
        const res2 = await axios.request<T>(cfg(refreshed));
        return res2.data;
      } catch (err2) {
        throw PesapalError.fromAxios(err2, path);
      }
    }
    throw PesapalError.fromAxios(err, path);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register an IPN URL with Pesapal. Returns the `ipn_id` to save in
 * `PESAPAL_IPN_ID`. Call this once; register your
 * `${NEXT_PUBLIC_APP_URL}/api/pesapal/ipn` endpoint.
 */
export async function registerIPN(
  url: string,
  notificationType: "GET" | "POST" = "GET",
): Promise<PesapalIPNResponse> {
  if (!url) {
    throw new PesapalError(
      "registerIPN requires a url (the IPN endpoint Pesapal should call).",
      400,
    );
  }

  return pesapalRequest<PesapalIPNResponse>("POST", "/URLSetup/RegisterIPN", {
    url,
    ipn_notification_type: notificationType,
  });
}

/**
 * Initiates a Pesapal payment order and returns the hosted redirect URL.
 */
export async function submitOrder(
  payload: PesapalSubmitOrderRequest,
): Promise<PesapalSubmitOrderResponse> {
  return pesapalRequest<PesapalSubmitOrderResponse>(
    "POST",
    "/Transactions/SubmitOrderRequest",
    payload,
  );
}

/**
 * Verifies a payment's final status by its Pesapal `orderTrackingId`.
 *
 * The IPN / callback payloads are never trusted on their own — Pesapal
 * itself states the callback carries no status and must be verified here.
 */
export async function getTransactionStatus(
  orderTrackingId: string,
): Promise<PesapalTransactionStatusResponse> {
  if (!orderTrackingId) {
    throw new PesapalError("getTransactionStatus requires an orderTrackingId", 400);
  }
  return pesapalRequest<PesapalTransactionStatusResponse>(
    "GET",
    "/Transactions/GetTransactionStatus",
    undefined,
    { orderTrackingId },
  );
}

/**
 * Normalises Pesapal's `payment_status_description` to our local status enum.
 * Comparison is case-insensitive to tolerate "Completed"/"COMPLETED".
 */
export function normalizePesapalStatus(
  description: string | undefined,
): "pending" | "completed" | "failed" | "reversed" | "invalid" {
  const d = (description || "").toLowerCase().trim();
  if (d.includes("complet")) return "completed";
  if (d.includes("invalid")) return "invalid";
  if (d.includes("reversed")) return "reversed";
  if (d.includes("failed")) return "failed";
  return "pending";
}

export function isPaymentCompleted(description: string | undefined): boolean {
  return normalizePesapalStatus(description) === "completed";
}
