export interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface STKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface STKCallbackResult {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{ Name: string; Value: string | number }>;
      };
    };
  };
}

const MPESA_BASE_URL = {
  sandbox: "https://sandbox.safaricom.co.ke",
  production: "https://api.safaricom.co.ke",
};

export function getMpesaBaseUrl(): string {
  const env = process.env.MPESA_ENV || "sandbox";
  return MPESA_BASE_URL[env as keyof typeof MPESA_BASE_URL] || MPESA_BASE_URL.sandbox;
}

export function getMpesaShortcode(): string {
  return process.env.MPESA_SHORTCODE || "174379";
}

export function getMpesaPasskey(): string {
  return process.env.MPESA_PASSKEY || "";
}

export function validateMpesaConfig(): { valid: boolean; error?: string } {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const missing: string[] = [];
  if (!consumerKey) missing.push("MPESA_CONSUMER_KEY");
  if (!consumerSecret) missing.push("MPESA_CONSUMER_SECRET");
  if (!shortcode) missing.push("MPESA_SHORTCODE");
  if (!passkey) missing.push("MPESA_PASSKEY");
  if (!siteUrl) missing.push("NEXT_PUBLIC_SITE_URL");

  if (missing.length > 0) {
    return {
      valid: false,
      error: `M-Pesa configuration incomplete. Missing: ${missing.join(", ")}`,
    };
  }

  return { valid: true };
}

export async function getMpesaAccessToken(): Promise<string> {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const url = `${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`M-Pesa auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  
  if (!data.access_token) {
    throw new Error("M-Pesa did not return an access token. Check your credentials.");
  }

  return data.access_token;
}

export function generatePassword(): string {
  const shortcode = getMpesaShortcode();
  const passkey = getMpesaPasskey();
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\.\d{3}Z$/, "");
  const raw = shortcode + passkey + timestamp;
  return Buffer.from(raw).toString("base64");
}

export function generateTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:T]/g, "")
    .replace(/\.\d{3}Z$/, "");
}

export async function initiateSTKPush(
  request: STKPushRequest,
): Promise<STKPushResponse> {
  const validation = validateMpesaConfig();
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const token = await getMpesaAccessToken();
  const shortcode = getMpesaShortcode();
  const password = generatePassword();
  const timestamp = generateTimestamp();

  if (!password || password.length === 0) {
    throw new Error("Failed to generate M-Pesa password. Check MPESA_PASSKEY.");
  }

  const payload = {
    BusinessShortCode: parseInt(shortcode),
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: request.amount,
    PartyA: formatPhoneNumber(request.phoneNumber),
    PartyB: shortcode,
    PhoneNumber: formatPhoneNumber(request.phoneNumber),
    CallbackURL: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mpesa/callback`,
    AccountReference: request.accountReference,
    TransactionDesc: request.transactionDesc,
  };

  const url = `${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`STK Push failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  
  if (data.ResponseCode && data.ResponseCode !== "0") {
    throw new Error(data.ResponseDescription || "M-Pesa rejected the request");
  }

  return data;
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
}

export function parseSTKCallback(data: STKCallbackResult) {
  const callback = data.Body.stkCallback;
  const metadata: Record<string, string | number> = {};

  if (callback.CallbackMetadata?.Item) {
    for (const item of callback.CallbackMetadata.Item) {
      metadata[item.Name] = item.Value;
    }
  }

  return {
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc,
    receiptNumber: metadata["MpesaReceiptNumber"] as string | undefined,
    amount: metadata["Amount"] as number | undefined,
    transactionDate: metadata["TransactionDate"] as number | undefined,
    phoneNumber: metadata["PhoneNumber"] as string | undefined,
  };
}
