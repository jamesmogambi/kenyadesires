/**
 * Campaign 03 — Customer Acquisition Analytics
 * Tracks anonymous customer behavior and marketplace discovery through GA4/GTM.
 * Reuses existing dataLayer/GA4 pattern from Campaign 01 (trackProvider) and Campaign 02 (trackAgency).
 * Events are prefixed with `customer_` to stay clearly distinguishable.
 */

export type CustomerEvent =
  | "view_homepage"
  | "view_location"
  | "view_category"
  | "view_profile"
  | "click_contact"
  | "click_whatsapp"
  | "share_profile"
  | "save_profile"
  | "return_visit"
  | "repeat_profile_view";

export type ProfileType = "provider" | "agency";

export type ContactMethod = "phone" | "whatsapp" | "email" | "website";

export type ShareMethod = "whatsapp" | "twitter" | "facebook" | "copy_link" | "email";

export interface CustomerEventParams {
  page_type?: string;
  location?: string;
  location_slug?: string;
  category?: string;
  category_slug?: string;
  profile_id?: string;
  profile_type?: ProfileType;
  contact_method?: ContactMethod;
  share_method?: ShareMethod;
  [key: string]: string | number | boolean | undefined;
}

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function getDataLayer(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function trackCustomer(
  event: CustomerEvent,
  params: CustomerEventParams = {},
) {
  const dataLayer = getDataLayer();
  if (dataLayer.length === 0 && typeof window === "undefined") return;

  dataLayer.push({
    event: `customer_${event}`,
    campaign: "customer_acquisition",
    user_type: "customer",
    ...params,
  });
}

export function trackViewHomepage() {
  trackCustomer("view_homepage", {
    page_type: "homepage",
  });
}

export function trackViewLocation(
  location: string,
  locationSlug: string,
  profileType?: ProfileType,
) {
  trackCustomer("view_location", {
    location,
    location_slug: locationSlug,
    page_type: "location",
    ...(profileType && { profile_type: profileType }),
  });
}

export function trackViewCategory(category: string, categorySlug: string) {
  trackCustomer("view_category", {
    category,
    category_slug: categorySlug,
    page_type: "category",
  });
}

export function trackViewProfile(
  profileId: string,
  profileType: ProfileType,
  location: string,
  locationSlug: string,
) {
  trackCustomer("view_profile", {
    profile_id: profileId,
    profile_type: profileType,
    location,
    location_slug: locationSlug,
  });
}

export function trackClickContact(
  profileId: string,
  profileType: ProfileType,
  location: string,
  contactMethod: ContactMethod,
) {
  trackCustomer("click_contact", {
    profile_id: profileId,
    profile_type: profileType,
    location,
    contact_method: contactMethod,
  });
}

export function trackClickWhatsApp(
  profileId: string,
  profileType: ProfileType,
  location: string,
) {
  trackCustomer("click_whatsapp", {
    profile_id: profileId,
    profile_type: profileType,
    location,
  });
}

export function trackShareProfile(
  profileId: string,
  profileType: ProfileType,
  location: string,
  shareMethod: ShareMethod,
) {
  trackCustomer("share_profile", {
    profile_id: profileId,
    profile_type: profileType,
    location,
    share_method: shareMethod,
  });
}

export function trackSaveProfile(
  profileId: string,
  profileType: ProfileType,
  location: string,
) {
  trackCustomer("save_profile", {
    profile_id: profileId,
    profile_type: profileType,
    location,
  });
}

export function trackReturnVisit() {
  trackCustomer("return_visit", {});
}

export function trackRepeatProfileView(
  profileId: string,
  profileType: ProfileType,
  location: string,
  locationSlug: string,
) {
  trackCustomer("repeat_profile_view", {
    profile_id: profileId,
    profile_type: profileType,
    location,
    location_slug: locationSlug,
  });
}

function getProfileIdFromStorage(profileId: string): string {
  if (typeof window === "undefined") return "";
  try {
    const stored = sessionStorage.getItem("customer_viewed_profiles");
    const viewed = stored ? JSON.parse(stored) : [];
    return viewed.includes(profileId) ? profileId : "";
  } catch {
    return "";
  }
}

function setProfileIdInStorage(profileId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = sessionStorage.getItem("customer_viewed_profiles");
    const viewed: string[] = stored ? JSON.parse(stored) : [];
    if (!viewed.includes(profileId)) {
      viewed.push(profileId);
      sessionStorage.setItem("customer_viewed_profiles", JSON.stringify(viewed));
    }
  } catch {
  }
}

function isReturningVisitor(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const hasVisited = localStorage.getItem("customer_has_visited");
    if (!hasVisited) {
      localStorage.setItem("customer_has_visited", "true");
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function handleProfileView(
  profileId: string,
  profileType: ProfileType,
  location: string,
  locationSlug: string,
) {
  trackViewProfile(profileId, profileType, location, locationSlug);

  const alreadyViewed = getProfileIdFromStorage(profileId);
  if (alreadyViewed) {
    trackRepeatProfileView(profileId, profileType, location, locationSlug);
  } else {
    setProfileIdInStorage(profileId);
  }

  if (isReturningVisitor()) {
    trackReturnVisit();
  }
}

export function determineProfileType(escort: {
  isAgencyOwned?: boolean;
  agencyId?: string;
}): ProfileType {
  if (escort.isAgencyOwned === true || escort.agencyId) {
    return "agency";
  }
  return "provider";
}