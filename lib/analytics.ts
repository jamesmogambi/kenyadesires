export type ProviderEvent =
  | "landing_view"
  | "start_registration"
  | "complete_registration"
  | "complete_profile"
  | "start_verification"
  | "complete_verification"
  | "profile_published"
  | "share_profile"
  | "click_whatsapp"
  | "view_own_profile"
  | "view_pricing"
  | "start_purchase"
  | "purchase"
  | "profile_boost"
  | "referral_link_created"
  | "referral_signup"
  | "referral_qualified"
  | "referral_reward";

export type EventParams = Record<
  string,
  string | number | boolean | undefined
>;

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function trackProvider(
  event: ProviderEvent,
  params: EventParams = {},
) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: `provider_${event}`,
    user_type: "provider",
    ...params,
  });
}
