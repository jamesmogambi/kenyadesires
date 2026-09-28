export const AGENCY_ROUTES = {
  REGISTER: "/register-business",
  LOGIN: "/",
  SAFETY: "/safety",
  TERMS: "/terms",
  PRIVACY: "/privacy-policy",
} as const;

export const AGENCY_CAMPAIGN = "agency_acquisition" as const;

export const AGENCY_OFFER = {
  registrationCredits: 100,
  verificationCredits: 200,
  totalCredits: 300,
  creditValueKsh: 10,
  totalValueKsh: 3000,
  enabled: true,
} as const;

export const AGENCY_EVENTS = {
  LANDING_VIEW: "agency_landing_view",
  CTA_CLICK: "agency_join_cta_click",
  HOW_IT_WORKS_CLICK: "agency_how_it_works_click",
  REGISTRATION_START: "agency_registration_start",
  REGISTRATION_COMPLETE: "agency_registration_complete",
  VERIFICATION_START: "agency_verification_start",
  VERIFICATION_COMPLETE: "agency_verification_complete",
  PROFILE_ADDED: "agency_profile_added",
  PROFILE_PUBLISHED: "agency_profile_published",
  PROFILE_3_ADDED: "agency_profile_3_added",
  PROFILE_5_ADDED: "agency_profile_5_added",
  PROFILE_10_ADDED: "agency_profile_10_added",
  PRICING_VIEW: "agency_pricing_view",
  CHECKOUT_START: "agency_checkout_start",
  PURCHASE: "agency_purchase",
  PACKAGE_UPGRADE: "agency_package_upgrade",
  LOGIN: "agency_login",
  PROFILE_UPDATE: "agency_profile_update",
  REACTIVATION: "agency_reactivation",
} as const;

export const AGENCY_CTA_LOCATIONS = {
  HEADER: "header",
  HERO: "hero",
  BENEFITS: "benefits",
  EARNING_POTENTIAL: "earning_potential",
  HOW_IT_WORKS: "how_it_works",
  GROWTH_JOURNEY: "growth_journey",
  FINAL_CTA: "final_cta",
  OFFER: "offer",
  BOTTOM: "bottom",
} as const;

export const AGENCY_PROFILE_MILESTONES = {
  THREE: 3,
  FIVE: 5,
  TEN: 10,
} as const;

export const AGENCY_CREDIT_REWARDS = {
  REGISTRATION: "agency_registration_reward",
  VERIFICATION: "agency_verification_reward",
} as const;
