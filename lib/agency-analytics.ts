/**
 * Campaign 02 — Agency Acquisition analytics.
 * Reuses the same dataLayer/GA4 pattern as Campaign 01 (trackProvider).
 * Events are prefixed with `agency_` to stay clearly distinguishable.
 */

export type AgencyEvent =
  | "landing_view"
  | "join_cta_click"
  | "how_it_works_click"
  | "registration_start"
  | "registration_complete"
  | "verification_start"
  | "verification_complete"
  | "profile_added"
  | "profile_published"
  | "profile_3_added"
  | "profile_5_added"
  | "profile_10_added"
  | "pricing_view"
  | "checkout_start"
  | "purchase"
  | "package_upgrade"
  | "login"
  | "profile_update"
  | "reactivation";

export type EventParams = Record<
  string,
  string | number | boolean | undefined
>;

export function trackAgency(
  event: AgencyEvent,
  params: EventParams = {},
) {
  if (typeof window === "undefined") return;

  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: `agency_${event}`,
    campaign: "agency_acquisition",
    user_type: "agency",
    ...params,
  });
}