/**
 * Shared utilities for the Provider Acquisition Campaign 01.
 * Pure functions — no side effects, easy to test.
 */

export const CAMPAIGN_NAME = "Provider Acquisition 01";
export const APP_NAME = "KenyaDesires";

export const CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Malindi",
  "Naivasha",
  "Other",
] as const;

export const COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Uasin Gishu",
  "Kiambu",
  "Kilifi",
  "Naivasha (Nakuru)",
  "Other",
] as const;

/**
 * Tier mapping based on city.
 * Tier 1 = Nairobi, Mombasa
 * Tier 2 = Kisumu, Nakuru, Eldoret
 * Tier 3 = Thika, Malindi, Naivasha, Other
 */
export function getTier(city?: string | null): "Tier 1" | "Tier 2" | "Tier 3" {
  if (!city) return "Tier 3";
  const c = city.trim();
  if (c === "Nairobi" || c === "Mombasa") return "Tier 1";
  if (c === "Kisumu" || c === "Nakuru" || c === "Eldoret") return "Tier 2";
  return "Tier 3";
}

/**
 * Derive lead source from UTM source.
 */
export function deriveLeadSource(utmSource?: string | null): string {
  switch ((utmSource || "").trim().toLowerCase()) {
    case "trafficstars":
      return `${APP_NAME} — TrafficStars`;
    case "exoclick":
      return `${APP_NAME} — ExoClick`;
    case "whatsapp":
      return `${APP_NAME} — WhatsApp`;
    case "email":
      return `${APP_NAME} — Email`;
    case "referral":
      return `${APP_NAME} — Referral`;
    case "google":
      return `${APP_NAME} — Organic`;
    case "social":
      return `${APP_NAME} — Social`;
    case "partner":
      return `${APP_NAME} — Partnership`;
    case "database":
      return `${APP_NAME} — Database`;
    default:
      return `${APP_NAME} — Direct`;
  }
}

/**
 * Build the structured Description string for Zoho Leads/Contacts.
 * This is the canonical data container (Free Edition — no custom fields).
 */
export function buildDescription(opts: {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  click_id?: string | null;
  referral_code?: string | null;
  ga_client_id?: string | null;
  consent_whatsapp: boolean;
  consent_email: boolean;
  consent_date?: string | null;
  age_confirmed: boolean;
  landing_url?: string | null;
  tier: string;
  extra?: string; // appended segments (e.g. REFERRAL_CODE_OWN, PROFILE_COMPLETE_DATE)
}): string {
  const boolStr = (v: boolean) => (v ? "TRUE" : "FALSE");
  const parts = [
    `APP: ${APP_NAME}`,
    `CAMPAIGN: ${CAMPAIGN_NAME}`,
    `UTM_SOURCE: ${opts.utm_source || ""}`,
    `UTM_MEDIUM: ${opts.utm_medium || ""}`,
    `UTM_CAMPAIGN: ${opts.utm_campaign || ""}`,
    `CLICK_ID: ${opts.click_id || ""}`,
    `REFERRAL_CODE: ${opts.referral_code || ""}`,
    `GA4_CLIENT_ID: ${opts.ga_client_id || ""}`,
    `CONSENT_WHATSAPP: ${boolStr(opts.consent_whatsapp)}`,
    `CONSENT_EMAIL: ${boolStr(opts.consent_email)}`,
    `CONSENT_DATE: ${opts.consent_date || ""}`,
    `CONSENT_SOURCE: Website Form`,
    `AGE_CONFIRMED: ${boolStr(opts.age_confirmed)}`,
    `LANDING_URL: ${opts.landing_url || ""}`,
    `TIER: ${opts.tier}`,
  ];

  if (opts.extra) {
    parts.push(opts.extra.trim());
  }

  return parts.join(" | ");
}

/**
 * Parse a structured Description string back into key/value pairs.
 * Useful when reading back from Zoho after conversion.
 */
export function parseDescription(description?: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!description) return result;
  for (const segment of description.split("|")) {
    const idx = segment.indexOf(":");
    if (idx === -1) continue;
    const key = segment.slice(0, idx).trim();
    const value = segment.slice(idx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Extract GA4 client ID from the _ga cookie.
 * Format: GA.1.2.1234567890.9876543210 -> client ID = "1234567890.9876543210"
 * (last two segments after the last dot).
 */
export function extractGaClientId(gaCookie?: string | null): string | null {
  if (!gaCookie) return null;
  const parts = gaCookie.split(".");
  if (parts.length < 3) return null;
  // The client ID is the last two segments joined by a dot.
  return parts.slice(-2).join(".");
}

/**
 * Generate a 6-character alphanumeric referral code (uppercase).
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars (0,1,O,I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validate Kenyan phone number.
 * Accepts: 07XX XXX XXX (10 digits) or 2547XXXXXXXX (12 digits).
 */
export function isValidKenyanPhone(phone?: string | null): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0") && cleaned.length === 10) return true;
  if (cleaned.startsWith("254") && cleaned.length === 12) return true;
  return false;
}

/**
 * Validate email format (basic).
 */
export function isValidEmail(email?: string | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}