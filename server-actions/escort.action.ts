"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Types
export interface Escort {
  cleaningHistory: never[];
  id: string;
  name: string;
  username: string;
  previewPhoto: string;
  labels: string[];
  email: string;
  age: string;
  telephone: string;
  whatsappPhone: string;
  images: string[];
  videos: string[];
  about: string;
  availability: string[];
  ethnicity: string;
  nationality: string;
  bustSize: string;
  weight: string;
  zodiacSign: string;
  sexualOrientation: string;
  gender: string;
  languages: string[];
  categories: string[];
  country: string;
  county: string;
  countyCode: string;
  regions: string[];
  primaryRegion: string;
  locations: Location[];
  source: string;
  practices: string[];
  bdsm: string[];
  massage: string[];
  extraServices: string[];
  slug: string;
  role: string;
  openingHours: OpeningHours;
  rates: Rate[];
  breastSize: string;
  ageCategory: string;
  character: string;
  hairColor: string;
  experience: string;
  workType: string;
  agencyId?: string;
  isAgencyOwned?: boolean;
  clerkUserId?: string;
  isAgencyFeatured: boolean;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  plan: Plan;
  totalBookings: number;
  totalReviews: number;
  rating: number;
  totalViews: number;
  createdAt: Date;
  updatedAt: Date;

  // Watermark tracking fields
  watermarkStatus?: "pending" | "processing" | "completed" | "failed";
  watermarkError?: string;
  lastProcessedAt?: Date;
  imagesMetadata?: {
    [imageUrl: string]: {
      cleanedUrl?: string;
      status: "pending" | "processing" | "completed" | "failed";
      errorMessage?: string;
      processedAt?: Date;
      fileSize?: number;
      mimeType?: string;
    };
  };
  totalImagesProcessed?: number;
  totalImagesFailed?: number;

  street?: string;
}

export interface Location {
  region: string;
  town: string;
  estate: string;
  address: string;
  street: string;
  postalCode: string;
  isActive: boolean;
  notes: string;
  _id?: string;
}

export interface Rate {
  duration: string;
  incall: string;
  outcall: string;
  _id?: string;
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Plan {
  type: string;
  isActive: boolean;
  features: string[];
}

export interface GetEscortsParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  town?: string;
  estate?: string;
  practice?: string;
  practices?: string[];
  category?: string;
  categories?: string[];
  nationality?: string;
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  search?: string;
  minRating?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "age"
    | "totalViews"
    | "rating"
    | "totalBookings";
  sortOrder?: "asc" | "desc";
}

