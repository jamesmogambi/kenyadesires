/**
 * Business logic: TrafficStars postback firing.
 * Handles validation, dedup, logging, and retry.
 */

import { createPostback, findPostbackByClickAndEvent, markPostbackSent, markPostbackFailed, incrementPostbackAttempts } from "@/lib/db/trafficstars-postbacks";
import { findProviderLeadByClickId, updateProviderLeadDescription } from "@/lib/db/provider-leads";
import { createProviderEvent, updateEventPostbackStatus } from "@/lib/db/provider-events";

export const VALID_POSTBACK_EVENTS = ["registration", "profile_complete", "verification", "paid_upgrade"] as const;
export type PostbackEvent = (typeof VALID_POSTBACK_EVENTS)[number];

export interface FirePostbackInput {
  click_id: string;
  event: PostbackEvent;
  value?: number;
  provider_lead_id?: string;
}

export interface FirePostbackResult {
  success: boolean;
  alreadyFired?: boolean;
  error?: string;
  postbackId?: string;
}

const TRAFFICSTARS_POSTBACK_URL =
  process.env.TRAFFICSTARS_POSTBACK_URL ||
  "https://postback.trafficstars.com";

/**
 * Fire a postback to TrafficStars.
 * 1. Validate event type
 * 2. Check click_id exists in provider_leads
 * 3. Dedup: don't fire same click_id + event twice
 * 4. Log to trafficstars_postbacks
 * 5. Send server-side request to TrafficStars
 * 6. Retry up to 3 times with exponential backoff on failure
 */
export async function fireTrafficStarsPostback(
  input: FirePostbackInput,
): Promise<FirePostbackResult> {
  const { click_id, event, value, provider_lead_id } = input;

  // 1. Validate event
  if (!VALID_POSTBACK_EVENTS.includes(event)) {
    return { success: false, error: `Invalid event: ${event}` };
  }

  // 2. Validate click_id exists
  const lead = await findProviderLeadByClickId(click_id);
  if (!lead) {
    return { success: false, error: `click_id not found: ${click_id}` };
  }

  const resolvedLeadId = provider_lead_id || lead.id;

  // 3. Dedup
  const existing = await findPostbackByClickAndEvent(click_id, event);
  if (existing && existing.status === "sent") {
    return { success: true, alreadyFired: true, postbackId: existing.id };
  }

  // 4. Create log entry
  const postback = await createPostback({
    click_id,
    event,
    value,
    provider_lead_id: resolvedLeadId,
  });

  // 5. Fire with retry
  const maxAttempts = 3;
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const postbackUrl = `${TRAFFICSTARS_POSTBACK_URL}/?click_id=${encodeURIComponent(click_id)}&event=${encodeURIComponent(event)}&value=${value ?? ""}`;
      const response = await fetch(postbackUrl, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        await markPostbackSent(postback.id);
        return { success: true, postbackId: postback.id };
      }

      lastError = `TrafficStars returned HTTP ${response.status}`;
    } catch (err: any) {
      lastError = err?.message || "Unknown error";
    }

    if (attempt < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // All attempts failed
  await markPostbackFailed(postback.id, lastError || "Unknown error");
  return { success: false, error: lastError, postbackId: postback.id };
}

/**
 * Fire postback for a known provider event (used by milestone handlers).
 */
export async function firePostbackForEvent(
  providerLeadId: string,
  event: PostbackEvent,
  value?: number,
): Promise<FirePostbackResult> {
  const lead = await findProviderLeadById(providerLeadId);
  if (!lead || !lead.click_id) {
    return { success: false, error: "No click_id on lead" };
  }

  return fireTrafficStarsPostback({
    click_id: lead.click_id,
    event,
    value,
    provider_lead_id: providerLeadId,
  });
}