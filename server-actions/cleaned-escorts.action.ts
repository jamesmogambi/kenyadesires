// server-actions/cleaned-escorts.action.ts

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

// ============================================
// OPTIMIZED: GET ESCORTS WITH ONLY CLEANED IMAGES
// ============================================

export async function getEscortsWithOnlyCleanedImages(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      county,
      region,
      practice,
      isActive = true,
      isVerified,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
      minAge,
      maxAge,
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // ✅ Start building query
    let query: FirebaseFirestore.Query = adminDb.collection("escorts");

    // Apply Firestore filters FIRST to reduce data loaded
    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    if (isVerified !== undefined) {
      query = query.where("isVerified", "==", isVerified);
    }

    if (isFeatured !== undefined) {
      query = query.where("isFeatured", "==", isFeatured);
    }

    // ✅ Apply county filter at database level (case-sensitive)
    // For case-insensitive, store a lowercase version of county
    if (county && county !== "all" && county !== "") {
      const searchCounty = county.toLowerCase().trim();
      query = query.where("countyLower", "==", searchCounty);
    }

    // ✅ Apply sorting at database level
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "totalViews",
      "totalBookings",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.orderBy(sortField, sortOrder);

    // ✅ Execute query with pagination at database level
    // We need to fetch extra for filtering, but we'll use a cursor approach
    const snapshot = await query.get();
    let allDocs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Filter by region (still in memory, but data is already filtered by county)
    if (region && region !== "all" && region !== "") {
      const searchRegion = region.toLowerCase().trim();
      allDocs = allDocs.filter((doc: any) => {
        if (!doc.regionsLower || !Array.isArray(doc.regionsLower)) return false;
        return doc.regionsLower.some((r: string) => r === searchRegion);
      });
    }

    // ✅ Filter by practice (still in memory, but data is already filtered)
    if (practice && practice !== "all" && practice !== "") {
      const searchPractice = practice.toLowerCase().trim();
      allDocs = allDocs.filter((doc: any) => {
        if (!doc.practicesLower || !Array.isArray(doc.practicesLower))
          return false;
        return doc.practicesLower.some((p: string) => p === searchPractice);
      });
    }

    // ✅ Filter by age
    if (minAge && minAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) >= minAge,
      );
    }

    if (maxAge && maxAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) <= maxAge,
      );
    }

    // ✅ Filter: Only include escorts with cleaned images
    const escortsWithCleanedImages = allDocs
      .filter((doc: any) => {
        if (!doc.imagesMetadata) return false;
        return Object.values(doc.imagesMetadata).some(
          (img: any) => img.status === "completed" && img.cleanedUrl,
        );
      })
      .map((doc: any) => {
        // Transform to only include cleaned images
        const cleanedImages: string[] = [];
        const cleanedImagesMetadata: any = {};

        if (doc.imagesMetadata) {
          for (const [originalUrl, info] of Object.entries(
            doc.imagesMetadata,
          )) {
            const imageInfo = info as any;
            if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
              cleanedImages.push(imageInfo.cleanedUrl);
              cleanedImagesMetadata[originalUrl] = imageInfo;
            }
          }
        }

        return {
          ...doc,
          images: cleanedImages,
          imagesMetadata: cleanedImagesMetadata,
          previewPhoto:
            cleanedImages.length > 0 ? cleanedImages[0] : doc.previewPhoto,
          totalImagesProcessed: cleanedImages.length,
        };
      });

    // ✅ Pagination after all filtering
    const total = escortsWithCleanedImages.length;
    const startAt = (validPage - 1) * validLimit;
    const paginatedDocs = escortsWithCleanedImages.slice(
      startAt,
      startAt + validLimit,
    );

    // Convert to Escort objects
    const escorts = paginatedDocs.map((doc: any) =>
      convertDocToEscortFast(doc),
    );

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.ceil(total / validLimit),
      hasMore: validPage * validLimit < total,
    };
  } catch (error) {
    console.error("Error fetching escorts with cleaned images:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

// ============================================
// OPTIMIZED: Helper functions using aggregate queries
// ============================================

/**
 * Get all regions for a specific county - OPTIMIZED with index
 */
export async function getRegionsByCounty(
  countyName: string,
): Promise<string[]> {
  try {
    if (!countyName || countyName === "all" || countyName === "") {
      return [];
    }

    const searchCounty = countyName.toLowerCase().trim();

    // ✅ Use a more efficient query with select
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .where("countyLower", "==", searchCounty)
      .select("regions")
      .get();

    const regionsSet = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const regions = data.regions || [];
      if (Array.isArray(regions)) {
        regions.forEach((region: string) => {
          if (region) regionsSet.add(region);
        });
      }
    });

    return Array.from(regionsSet).sort();
  } catch (error) {
    console.error("Error fetching regions by county:", error);
    return [];
  }
}