export interface GetEscortsResponse {
  escorts: Escort[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

// Helper function to convert Firestore DocumentSnapshot to Escort type (for single documents)
export const convertDocSnapshotToEscort = async (
  doc: FirebaseFirestore.DocumentSnapshot,
): Promise<Escort | null> => {
  if (!doc.exists) return null;

  const data = doc.data();
  if (!data) return null;

  return {
    cleaningHistory: data.cleaningHistory || [],
    id: doc.id,
    name: data.name,
    username: data.username,
    previewPhoto: data.previewPhoto,
    labels: data.labels || [],
    email: data.email,
    age: data.age,
    telephone: data.telephone,
    whatsappPhone: data.whatsappPhone,
    images: data.images || [],
    videos: data.videos || [],
    about: data.about,
    availability: data.availability || [],
    ethnicity: data.ethnicity,
    nationality: data.nationality,
    bustSize: data.bustSize,
    weight: data.weight,
    zodiacSign: data.zodiacSign,
    sexualOrientation: data.sexualOrientation,
    gender: data.gender,
    languages: data.languages || [],
    categories: data.categories || [],
    country: data.country,
    county: data.county, // This is now a string (county name), not an ObjectId
    countyCode: data.countyCode,
    regions: data.regions || [],
    primaryRegion: data.primaryRegion,
    locations: data.locations || [],
    source: data.source,
    practices: data.practices || [],
    bdsm: data.bdsm || [],
    massage: data.massage || [],
    extraServices: data.extraServices || [],
    slug: data.slug,
    role: data.role,
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
    breastSize: data.breastSize,
    ageCategory: data.ageCategory,
    character: data.character,
    hairColor: data.hairColor,
    experience: data.experience,
    workType: data.workType,
    agencyId: data.agencyId,
    isAgencyOwned: data.isAgencyOwned,
    clerkUserId: data.clerkUserId,
    isAgencyFeatured: data.isAgencyFeatured,
    isActive: data.isActive,
    isVerified: data.isVerified,
    isFeatured: data.isFeatured,
    plan: data.plan,
    totalBookings: data.totalBookings || 0,
    totalReviews: data.totalReviews || 0,
    rating: data.rating || 0,
    totalViews: data.totalViews || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
};
// Helper function to convert Firestore QueryDocumentSnapshot to Escort type (for collections)
export const convertQueryDocToEscort = async (
  doc: FirebaseFirestore.QueryDocumentSnapshot,
): Promise<Escort> => {
  const data = doc.data();
  return {
    cleaningHistory: data.cleaningHistory || [],
    id: doc.id,
    name: data.name,
    username: data.username,
    previewPhoto: data.previewPhoto,
    labels: data.labels || [],
    email: data.email,
    age: data.age,
    telephone: data.telephone,
    whatsappPhone: data.whatsappPhone,
    images: data.images || [],
    videos: data.videos || [],
    about: data.about,
    availability: data.availability || [],
    ethnicity: data.ethnicity,
    nationality: data.nationality,
    bustSize: data.bustSize,
    weight: data.weight,
    zodiacSign: data.zodiacSign,
    sexualOrientation: data.sexualOrientation,
    gender: data.gender,
    languages: data.languages || [],
    categories: data.categories || [],
    country: data.country,
    county: data.county,
    countyCode: data.countyCode,
    regions: data.regions || [],
    primaryRegion: data.primaryRegion,
    locations: data.locations || [],
    source: data.source,
    practices: data.practices || [],
    bdsm: data.bdsm || [],
    massage: data.massage || [],
    extraServices: data.extraServices || [],
    slug: data.slug,
    role: data.role,
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
    breastSize: data.breastSize,
    ageCategory: data.ageCategory,
    character: data.character,
    hairColor: data.hairColor,
    experience: data.experience,
    workType: data.workType,
    agencyId: data.agencyId,
    isAgencyOwned: data.isAgencyOwned,
    clerkUserId: data.clerkUserId,
    isAgencyFeatured: data.isAgencyFeatured,
    isActive: data.isActive,
    isVerified: data.isVerified,
    isFeatured: data.isFeatured,
    plan: data.plan,
    totalBookings: data.totalBookings || 0,
    totalReviews: data.totalReviews || 0,
    rating: data.rating || 0,
    totalViews: data.totalViews || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
  };
};

// Validation functions (optional - for logging only, won't throw errors)
async function logInvalidCounty(county: string): Promise<void> {
  try {
    const countiesRef = adminDb.collection("counties");
    const snapshot = await countiesRef
      .where("name", "==", county)
      .limit(1)
      .get();
    if (snapshot.empty) {
      console.warn(`County not found in database: ${county}`);
    }
  } catch (error) {
    console.error("Error checking county:", error);
  }
}

async function logInvalidRegion(
  region: string,
  county?: string,
): Promise<void> {
  try {
    const regionsRef = adminDb.collection("regions");
    let query = regionsRef.where("name", "==", region);

    if (county) {
      query = query.where("county", "==", county);
    }

    const snapshot = await query.limit(1).get();
    if (snapshot.empty) {
      console.warn(
        `Region not found in database: ${region}${county ? ` in ${county}` : ""}`,
      );
    }
  } catch (error) {
    console.error("Error checking region:", error);
  }
}

// ✅ Optimized version - uses server-side filtering
export async function getEscorts(
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
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // ✅ Build query
    let query: FirebaseFirestore.Query = adminDb.collection("escorts");

    // Apply filters
    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    if (isVerified !== undefined) {
      query = query.where("isVerified", "==", isVerified);
    }

    if (isFeatured !== undefined) {
      query = query.where("isFeatured", "==", isFeatured);
    }

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    // ✅ Apply sorting
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "totalViews",
      "totalBookings",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.orderBy(sortField, sortOrder);

    // ✅ Get count and data in parallel
    const [countSnapshot, dataSnapshot] = await Promise.all([
      query.get(), // Get all for count
      query
        .limit(validLimit)
        .offset((validPage - 1) * validLimit)
        .get(),
    ]);

    // ✅ Total from first snapshot
    const total = countSnapshot.size;

    // ✅ Convert data
    let escorts = dataSnapshot.docs.map(convertDocToEscortFast);

    // ✅ Apply array filters client-side (only if needed)
    if (region && region !== "all") {
      escorts = escorts.filter((e) => e.regions?.includes(region));
    }

    if (practice && practice !== "all") {
      escorts = escorts.filter((e) => e.practices?.includes(practice));
    }

    return {
      escorts,
      total: escorts.length,
      page: validPage,
      totalPages: Math.max(0, Math.ceil(escorts.length / validLimit)),
      hasMore: validPage * validLimit < escorts.length,
    };
  } catch (error) {
    console.error("Error fetching escorts:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

// Helper function to get escorts with client-side filtering only
export async function getEscortsWithClientFiltering(
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
    } = params;

    // Simple query with minimal filters
    let query: any = adminDb.collection("escorts");

    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    // Get all matching documents (limited to reasonable amount)
    const snapshot = await query.limit(1000).get();
    let allEscorts: Escort[] = await Promise.all(
      snapshot.docs.map(convertQueryDocToEscort),
    );

    // Apply all array filters client-side
    if (region && region !== "all") {
      allEscorts = allEscorts.filter((escort) =>
        escort.regions?.includes(region),
      );
    }

    if (practice && practice !== "all") {
      allEscorts = allEscorts.filter((escort) =>
        escort.practices?.includes(practice),
      );
    }

    const total = allEscorts.length;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const startAt = (validPage - 1) * validLimit;
    const escorts = allEscorts.slice(startAt, startAt + validLimit);

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.ceil(total / validLimit),
      hasMore: validPage * validLimit < total,
    };
  } catch (error) {
    console.error("Error in client-side filtering:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

// Helper function that ensures empty array on no results
export async function getEscortsSafe(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  const result = await getEscorts(params);

  // Ensure escorts is always an array
  if (!result.escorts) {
    result.escorts = [];
  }

  // Ensure total is correct
  if (result.escorts.length === 0 && result.total > 0) {
    result.total = 0;
    result.totalPages = 0;
    result.hasMore = false;
  }

  return result;
}

// Helper to check if any escorts exist (without fetching all data)
export async function hasEscorts(
  params: GetEscortsParams = {},
): Promise<boolean> {
  try {
    const result = await getEscorts({ ...params, limit: 1 });
    return result.total > 0;
  } catch (error) {
    console.error("Error checking escorts existence:", error);
    return false;
  }
}

// Get escorts by county
export async function getEscortsByCounty(
  countyCode: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    county: countyCode,
    isActive: true,
    limit,
    page,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
}

// Get escorts by region
export async function getEscortsByRegion(
  regionId: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    region: regionId,
    isActive: true,
    limit,
    page,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
}

// Get escorts by town/city
export async function getEscortsByTown(
  town: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  const { escorts, total, totalPages, hasMore } = await getEscorts({
    isActive: true,
    limit: limit * 2,
    page,
  });

  const filteredEscorts = escorts.filter((escort) =>
    escort.locations.some((loc) => loc.town === town || loc.estate === town),
  );

  return {
    escorts: filteredEscorts.slice(0, limit),
    total: filteredEscorts.length,
    page,
    totalPages: Math.ceil(filteredEscorts.length / limit),
    hasMore: filteredEscorts.length > page * limit,
  };
}

// Get escorts by practice/service
export async function getEscortsByPractice(
  practice: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    practice,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

// Get escorts by multiple practices
export async function getEscortsByPractices(
  practices: string[],
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    practices,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

// Get escorts by category
export async function getEscortsByCategory(
  category: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    category,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

// Get escorts by county and practice combined
export async function getEscortsByCountyAndPractice(
  countyCode: string,
  practice: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    county: countyCode,
    practice,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

// Get escorts by region and practice combined
export async function getEscortsByRegionAndPractice(
  regionId: string,
  practice: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    region: regionId,
    practice,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

// ============================================
// FAST: Convert document to Escort (sync)
// ============================================
function convertDocToEscortFast(doc: any): Escort {
  const data = doc.data();

  return {
    id: doc.id,
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
    agencyId: data.agencyId,
    isAgencyOwned: data.isAgencyOwned,
    clerkUserId: data.clerkUserId,
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
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
  };
}

// ============================================
// OPTIMIZED: Get escort by ID
// ============================================
export async function getEscortById(id: string): Promise<Escort | null> {
  try {
    // ✅ Early validation
    if (!id || id.trim() === "") {
      return null;
    }

    // ✅ Single query - no extra operations
    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    // ✅ Fire and forget - doesn't block response
    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {}); // Silent fail

    // ✅ Fast sync conversion
    return convertDocToEscortFast(doc);
  } catch (error) {
    console.error("Error fetching escort:", error);
    return null; // Return null instead of throwing
  }
}

// Get escort by username - FIXED
export async function getEscortByUsername(
  username: string,
): Promise<Escort | null> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];

    // Increment view count asynchronously without waiting
    adminDb
      .collection("escorts")
      .doc(doc.id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch((error) => {
        console.error("Error incrementing view count:", error);
      });

    return await convertDocSnapshotToEscort(doc);
  } catch (error) {
    console.error("Error fetching escort by username:", error);
    throw new Error("Failed to fetch escort");
  }
}

// Get featured escorts - UPDATED to use convertQueryDocToEscort
export async function getFeaturedEscorts(
  limit: number = 10,
): Promise<Escort[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .where("isFeatured", "==", true)
      .orderBy("rating", "desc")
      .limit(limit)
      .get();

    return Promise.all(snapshot.docs.map(convertQueryDocToEscort));
  } catch (error) {
    console.error("Error fetching featured escorts:", error);
    throw new Error("Failed to fetch featured escorts");
  }
}

// Get top rated escorts - UPDATED to use convertQueryDocToEscort
export async function getTopRatedEscorts(
  limit: number = 10,
): Promise<Escort[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .orderBy("rating", "desc")
      .limit(limit)
      .get();

    return Promise.all(snapshot.docs.map(convertQueryDocToEscort));
  } catch (error) {
    console.error("Error fetching top rated escorts:", error);
    throw new Error("Failed to fetch top rated escorts");
  }
}

// Get most viewed escorts - UPDATED to use convertQueryDocToEscort
export async function getMostViewedEscorts(
  limit: number = 10,
): Promise<Escort[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .orderBy("totalViews", "desc")
      .limit(limit)
      .get();

    return Promise.all(snapshot.docs.map(convertQueryDocToEscort));
  } catch (error) {
    console.error("Error fetching most viewed escorts:", error);
    throw new Error("Failed to fetch most viewed escorts");
  }
}

// Get recent escorts - UPDATED to use convertQueryDocToEscort
export async function getRecentEscorts(limit: number = 10): Promise<Escort[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return Promise.all(snapshot.docs.map(convertQueryDocToEscort));
  } catch (error) {
    console.error("Error fetching recent escorts:", error);
    throw new Error("Failed to fetch recent escorts");
  }
}

// Get all unique practices
export async function getAllPractices(): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .select("practices")
      .get();

    const practicesSet = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const practices = doc.data().practices || [];
      practices.forEach((practice: string) => practicesSet.add(practice));
    });

