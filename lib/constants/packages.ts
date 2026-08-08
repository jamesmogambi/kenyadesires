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
    id: "quick_boost",
    name: "Quick Boost",
    description: "Short-term visibility boost",
    credits: 10,
    type: "boost",
    durationDays: 1,
    priority: 1,
  },
  {
    id: "weekly_boost",
    name: "Weekly Boost",
    description: "Standard featured listing",
    credits: 50,
    type: "boost",
    durationDays: 7,
    priority: 2,
    popular: true,
  },
  {
    id: "premium_boost",
    name: "Premium Boost",
    description: "Higher visibility and longer exposure",
    credits: 90,
    type: "boost",
    durationDays: 14,
    priority: 3,
    recommended: true,
  },
  {
    id: "monthly_vip",
    name: "Monthly VIP",
    description: "Highest standard visibility",
    credits: 150,
    type: "boost",
    durationDays: 30,
    priority: 4,
    bestValue: true,
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
