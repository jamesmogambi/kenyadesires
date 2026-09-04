export const AGENCY_ROUTES = {
  REGISTER: "/register-business",
  LOGIN: "/",
  SAFETY: "/safety",
  TERMS: "/terms",
  PRIVACY: "/privacy-policy",
} as const;

export const AGENCY_OFFER = {
  enabled: true,
} as const;

export const AGENCY_EVENTS = {
  LANDING_VIEW: "agency_landing_page_view",
  CTA_CLICK: "agency_cta_click",
  HOW_IT_WORKS_VIEW: "agency_how_it_works_view",
  REGISTRATION_START: "agency_registration_start",
  REGISTRATION_COMPLETE: "agency_registration_complete",
} as const;

export const AGENCY_CTA_LOCATIONS = {
  HEADER: "header",
  HERO: "hero",
  BENEFITS: "benefits",
  EARNING_POTENTIAL: "earning_potential",
  HOW_IT_WORKS: "how_it_works",
  GROWTH_JOURNEY: "growth_journey",
  FINAL_CTA: "final_cta",
} as const;