    return Array.from(practicesSet).sort();
  } catch (error) {
    console.error("Error fetching practices:", error);
    throw new Error("Failed to fetch practices");
  }
}

// Get all unique categories
export async function getAllCategories(): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .select("categories")
      .get();

    const categoriesSet = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const categories = doc.data().categories || [];
      categories.forEach((category: string) => categoriesSet.add(category));
    });

    return Array.from(categoriesSet).sort();
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

// Get all unique nationalities
export async function getAllNationalities(): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .select("nationality")
      .get();

    const nationalitiesSet = new Set<string>();
    snapshot.docs.forEach((doc) => {
      const nationality = doc.data().nationality;
      if (nationality) {
        nationalitiesSet.add(nationality);
      }
    });

    return Array.from(nationalitiesSet).sort();
  } catch (error) {
    console.error("Error fetching nationalities:", error);
    throw new Error("Failed to fetch nationalities");
  }
}

// Get escorts statistics
export async function getEscortsStatistics() {
  try {
    const totalSnapshot = await adminDb.collection("escorts").get();
    const total = totalSnapshot.size;

    const activeSnapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .get();
    const active = activeSnapshot.size;

    const verifiedSnapshot = await adminDb
      .collection("escorts")
      .where("isVerified", "==", true)
      .get();
    const verified = verifiedSnapshot.size;

    const featuredSnapshot = await adminDb
      .collection("escorts")
      .where("isFeatured", "==", true)
      .get();
    const featured = featuredSnapshot.size;

    // Get county distribution
    const countiesSnapshot = await adminDb
      .collection("escorts")
      .select("countyCode", "county")
      .get();

    const countyDistribution: Record<
      string,
      { code: string; name: string; count: number }
    > = {};
    countiesSnapshot.docs.forEach((doc) => {
      const countyCode = doc.data().countyCode;
      const countyName = doc.data().county;
      if (countyCode) {
        if (!countyDistribution[countyCode]) {
          countyDistribution[countyCode] = {
            code: countyCode,
            name: countyName || countyCode,
            count: 0,
          };
        }
        countyDistribution[countyCode].count++;
      }
    });

    // Get practice distribution
    const practicesSnapshot = await adminDb
      .collection("escorts")
      .select("practices")
      .get();

    const practiceDistribution: Record<string, number> = {};
    practicesSnapshot.docs.forEach((doc) => {
      const practices = doc.data().practices || [];
      practices.forEach((practice: string) => {
        practiceDistribution[practice] =
          (practiceDistribution[practice] || 0) + 1;
      });
    });

    // Get age distribution
    const agesSnapshot = await adminDb
      .collection("escorts")
      .select("age")
      .get();
    const ageDistribution: Record<string, number> = {};
    agesSnapshot.docs.forEach((doc) => {
      const age = doc.data().age;
      if (age) {
        const ageNum = parseInt(age);
        const ageGroup = `${Math.floor(ageNum / 5) * 5}-${Math.floor(ageNum / 5) * 5 + 4}`;
        ageDistribution[ageGroup] = (ageDistribution[ageGroup] || 0) + 1;
      }
    });

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
      featured,
      countyDistribution: Object.values(countyDistribution),
      practiceDistribution,
      ageDistribution,
    };
  } catch (error) {
    console.error("Error fetching escort statistics:", error);
    throw new Error("Failed to fetch escort statistics");
  }
}

