export const PROVIDER_ROUTES = {
  REGISTER: "/private-escort-record",
  LOGIN: "/",
  SAFETY: "/safety",
} as const;

export const PROVIDER_OFFER = {
  credits: {
    profileCreation: 50,
    verification: 100,
    total: 150,
    creditValueKsh: 10,
    totalValueKsh: 1500,
  },
} as const;

export const PROVIDER_EVENTS = {
  LANDING_VIEW: "provider_landing_view",
  START_REGISTRATION: "start_registration",
  VIEW_HOW_IT_WORKS: "view_how_it_works",
  VIEW_SAFETY: "view_safety",
  WELCOME_OFFER_VIEW: "welcome_offer_view",
  EARNING_SECTION_VIEW: "provider_earning_section_view",
  EARNING_CTA_CLICK: "provider_earning_cta_click",
  START_PROVIDER_REGISTRATION: "start_provider_registration",
  CLICK_CREATE_PROFILE: "click_create_profile",
  CLICK_LOGIN: "click_login",
  CLICK_VIEW_PROFILE: "click_view_profile",
} as const;
