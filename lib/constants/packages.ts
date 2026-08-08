export const CREDIT_PACKAGES = [
  {
    id: "credits-50",
    name: "Starter",
    credits: 50,
    price: 500,
    currency: "KSH",
    popular: false,
  },
  {
    id: "credits-180",
    name: "Best Value",
    credits: 180,
    price: 1800,
    currency: "KSH",
    popular: true,
  },
] as const;

export const AD_PACKAGES = [
  {
    id: "extend-30",
    name: "Extend 30 Days",
    description: "Extend your membership by 30 days",
    credits: 150,
    type: "extend",
    durationDays: 30,
  },
  {
    id: "boost-1",
    name: "Boost 1 Day",
    description: "Boost your listing for 1 day",
    credits: 20,
    type: "boost",
    durationDays: 1,
    creditsPerDay: 20,
  },
  {
    id: "boost-7",
    name: "Boost 7 Days",
    description: "Boost your listing for 7 days",
    credits: 120,
    type: "boost",
    durationDays: 7,
    creditsPerDay: 20,
    savings: "Save 14%",
  },
  {
    id: "featured-7",
    name: "Featured 7 Days",
    description: "Get featured placement for 7 days",
    credits: 200,
    type: "featured",
    durationDays: 7,
  },
] as const;

export const PLAN_TYPES = {
  FREE: "free",
  BASIC: "basic",
  VIP: "vip",
  PREMIUM: "premium",
} as const;

export const PLAN_DETAILS = {
  free: {
    name: "Free",
    maxEmployees: 1,
    maxGalleryImages: 5,
    features: ["Basic listing", "1 profile photo"],
  },
  basic: {
    name: "Basic",
    maxEmployees: 5,
    maxGalleryImages: 10,
    features: ["Extended listing", "Up to 5 photos", "Basic support"],
  },
  vip: {
    name: "VIP",
    maxEmployees: 15,
    maxGalleryImages: 25,
    features: ["Priority placement", "Up to 25 photos", "Priority support", "Badge"],
  },
  premium: {
    name: "Premium",
    maxEmployees: 50,
    maxGalleryImages: 50,
    features: ["Top placement", "Up to 50 photos", "24/7 support", "Verified badge", "Analytics"],
  },
} as const;

export const CREDIT_VALUE_KSH = 10;

export function getCreditPackageById(id: string) {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}

export function getAdPackageById(id: string) {
  return AD_PACKAGES.find((p) => p.id === id);
}