// Create new escort
export async function createEscort(
  escortData: Omit<Escort, "id" | "createdAt" | "updatedAt">,
): Promise<Escort> {
  try {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Creation only allowed in development environment");
    }

    const now = new Date();
    const docRef = adminDb.collection("escorts").doc();

    const newEscort = {
      ...escortData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      totalBookings: 0,
      totalReviews: 0,
      rating: 0,
      totalViews: 0,
    };

    await docRef.set(newEscort);

    revalidatePath("/escorts");
    revalidatePath(`/escorts/${docRef.id}`);

    return {
      id: docRef.id,
      ...escortData,
      createdAt: now,
      updatedAt: now,
      totalBookings: 0,
      totalReviews: 0,
      rating: 0,
      totalViews: 0,
    };
  } catch (error) {
    console.error("Error creating escort:", error);
    throw new Error("Failed to create escort");
  }
}

// Update escort
export async function updateEscort(
  id: string,
  updates: Record<string, any>,
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.street !== undefined) updateData.street = updates.street;
    if (updates.telephone || updates.phone) updateData.telephone = updates.telephone || updates.phone;
    if (updates.whatsappPhone || updates.whatsappNumber) updateData.whatsappPhone = updates.whatsappPhone || updates.whatsappNumber;
    if (updates.about !== undefined) updateData.about = updates.about;
    if (updates.availability) updateData.availability = updates.availability;
    if (updates.nationality) updateData.nationality = updates.nationality;
    if (updates.bustSize || updates.breasts) {
      updateData.bustSize = updates.bustSize || updates.breasts;
      updateData.breastSize = updates.bustSize || updates.breasts;
    }
    if (updates.languages) updateData.languages = updates.languages;
    if (updates.region !== undefined || updates.regions !== undefined) {
      updateData.regions = updates.regions || [updates.region];
      updateData.primaryRegion = updates.primaryRegion || updates.region;
      updateData.county = updates.county || updates.region;
      if (updates.region !== undefined) delete updateData.region;
    }
    if (updates.practices) updateData.practices = updates.practices;
    if (updates.bdsm) updateData.bdsm = updates.bdsm;
    if (updates.massages !== undefined || updates.massage !== undefined) {
      updateData.massage = updates.massage || updates.massages;
      if (updates.massages !== undefined) delete updateData.massages;
    }
    if (updates.extraServices) updateData.extraServices = updates.extraServices;
    if (updates.categories) updateData.categories = updates.categories;
    if (updates.openingHours) updateData.openingHours = updates.openingHours;
    if (updates.ageCategory) updateData.ageCategory = updates.ageCategory;
    if (updates.character) updateData.character = updates.character;
    if (updates.hairColor) updateData.hairColor = updates.hairColor;
    if (updates.experience) updateData.experience = updates.experience;
    if (updates.age) updateData.age = updates.age;
    if (updates.weight) updateData.weight = updates.weight;
    if (updates.previewPhoto !== undefined) updateData.previewPhoto = updates.previewPhoto;
    if (updates.images) updateData.images = updates.images;
    if (updates.role) updateData.role = updates.role;
    if (updates.agencyId !== undefined) updateData.agencyId = updates.agencyId;
    if (updates.clerkUserId !== undefined) updateData.clerkUserId = updates.clerkUserId;
    if (updates.isAgencyOwned !== undefined) updateData.isAgencyOwned = updates.isAgencyOwned;
    if (updates.town !== undefined) {
      updateData.locations = [
        {
          region: updates.region || updates.primaryRegion || "",
          town: updates.town,
          estate: "",
          address: "",
          street: updates.street || "",
          postalCode: "",
          isActive: true,
          notes: "",
        },
      ];
    }

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await adminDb.collection("escorts").doc(id).update(updateData);

    revalidatePath("/escorts");
    revalidatePath(`/escorts/${id}`);
  } catch (error) {
    console.error("Error updating escort:", error);
    throw new Error("Failed to update escort");
  }
}