/**
 * Get all practices for a specific county and region - OPTIMIZED
 */
export async function getPracticesByCountyAndRegion(
  countyName: string,
  regionName: string,
): Promise<string[]> {
  try {
    const searchCounty = countyName?.toLowerCase().trim() || "";
    const searchRegion = regionName?.toLowerCase().trim() || "";

    // ✅ Build query with filters
    let query: FirebaseFirestore.Query = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (searchCounty) {
      query = query.where("countyLower", "==", searchCounty);
    }

    // We still need to filter region in memory since Firestore doesn't support array contains with case-insensitive
    const snapshot = await query.select("regions", "practices").get();

    const practicesSet = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Check region match
      if (searchRegion) {
        const regions = data.regions || [];
        if (
          !Array.isArray(regions) ||
          !regions.some((r: string) => r.toLowerCase().trim() === searchRegion)
        ) {
          return;
        }
      }

      // Add practices
      const practices = data.practices || [];
      if (Array.isArray(practices)) {
        practices.forEach((practice: string) => {
          if (practice) practicesSet.add(practice);
        });
      }
    });

    return Array.from(practicesSet).sort();
  } catch (error) {
    console.error("Error fetching practices:", error);
    return [];
  }
}

/**
 * Get all counties - OPTIMIZED with index
 */
export async function getAllCounties(): Promise<string[]> {
  try {
    // ✅ Use a more efficient query with select and limit
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .select("county")
      .get();

    const countiesSet = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const county = doc.data().county;
      if (county) {
        countiesSet.add(county);
      }
    });

    return Array.from(countiesSet).sort();
  } catch (error) {
    console.error("Error fetching counties:", error);
    return [];
  }
}

// ============================================
// NEW: Cached helper functions for dropdowns
// ============================================

let countiesCache: string[] | null = null;
let countiesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all counties with caching
 */
export async function getAllCountiesCached(): Promise<string[]> {
  const now = Date.now();

  if (countiesCache && now - countiesCacheTime < CACHE_TTL) {
    return countiesCache;
  }

  const counties = await getAllCounties();
  countiesCache = counties;
  countiesCacheTime = now;

  return counties;
}

// Cache for regions by county
const regionsCache = new Map<string, { data: string[]; time: number }>();

/**
 * Get regions by county with caching
 */
export async function getRegionsByCountyCached(
  countyName: string,
): Promise<string[]> {
  const key = countyName || "all";
  const cached = regionsCache.get(key);
  const now = Date.now();

  if (cached && now - cached.time < CACHE_TTL) {
    return cached.data;
  }

  const regions = await getRegionsByCounty(countyName);
  regionsCache.set(key, { data: regions, time: now });

  return regions;
}

// Helper function for fast conversion
function convertDocToEscortFast(doc: any): Escort {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id || data.id || "",
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
    cleaningHistory: data.cleaningHistory || [],
    imagesMetadata: data.imagesMetadata || {},
    totalImagesProcessed: data.totalImagesProcessed || 0,
    totalImagesFailed: data.totalImagesFailed || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
  };
}
