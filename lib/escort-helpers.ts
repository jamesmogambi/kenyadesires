// lib/escort-helpers.ts
// ❌ NO "use server" directive here

import { Escort } from "@/server-actions/escort.action";

/**
 * Fast sync conversion of Firestore document to Escort
 */
export function convertDocToEscortFast(doc: any): Escort | null {
  if (!doc) return null;

  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id || "";

  return {
    cleaningHistory: data.cleaningHistory || [],
    id: id,
    name: data.name || "",
    username: data.username || "",
    previewPhoto: data.previewPhoto || "",
    labels: data.labels || [],
    email: data.email || "",
    age: data.age || "",
    telephone: data.telephone || "",
    whatsappPhone: data.whatsappPhone || "",
    images: data.images || [],
    videos: data.videos || [],
    about: data.about || "",
    availability: data.availability || [],
    ethnicity: data.ethnicity || "",
    nationality: data.nationality || "",
    bustSize: data.bustSize || "",
    weight: data.weight || "",
    zodiacSign: data.zodiacSign || "",
    sexualOrientation: data.sexualOrientation || "",
    gender: data.gender || "",
    languages: data.languages || [],
    categories: data.categories || [],
    country: data.country || "",
    county: data.county || "",
    countyCode: data.countyCode || "",
    regions: data.regions || [],
    primaryRegion: data.primaryRegion || "",
    locations: data.locations || [],
    source: data.source || "",
    practices: data.practices || [],
    bdsm: data.bdsm || [],
    massage: data.massage || [],
    extraServices: data.extraServices || [],
    slug: data.slug || "",
    role: data.role || "",
    openingHours: data.openingHours || {
      monday: "Not Specified",
      tuesday: "Not Specified",
      wednesday: "Not Specified",
      thursday: "Not Specified",
      friday: "Not Specified",
      saturday: "Not Specified",
      sunday: "Not Specified",
    },
    rates: data.rates || [],
    breastSize: data.breastSize || "",
    ageCategory: data.ageCategory || "",
    character: data.character || "",
    hairColor: data.hairColor || "",
    experience: data.experience || "",
    workType: data.workType || "",
    isAgencyFeatured: data.isAgencyFeatured || false,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isVerified: data.isVerified || false,
    isFeatured: data.isFeatured || false,
    plan: data.plan || { type: "free", isActive: true, features: [] },
    totalBookings: data.totalBookings || 0,
    totalReviews: data.totalReviews || 0,
    rating: data.rating || 0,
    totalViews: data.totalViews || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
    watermarkStatus: data.watermarkStatus || "pending",
    watermarkError: data.watermarkError || "",
    lastProcessedAt:
      data.lastProcessedAt?.toDate?.() || data.lastProcessedAt || null,
    imagesMetadata: data.imagesMetadata || {},
    cleanedImages: data.cleanedImages || [],
    totalImagesProcessed: data.totalImagesProcessed || 0,
    totalImagesFailed: data.totalImagesFailed || 0,
  };
}

/**
 * Check if an escort has cleaned images
 */
export function hasCleanedImages(escort: any): boolean {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) return true;
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (img: any) => img.status === "completed" && img.cleanedUrl,
  );
}