// Delete escort
export async function deleteEscort(id: string): Promise<void> {
  try {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Deletion only allowed in development environment");
    }

    await adminDb.collection("escorts").doc(id).delete();

    revalidatePath("/escorts");
  } catch (error) {
    console.error("Error deleting escort:", error);
    throw new Error("Failed to delete escort");
  }
}

// Update escort rating
export async function updateEscortRating(
  id: string,
  newRating: number,
): Promise<void> {
  try {
    const doc = await adminDb.collection("escorts").doc(id).get();
    const data = doc.data();

    const totalReviews = (data?.totalReviews || 0) + 1;
    const currentTotalRating = (data?.rating || 0) * (data?.totalReviews || 0);
    const newAverageRating = (currentTotalRating + newRating) / totalReviews;

    await adminDb
      .collection("escorts")
      .doc(id)
      .update({
        rating: newAverageRating,
        totalReviews,
        updatedAt: Timestamp.fromDate(new Date()),
      });

    revalidatePath(`/escorts/${id}`);
  } catch (error) {
    console.error("Error updating escort rating:", error);
    throw new Error("Failed to update escort rating");
  }
}

// Increment booking count
export async function incrementBookingCount(id: string): Promise<void> {
  try {
    await adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalBookings: FieldValue.increment(1),
        updatedAt: Timestamp.fromDate(new Date()),
      });
  } catch (error) {
    console.error("Error incrementing booking count:", error);
    throw new Error("Failed to update booking count");
  }
}

// ============================================
// OPTIMIZED: Get erotic massage escorts
// ============================================
export async function getEroticMassageEscortsOptimized(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      county,
      region,
      isActive = true,
      isVerified,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Build query with filters
    let query: any = adminDb.collection("escorts");

    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    if (isVerified !== undefined) {
      query = query.where("isVerified", "==", isVerified);
    }

    if (isFeatured !== undefined) {
      query = query.where("isFeatured", "==", isFeatured);
    }

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    // Apply sorting
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "totalViews",
      "totalBookings",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.orderBy(sortField, sortOrder);

    // Get ALL matching documents
    const snapshot = await query.get();
    let allDocs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by region (client-side)
    if (region && region !== "all") {
      allDocs = allDocs.filter((doc: any) => doc.regions?.includes(region));
    }

    // Filter by erotic massage practice
    const eroticMassageTerms = [
      "erotic massage",
      "erotic",
      "massage",
      "body to body",
      "sensual massage",
      "nuru massage",
      "tantric massage",
      "lingam massage",
      "yoni massage",
      "b2b",
      "body-to-body",
    ];

    allDocs = allDocs.filter((doc: any) => {
      if (!doc.practices || doc.practices.length === 0) return false;
      return doc.practices.some((practice: string) => {
        const lowerPractice = practice.toLowerCase();
        return eroticMassageTerms.some((term) =>
          lowerPractice.includes(term.toLowerCase()),
        );
      });
    });

    // Apply age filters
    if (params.minAge && params.minAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) >= params.minAge!,
      );
    }

    if (params.maxAge && params.maxAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) <= params.maxAge!,
      );
    }

    // Pagination
    const total = allDocs.length;
    const startAt = (validPage - 1) * validLimit;
    const paginatedDocs = allDocs.slice(startAt, startAt + validLimit);

    // Fast sync conversion
    const escorts = paginatedDocs.map((doc: any) => ({
      id: doc.id,
      name: doc.name || "",
      username: doc.username || "",
      previewPhoto: doc.previewPhoto || "",
      labels: doc.labels || [],
      email: doc.email || "",
      age: doc.age || "",
      telephone: doc.telephone || "",
      whatsappPhone: doc.whatsappPhone || "",
      images: doc.images || [],
      videos: doc.videos || [],
      about: doc.about || "",
      availability: doc.availability || [],
      ethnicity: doc.ethnicity || "",
      nationality: doc.nationality || "",
      bustSize: doc.bustSize || "",
      weight: doc.weight || "",
      zodiacSign: doc.zodiacSign || "",
      sexualOrientation: doc.sexualOrientation || "",
      gender: doc.gender || "",
      languages: doc.languages || [],
      categories: doc.categories || [],
      country: doc.country || "",
      county: doc.county || "",
      countyCode: doc.countyCode || "",
      regions: doc.regions || [],
      primaryRegion: doc.primaryRegion || "",
      locations: doc.locations || [],
      source: doc.source || "",
      practices: doc.practices || [],
      bdsm: doc.bdsm || [],
      massage: doc.massage || [],
      extraServices: doc.extraServices || [],
      slug: doc.slug || "",
      role: doc.role || "",
      openingHours: doc.openingHours || {
        monday: "Not Specified",
        tuesday: "Not Specified",
        wednesday: "Not Specified",
        thursday: "Not Specified",
        friday: "Not Specified",
        saturday: "Not Specified",
        sunday: "Not Specified",
      },
      rates: doc.rates || [],
      breastSize: doc.breastSize || "",
      ageCategory: doc.ageCategory || "",
      character: doc.character || "",
      hairColor: doc.hairColor || "",
      experience: doc.experience || "",
      workType: doc.workType || "",
      isAgencyFeatured: doc.isAgencyFeatured || false,
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      isVerified: doc.isVerified || false,
      isFeatured: doc.isFeatured || false,
      plan: doc.plan || { type: "free", isActive: true, features: [] },
      totalBookings: doc.totalBookings || 0,
      totalReviews: doc.totalReviews || 0,
      rating: doc.rating || 0,
      totalViews: doc.totalViews || 0,
      createdAt: doc.createdAt?.toDate?.() || doc.createdAt || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt || new Date(),
    })) as Escort[];

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.ceil(total / validLimit),
      hasMore: validPage * validLimit < total,
    };
  } catch (error) {
    console.error("Error fetching erotic massage escorts:", error);
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
// OPTIMIZED: Get BDSM escorts
// ============================================
export async function getBDSMEscortsOptimized(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      county,
      region,
      isActive = true,
      isVerified,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Build query with filters
    let query: any = adminDb.collection("escorts");

    if (isActive !== undefined) {
      query = query.where("isActive", "==", isActive);
    }

    if (isVerified !== undefined) {
      query = query.where("isVerified", "==", isVerified);
    }

    if (isFeatured !== undefined) {
      query = query.where("isFeatured", "==", isFeatured);
    }

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    // Apply sorting
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "rating",
      "totalViews",
      "totalBookings",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.orderBy(sortField, sortOrder);

    // Get ALL matching documents
    const snapshot = await query.get();
    let allDocs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by region (client-side)
    if (region && region !== "all") {
      allDocs = allDocs.filter((doc: any) => doc.regions?.includes(region));
    }

    // Filter by BDSM practice
    const bdsmTerms = [
      "BDSM",
      "bdsm",
      "Domination",
      "domination",
      "Submission",
      "submission",
      "Bondage",
      "bondage",
      "Discipline",
      "discipline",
      "Sadomasochism",
      "sadomasochism",
      "Dominatrix",
      "dominatrix",
      "Mistress",
      "mistress",
      "Slave",
      "slave",
      "Master",
      "master",
      "Kinky",
      "kinky",
      "Fetish",
      "fetish",
      "Spanking",
      "spanking",
      "Whipping",
      "whipping",
      "Role play",
      "role play",
      "Roleplay",
      "roleplay",
      "Leather",
      "leather",
      "Latex",
      "latex",
      "Pegging",
      "pegging",
      "Strap-on",
      "strap-on",
    ];

    allDocs = allDocs.filter((doc: any) => {
      if (!doc.practices || doc.practices.length === 0) return false;
      return doc.practices.some((practice: string) => {
        const lowerPractice = practice.toLowerCase();
        return bdsmTerms.some((term) =>
          lowerPractice.includes(term.toLowerCase()),
        );
      });
    });

    // Apply age filters
    if (params.minAge && params.minAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) >= params.minAge!,
      );
    }

    if (params.maxAge && params.maxAge > 0) {
      allDocs = allDocs.filter(
        (doc: any) => doc.age && parseInt(doc.age) <= params.maxAge!,
      );
    }

    // Pagination
    const total = allDocs.length;
    const startAt = (validPage - 1) * validLimit;
    const paginatedDocs = allDocs.slice(startAt, startAt + validLimit);

    // Fast sync conversion
    const escorts = paginatedDocs.map((doc: any) => ({
      id: doc.id,
      name: doc.name || "",
      username: doc.username || "",
      previewPhoto: doc.previewPhoto || "",
      labels: doc.labels || [],
      email: doc.email || "",
      age: doc.age || "",
      telephone: doc.telephone || "",
      whatsappPhone: doc.whatsappPhone || "",
      images: doc.images || [],
      videos: doc.videos || [],
      about: doc.about || "",
      availability: doc.availability || [],
      ethnicity: doc.ethnicity || "",
      nationality: doc.nationality || "",
      bustSize: doc.bustSize || "",
      weight: doc.weight || "",
      zodiacSign: doc.zodiacSign || "",
      sexualOrientation: doc.sexualOrientation || "",
      gender: doc.gender || "",
      languages: doc.languages || [],
      categories: doc.categories || [],
      country: doc.country || "",
      county: doc.county || "",
      countyCode: doc.countyCode || "",
      regions: doc.regions || [],
      primaryRegion: doc.primaryRegion || "",
      locations: doc.locations || [],
      source: doc.source || "",
      practices: doc.practices || [],
      bdsm: doc.bdsm || [],
      massage: doc.massage || [],
      extraServices: doc.extraServices || [],
      slug: doc.slug || "",
      role: doc.role || "",
      openingHours: doc.openingHours || {
        monday: "Not Specified",
        tuesday: "Not Specified",
        wednesday: "Not Specified",
        thursday: "Not Specified",
        friday: "Not Specified",
        saturday: "Not Specified",
        sunday: "Not Specified",
      },
      rates: doc.rates || [],
      breastSize: doc.breastSize || "",
      ageCategory: doc.ageCategory || "",
      character: doc.character || "",
      hairColor: doc.hairColor || "",
      experience: doc.experience || "",
      workType: doc.workType || "",
      isAgencyFeatured: doc.isAgencyFeatured || false,
      isActive: doc.isActive !== undefined ? doc.isActive : true,
      isVerified: doc.isVerified || false,
      isFeatured: doc.isFeatured || false,
      plan: doc.plan || { type: "free", isActive: true, features: [] },
      totalBookings: doc.totalBookings || 0,
      totalReviews: doc.totalReviews || 0,
      rating: doc.rating || 0,
      totalViews: doc.totalViews || 0,
      createdAt: doc.createdAt?.toDate?.() || doc.createdAt || new Date(),
      updatedAt: doc.updatedAt?.toDate?.() || doc.updatedAt || new Date(),
    })) as Escort[];

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.ceil(total / validLimit),
      hasMore: validPage * validLimit < total,
    };
  } catch (error) {
    console.error("Error fetching BDSM escorts:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}
