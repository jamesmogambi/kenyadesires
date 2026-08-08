// server-actions/agency.action.ts
"use server";

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/utils";
import { IAgency } from "@/types/agency.types";
import { Escort } from "./escort.action";
import { notifyAdminOfAgencyVerification } from "./agency-verification-email";
import {
  sendWelcomeEmail,
  sendAdminNotificationEmail,
  sendVerificationSubmittedEmail,
} from "./email";

// ============================================
// CONVERT FIREBASE DOC TO AGENCY
// ============================================
function serializePlan(plan: any): IAgency["plan"] {
  if (!plan) {
    return {
      type: "basic",
      isActive: true,
      features: [],
      maxEmployees: 5,
      maxGalleryImages: 10,
    };
  }

  return {
    type: plan.type || "basic",
    isActive: plan.isActive !== undefined ? plan.isActive : true,
    activatedAt: plan.activatedAt?.toDate?.()
      ? plan.activatedAt.toDate().toISOString()
      : plan.activatedAt
        ? new Date(plan.activatedAt).toISOString()
        : undefined,
    expiresAt: plan.expiresAt?.toDate?.()
      ? plan.expiresAt.toDate().toISOString()
      : plan.expiresAt
        ? new Date(plan.expiresAt).toISOString()
        : undefined,
    features: plan.features || [],
    maxEmployees: plan.maxEmployees || 5,
    maxGalleryImages: plan.maxGalleryImages || 10,
  };
}

function convertFirebaseDocToAgency(
  doc: QueryDocumentSnapshot<DocumentData>,
): IAgency {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    contactEmail: data.contactEmail || "",
    contactPhone: data.contactPhone || "",
    whatsappPhone: data.whatsappPhone,
    website: data.website,
    ownerId: data.ownerId || "",
    country: data.country || "Kenya",
    county: data.county || "",
    countyCode: data.countyCode || "",
    region: data.region || "",
    town: data.town || "",
    regions: data.regions || (data.region ? [data.region] : []),
    primaryRegion: data.primaryRegion || data.region || "",
    estate: data.estate,
    address: data.address,
    street: data.street,
    postalCode: data.postalCode,
    businessType: data.businessType || "agency",
    categories: data.categories || [],
    openingHours: data.openingHours || {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "Closed",
    },
    services: data.services || [],
    specialties: data.specialties || [],
    isVerified: data.isVerified || false,
    verificationStatus: data.verificationStatus || "pending",
    verificationDocuments: data.verificationDocuments,
    logo: data.logo,
    coverImage: data.coverImage,
    gallery: data.gallery || [],
    videos: data.videos || [],
    establishmentYear: data.establishmentYear,
    languages: data.languages || ["English"],
    paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
    socialMedia: data.socialMedia,
    plan: serializePlan(data.plan),
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    totalBookings: data.totalBookings || 0,
    totalViews: data.totalViews || 0,
    featuredEmployeesCount: data.featuredEmployeesCount || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isFeatured: data.isFeatured || false,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt || new Date().toISOString(),
  };
}

// ============================================
// GET AGENCIES
// ============================================
export async function getCachedAgencies(
  page: number = 1,
  limitCount: number = 24,
) {
  try {
    console.log(`🔄 Fetching agencies from Firestore (page ${page})...`);

    const agenciesRef = collection(db, "agencies");
    const constraints: QueryConstraint[] = [
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    const q = query(agenciesRef, ...constraints);
    const snapshot = await getDocs(q);

    const agencies: IAgency[] = [];
    snapshot.forEach((doc) => {
      agencies.push(convertFirebaseDocToAgency(doc));
    });

    const countQuery = query(agenciesRef, where("isActive", "==", true));
    const countSnapshot = await getDocs(countQuery);
    const total = countSnapshot.docs.length;

    const totalPages = Math.ceil(total / limitCount);

    return {
      success: true,
      data: {
        agencies,
        total,
        page,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching agencies:", error);
    return {
      success: false,
      data: {
        agencies: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      },
    };
  }
}

// ============================================
// GET AGENCY BY SLUG
// ============================================
export async function getCachedAgencyBySlug(slug: string) {
  try {
    console.log(`🔄 Fetching agency by slug: ${slug}`);

    const agenciesRef = collection(db, "agencies");
    const q = query(
      agenciesRef,
      where("slug", "==", slug),
      where("isActive", "==", true),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        data: null,
      };
    }

    const agency = convertFirebaseDocToAgency(snapshot.docs[0]);

    return {
      success: true,
      data: agency,
    };
  } catch (error) {
    console.error("Error fetching agency by slug:", error);
    return {
      success: false,
      data: null,
    };
  }
}

// ============================================
// GET AGENCIES COUNT
// ============================================
export async function getCachedAgenciesCount(filters?: {
  county?: string;
  region?: string;
  business?: string;
}) {
  try {
    const agenciesRef = collection(db, "agencies");
    const constraints: QueryConstraint[] = [where("isActive", "==", true)];

    if (filters?.county && filters.county !== "all") {
      constraints.push(where("county", "==", filters.county));
    }
    if (filters?.region && filters.region !== "all") {
      constraints.push(where("region", "==", filters.region));
    }
    if (filters?.business && filters.business !== "all") {
      constraints.push(where("businessType", "==", filters.business));
    }

    const q = query(agenciesRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.length;
  } catch (error) {
    console.error("Error getting agencies count:", error);
    return 0;
  }
}

// ============================================
// GET FIRST AGENCY (for metadata)
// ============================================
export async function getCachedFirstAgency(filters?: {
  county?: string;
  region?: string;
  business?: string;
}) {
  try {
    const agenciesRef = collection(db, "agencies");
    const constraints: QueryConstraint[] = [
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(1),
    ];

    if (filters?.county && filters.county !== "all") {
      constraints.push(where("county", "==", filters.county));
    }
    if (filters?.region && filters.region !== "all") {
      constraints.push(where("region", "==", filters.region));
    }
    if (filters?.business && filters.business !== "all") {
      constraints.push(where("businessType", "==", filters.business));
    }

    const q = query(agenciesRef, ...constraints);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return convertFirebaseDocToAgency(snapshot.docs[0]);
  } catch (error) {
    console.error("Error getting first agency:", error);
    return null;
  }
}

// ============================================
// OPTIMIZED: GET AGENCIES SERVER (adminDb + select + filters + streaming-ready)
// ============================================

const normalize = (val?: string) => (val || "").toLowerCase().trim();

// Only select the fields needed for the listing page — reduces network I/O dramatically
const AGENCY_LISTING_FIELDS = [
  "name",
  "slug",
  "coverImage",
  "logo",
  "contactPhone",
  "isVerified",
  "isFeatured",
  "rating",
  "totalReviews",
  "totalViews",
  "totalBookings",
  "businessType",
  "county",
  "region",
  "town",
  "description",
  "createdAt",
  "updatedAt",
  "languages",
  "paymentMethods",
  "services",
  "specialties",
  "isActive",
];

interface GetAgenciesServerParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  business?: string;
  verified?: string;
  featured?: string;
  search?: string;
}

interface GetAgenciesServerResponse {
  agencies: IAgency[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

function convertAdminDocToAgency(doc: any): IAgency {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    contactEmail: data.contactEmail || "",
    contactPhone: data.contactPhone || "",
    whatsappPhone: data.whatsappPhone,
    website: data.website,
    ownerId: data.ownerId || "",
    country: data.country || "Kenya",
    county: data.county || "",
    countyCode: data.countyCode || "",
    region: data.region || "",
    town: data.town || "",
    regions: data.regions || (data.region ? [data.region] : []),
    primaryRegion: data.primaryRegion || data.region || "",
    estate: data.estate,
    address: data.address,
    street: data.street,
    postalCode: data.postalCode,
    businessType: (data.businessType as IAgency["businessType"]) || "agency",
    categories: data.categories || [],
    openingHours: data.openingHours || {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "Closed",
    },
    services: data.services || [],
    specialties: data.specialties || [],
    isVerified: data.isVerified || false,
    verificationStatus: data.verificationStatus || "pending",
    verificationDocuments: data.verificationDocuments,
    logo: data.logo,
    coverImage: data.coverImage,
    gallery: data.gallery || [],
    videos: data.videos || [],
    establishmentYear: data.establishmentYear,
    languages: data.languages || ["English"],
    paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
    socialMedia: data.socialMedia,
    plan: serializePlan(data.plan),
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    totalBookings: data.totalBookings || 0,
    totalViews: data.totalViews || 0,
    featuredEmployeesCount: data.featuredEmployeesCount || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isFeatured: data.isFeatured || false,
    createdAt: data.createdAt?.toDate?.()
      ? data.createdAt.toDate().toISOString()
      : data.createdAt
        ? new Date(data.createdAt).toISOString()
        : undefined,
    updatedAt: data.updatedAt?.toDate?.()
      ? data.updatedAt.toDate().toISOString()
      : data.updatedAt
        ? new Date(data.updatedAt).toISOString()
        : undefined,
  };
}

function buildAgencyCountQuery(
  params: Pick<
    GetAgenciesServerParams,
    "county" | "region" | "business" | "verified" | "featured"
  >,
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [where("isActive", "==", true)];

  if (params.county && params.county !== "all") {
    constraints.push(where("county", "==", params.county));
  }
  if (params.region && params.region !== "all") {
    constraints.push(where("region", "==", params.region));
  }
  if (params.business && params.business !== "all") {
    constraints.push(where("businessType", "==", params.business));
  }
  if (params.verified === "true") {
    constraints.push(where("isVerified", "==", true));
  }
  if (params.featured === "true") {
    constraints.push(where("isFeatured", "==", true));
  }

  return constraints;
}

async function fetchAgenciesServer(
  params: GetAgenciesServerParams = {},
): Promise<GetAgenciesServerResponse> {
  const {
    page = 1,
    limit: limitParam = 24,
    county,
    region,
    business,
    verified,
    featured,
    search,
  } = params;

  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limitParam));

  const hasCountyFilter = !!(county && county !== "all");
  const hasRegionFilter = !!(region && region !== "all");
  const hasBusinessFilter = !!(business && business !== "all");

  // Phase 1: Try server-side exact-match filters (fast path)
  const countConstraints = buildAgencyCountQuery({ county, region, business, verified, featured });

  const q = adminDb.collection("agencies");
  let adminQuery: any = q
    .select(...AGENCY_LISTING_FIELDS)
    .where("isActive", "==", true);

  if (county && county !== "all") {
    adminQuery = adminQuery.where("county", "==", county);
  }
  if (region && region !== "all") {
    adminQuery = adminQuery.where("region", "==", region);
  }
  if (business && business !== "all") {
    adminQuery = adminQuery.where("businessType", "==", business);
  }
  if (verified === "true") {
    adminQuery = adminQuery.where("isVerified", "==", true);
  }
  if (featured === "true") {
    adminQuery = adminQuery.where("isFeatured", "==", true);
  }

  adminQuery = adminQuery.orderBy("createdAt", "desc");

  let total: number;
  let agencies: IAgency[];

  try {
    const countQuery = query(
      collection(db, "agencies"),
      ...countConstraints,
    );
    const [countSnapshot, dataSnapshot] = await Promise.all([
      getCountFromServer(countQuery),
      adminQuery
        .offset((validPage - 1) * validLimit)
        .limit(validLimit)
        .get(),
    ]);

    total = countSnapshot.data().count;
    agencies = dataSnapshot.docs.map(convertAdminDocToAgency);
  } catch (queryError: any) {
    console.warn(
      "Agencies: Server-side query failed, falling back to client-side filtering:",
      queryError?.message || queryError,
    );
    total = 0;
    agencies = [];
  }

  // Phase 2: Fallback to case-insensitive client-side filtering if 0 results
  // and there are any filters (handles case mismatches like "Nairobi" vs "nairobi")
  if (
    total === 0 &&
    (hasCountyFilter || hasRegionFilter || hasBusinessFilter)
  ) {
    try {
      const fallbackQuery = adminDb.collection("agencies")
        .select(...AGENCY_LISTING_FIELDS)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc");

      const fallbackSnapshot = await fallbackQuery.get();
      const allAgencies = fallbackSnapshot.docs.map(convertAdminDocToAgency);

      const countyLower = county?.toLowerCase();
      const regionLower = region?.toLowerCase();
      const businessLower = business?.toLowerCase();

      const filtered = allAgencies.filter((agency) => {
        if (hasCountyFilter && normalize(agency.county) !== countyLower) return false;
        if (hasRegionFilter && normalize(agency.region) !== regionLower) return false;
        if (hasBusinessFilter && normalize(agency.businessType) !== businessLower) return false;
        if (verified === "true" && !agency.isVerified) return false;
        if (featured === "true" && !agency.isFeatured) return false;
        return true;
      });

      total = filtered.length;
      const startIndex = (validPage - 1) * validLimit;
      const endIndex = Math.min(startIndex + validLimit, filtered.length);
      agencies = filtered.slice(startIndex, endIndex);
    } catch (fallbackError: any) {
      console.warn(
        "Agencies: Phase 2 fallback failed:",
        fallbackError?.message || fallbackError,
      );
    }
  }

  // Apply search client-side (Firestore doesn't support full-text search)
  if (search && search !== "all") {
    const searchLower = search.toLowerCase();
    agencies = agencies.filter(
      (agency) =>
        agency.name?.toLowerCase().includes(searchLower) ||
        agency.description?.toLowerCase().includes(searchLower),
    );
  }

  const totalPages = Math.ceil(total / validLimit);

  return {
    agencies,
    total,
    page: validPage,
    totalPages,
    hasMore: validPage < totalPages,
  };
}

export const getAgenciesServer = cache(fetchAgenciesServer);

async function fetchAgenciesCountServer(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<number> {
  const hasCountyFilter = !!(params.county && params.county !== "all");
  const hasRegionFilter = !!(params.region && params.region !== "all");
  const hasBusinessFilter = !!(params.business && params.business !== "all");

  // Phase 1: Try server-side exact match using client SDK
  const constraints = buildAgencyCountQuery(params);
  const q = query(collection(db, "agencies"), ...constraints);

  try {
    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;

    // Phase 2: Fallback to client-side count if 0 results with filters
    // (handles case mismatches like "Nairobi" vs "nairobi")
    if (
      count === 0 &&
      (hasCountyFilter || hasRegionFilter || hasBusinessFilter)
    ) {
      const allQuery = query(
        collection(db, "agencies"),
        where("isActive", "==", true),
      );
      const allSnapshot = await getDocs(allQuery);

      const countyLower = params.county?.toLowerCase();
      const regionLower = params.region?.toLowerCase();
      const businessLower = params.business?.toLowerCase();

      let filteredCount = 0;
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        if (hasCountyFilter && normalize(data.county) !== countyLower) return;
        if (hasRegionFilter && normalize(data.region) !== regionLower) return;
        if (hasBusinessFilter && normalize(data.businessType) !== businessLower) return;
        filteredCount++;
      });

      return filteredCount;
    }

    return count;
  } catch (error) {
    console.error("Error getting agencies count:", error);
    return 0;
  }
}

export const getAgenciesCountServer = cache(fetchAgenciesCountServer);

async function fetchFirstAgencyServer(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<IAgency | null> {
  const hasCountyFilter = !!(params.county && params.county !== "all");
  const hasRegionFilter = !!(params.region && params.region !== "all");
  const hasBusinessFilter = !!(params.business && params.business !== "all");

  // Phase 1: Try server-side exact match
  const q = adminDb.collection("agencies");
  let adminQuery: any = q
    .select(...AGENCY_LISTING_FIELDS)
    .where("isActive", "==", true)
    .orderBy("createdAt", "desc")
    .limit(1);

  if (params.county && params.county !== "all") {
    adminQuery = adminQuery.where("county", "==", params.county);
  }
  if (params.region && params.region !== "all") {
    adminQuery = adminQuery.where("region", "==", params.region);
  }
  if (params.business && params.business !== "all") {
    adminQuery = adminQuery.where("businessType", "==", params.business);
  }

  try {
    const snapshot = await adminQuery.get();

    if (!snapshot.empty) {
      return convertAdminDocToAgency(snapshot.docs[0]);
    }

    // Phase 2: Fallback to case-insensitive client-side matching if 0 results
    if (hasCountyFilter || hasRegionFilter || hasBusinessFilter) {
      const fallbackQuery = adminDb.collection("agencies")
        .select(...AGENCY_LISTING_FIELDS)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc")
        .limit(50);

      const fallbackSnapshot = await fallbackQuery.get();

      const countyLower = params.county?.toLowerCase();
      const regionLower = params.region?.toLowerCase();
      const businessLower = params.business?.toLowerCase();

      for (const doc of fallbackSnapshot.docs) {
        const data = doc.data();
        if (hasCountyFilter && data.county?.toLowerCase() !== countyLower) continue;
        if (hasRegionFilter && data.region?.toLowerCase() !== regionLower) continue;
        if (hasBusinessFilter && data.businessType?.toLowerCase() !== businessLower) continue;
        return convertAdminDocToAgency(doc);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting first agency:", error);
    return null;
  }
}

export const getFirstAgencyServer = cache(fetchFirstAgencyServer);

// ============================================
// GET AGENCY ESCORTS
// ============================================
export async function getCachedAgencyEscorts(
  agencyId: string,
  page: number = 1,
  limitCount: number = 20,
) {
  try {
    console.log(`🔄 Fetching escorts for agency: ${agencyId}`);

    const escortsRef = collection(db, "escorts");
    const constraints: QueryConstraint[] = [
      where("agencyId", "==", agencyId),
      where("isActive", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount),
    ];

    const q = query(escortsRef, ...constraints);
    const snapshot = await getDocs(q);

    const escorts: Escort[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      escorts.push({
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
        country: data.country || "Kenya",
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
        role: data.role || "escort",
        openingHours: data.openingHours || {
          monday: "",
          tuesday: "",
          wednesday: "",
          thursday: "",
          friday: "",
          saturday: "",
          sunday: "",
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
        plan: data.plan || {
          type: "basic",
          isActive: true,
          features: [],
          maxEmployees: 0,
          maxGalleryImages: 0,
        },
        totalBookings: data.totalBookings || 0,
        totalReviews: data.totalReviews || 0,
        rating: data.rating || 0,
        totalViews: data.totalViews || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
      });
    });

    const totalQuery = query(
      escortsRef,
      where("agencyId", "==", agencyId),
      where("isActive", "==", true),
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const total = totalSnapshot.data().count;

    return {
      success: true,
      data: escorts,
      total,
      page,
      totalPages: Math.ceil(total / limitCount),
      hasMore: page < Math.ceil(total / limitCount),
    };
  } catch (error) {
    console.error("Error fetching agency escorts:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Failed to fetch escorts",
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

// ============================================
// GET AGENCY BY OWNER (Clerk user id)
// ============================================
export async function getAgencyByOwnerId(
  ownerId: string,
): Promise<IAgency | null> {
  try {
    if (!ownerId) return null;

    const snapshot = await adminDb
      .collection("agencies")
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      name: data.name || "",
      slug: data.slug || "",
      description: data.description || "",
      contactEmail: data.contactEmail || "",
      contactPhone: data.contactPhone || "",
      whatsappPhone: data.whatsappPhone,
      website: data.website,
      ownerId: data.ownerId || "",
      country: data.country || "Kenya",
      county: data.county || "",
      countyCode: data.countyCode || "",
      region: data.region || "",
      town: data.town || "",
      regions: data.regions || (data.region ? [data.region] : []),
      primaryRegion: data.primaryRegion || data.region || "",
      estate: data.estate,
      address: data.address,
      street: data.street,
      postalCode: data.postalCode,
      businessType: data.businessType || "agency",
      categories: data.categories || [],
      openingHours: data.openingHours || {
        monday: "9:00 AM - 6:00 PM",
        tuesday: "9:00 AM - 6:00 PM",
        wednesday: "9:00 AM - 6:00 PM",
        thursday: "9:00 AM - 6:00 PM",
        friday: "9:00 AM - 6:00 PM",
        saturday: "9:00 AM - 6:00 PM",
        sunday: "Closed",
      },
      services: data.services || [],
      specialties: data.specialties || [],
      isVerified: data.isVerified || false,
      verificationStatus: data.verificationStatus || "pending",
      verificationDocuments: data.verificationDocuments,
      logo: data.logo,
      coverImage: data.coverImage,
      gallery: data.gallery || [],
      videos: data.videos || [],
      establishmentYear: data.establishmentYear,
      languages: data.languages || ["English"],
      paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
      socialMedia: data.socialMedia,
      plan: serializePlan(data.plan),
      rating: data.rating || 0,
      totalReviews: data.totalReviews || 0,
      totalBookings: data.totalBookings || 0,
      totalViews: data.totalViews || 0,
      featuredEmployeesCount: data.featuredEmployeesCount || 0,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isFeatured: data.isFeatured || false,
      createdAt: data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : data.createdAt || null,
      updatedAt: data.updatedAt?.toDate?.()
        ? data.updatedAt.toDate().toISOString()
        : data.updatedAt || null,
    };
  } catch (error) {
    console.error("Error fetching agency by owner:", error);
    return null;
  }
}

// ============================================
// CREATE AGENCY
// ============================================
export interface CreateAgencyInput {
  name: string;
  description?: string;
  businessType?: IAgency["businessType"];
  contactEmail: string;
  contactPhone: string;
  whatsappPhone?: string;
  website?: string;
  ownerId: string;
  county: string;
  countyCode?: string;
  region: string;
  town: string;
  regions?: string[];
  primaryRegion?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  categories?: string[];
  services?: string[];
  specialties?: string[];
  languages?: string[];
  paymentMethods?: string[];
  establishmentYear?: number;
  openingHours?: Partial<IAgency["openingHours"]>;
  socialMedia?: IAgency["socialMedia"];
  logo?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  planType?: IAgency["plan"]["type"];
}

const PLAN_LIMITS: Record<
  IAgency["plan"]["type"],
  { maxEmployees: number; maxGalleryImages: number }
> = {
  basic: { maxEmployees: 10, maxGalleryImages: 20 },
  premium: { maxEmployees: 25, maxGalleryImages: 50 },
  enterprise: { maxEmployees: 100, maxGalleryImages: 200 },
};

const DEFAULT_OPENING_HOURS: IAgency["openingHours"] = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "09:00-18:00",
  sunday: "09:00-18:00",
};

// Strip empty social handles so we never store blank keys
function cleanSocialMedia(socialMedia?: IAgency["socialMedia"]) {
  if (!socialMedia) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(socialMedia).filter(([, value]) => !!value?.trim()),
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

// Slug must be unique - agencies are stored under their slug
async function generateUniqueAgencySlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;

  for (let attempt = 2; attempt <= 20; attempt++) {
    const snapshot = await adminDb
      .collection("agencies")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return slug;

    slug = `${base}-${attempt}`;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

export async function createAgency(
  data: CreateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    // One agency per owner
    const ownerSnapshot = await adminDb
      .collection("agencies")
      .where("ownerId", "==", data.ownerId)
      .limit(1)
      .get();

    if (!ownerSnapshot.empty) {
      return {
        success: false,
        error: "You already have an agency profile",
      };
    }

    const now = new Date();
    const slug = await generateUniqueAgencySlug(data.name);
    const planType = data.planType || "basic";
    const socialMedia = cleanSocialMedia(data.socialMedia);

    const agency: Omit<IAgency, "id"> = {
      name: data.name,
      slug,
      description: data.description || "",
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      whatsappPhone: data.whatsappPhone || "",
      website: data.website || "",
      ownerId: data.ownerId,
      country: "Kenya",
      county: data.county,
      countyCode:
        data.countyCode || data.county.toLowerCase().replace(/\s+/g, "-"),
      region: data.region,
      town: data.town,
      regions: data.regions || (data.region ? [data.region] : []),
      primaryRegion: data.primaryRegion || data.region,
      estate: data.estate || "",
      address: data.address || "",
      street: data.street || "",
      postalCode: data.postalCode || "",
      businessType: data.businessType || "agency",
      categories: data.categories || [],
      openingHours: { ...DEFAULT_OPENING_HOURS, ...(data.openingHours || {}) },
      services: data.services || [],
      specialties: data.specialties || [],
      isVerified: false,
      verificationStatus: "pending",
      logo: data.logo || "",
      coverImage: data.coverImage || "",
      gallery: data.gallery || [],
      videos: data.videos || [],
      establishmentYear: data.establishmentYear,
      languages: data.languages?.length ? data.languages : ["English"],
      paymentMethods: data.paymentMethods?.length
        ? data.paymentMethods
        : ["Cash", "M-Pesa"],
      plan: {
        type: planType,
        isActive: true,
        activatedAt: now.toISOString(),
        features: [],
        ...PLAN_LIMITS[planType],
      },
      rating: 0,
      totalReviews: 0,
      totalBookings: 0,
      totalViews: 0,
      credits: 100,
      featuredEmployeesCount: 0,
      isActive: true,
      isFeatured: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const docRef = adminDb.collection("agencies").doc(slug);

    await docRef.set({
      id: docRef.id,
      ...agency,
      ...(socialMedia ? { socialMedia } : {}),
      ...(data.establishmentYear ? {} : { establishmentYear: null }),
    });

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);

    // Send welcome email to the new agency owner
    if (data.contactEmail) {
      await sendWelcomeEmail(data.contactEmail, data.name, "business", 100);
    }

    // Notify admin of new registration
    await sendAdminNotificationEmail(
      data.name,
      data.contactEmail,
      "business",
      data.ownerId,
    );

    return { success: true, id: docRef.id, slug };
  } catch (error) {
    console.error("Error creating agency:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create agency",
    };
  }
}

// ============================================
// UPDATE AGENCY
// ============================================
export type UpdateAgencyInput = Partial<Omit<CreateAgencyInput, "ownerId">> & {
  ownerId: string;
};

export async function updateAgency(
  id: string,
  data: UpdateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    const docRef = adminDb.collection("agencies").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return { success: false, error: "Agency profile not found" };
    }

    const existing = snapshot.data() || {};

    if (existing.ownerId !== data.ownerId) {
      return {
        success: false,
        error: "You are not allowed to edit this agency",
      };
    }

    const { ownerId, planType, openingHours, socialMedia, ...rest } = data;
    const payload: Record<string, any> = { ...rest, updatedAt: new Date() };

    if (data.county) {
      payload.countyCode =
        data.countyCode || data.county.toLowerCase().replace(/\s+/g, "-");
    }

    if (openingHours) {
      payload.openingHours = {
        ...DEFAULT_OPENING_HOURS,
        ...(existing.openingHours || {}),
        ...openingHours,
      };
    }

    if (socialMedia) {
      payload.socialMedia = cleanSocialMedia(socialMedia) || {};
    }

    if (planType) {
      payload.plan = {
        ...(existing.plan || {}),
        type: planType,
        ...PLAN_LIMITS[planType],
      };
    }

    if (data.establishmentYear === undefined) {
      delete payload.establishmentYear;
    }

    // Firestore rejects undefined values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    await docRef.update(payload);

    const slug = existing.slug || id;

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);
    revalidatePath("/agency-profile");

    return { success: true, id, slug };
  } catch (error) {
    console.error("Error updating agency:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update agency",
    };
  }
}

// ============================================
// AGENCY IDENTITY VERIFICATION DOCUMENTS
// ============================================
export interface AgencyVerificationInput {
  ownerId: string;
  businessRegistration?: string;
  idFront?: string;
  idBack?: string;
  kraPin?: string;
  agencyName?: string;
}

export async function submitAgencyVerification(
  agencyId: string,
  data: AgencyVerificationInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = adminDb.collection("agencies").doc(agencyId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return { success: false, error: "Agency profile not found" };
    }

    const existing = snapshot.data() || {};

    if (existing.ownerId !== data.ownerId) {
      return { success: false, error: "Not allowed to verify this agency" };
    }

    const currentDocs = existing.verificationDocuments || {};

    const verificationDocuments = {
      ...currentDocs,
      businessLicense:
        data.businessRegistration || currentDocs.businessLicense || "",
      idProof: data.idFront || currentDocs.idProof || "",
      kraPin: data.kraPin || currentDocs.kraPin || "",
      otherDocuments: [
        ...(data.idBack ? [data.idBack] : []),
        ...(currentDocs.otherDocuments || []),
      ].filter(Boolean),
    };

    await docRef.update({
      verificationDocuments,
      verificationStatus: "under_review",
      isVerified: false,
      updatedAt: new Date(),
      ...(data.agencyName && data.agencyName !== existing.name
        ? { name: data.agencyName }
        : {}),
    });

    const updatedName = data.agencyName && data.agencyName !== existing.name
      ? data.agencyName
      : existing.name || "";

    await notifyAdminOfAgencyVerification({
      name: updatedName,
      id: docRef.id,
      ownerId: existing.ownerId || data.ownerId,
      verificationDocuments,
    });

    if (existing.contactEmail) {
      await sendVerificationSubmittedEmail(
        existing.contactEmail,
        updatedName,
        "agency",
      );
    }

    revalidatePath("/agency-profile");
    revalidatePath("/agency-verification-status");

    return { success: true };
  } catch (error) {
    console.error("Error submitting agency verification:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit agency verification",
    };
  }
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
// These point to the direct (uncached) versions
export const getAgenciesCount = getCachedAgenciesCount;
export const getFirstAgency = getCachedFirstAgency;
export const getAgencyEscorts = getCachedAgencyEscorts;

// ============================================
// OPTIMIZED EXPORTS (use adminDb + getCountFromServer for speed)
// ============================================
export const getAgencies = getAgenciesServer;
export const getAgenciesCountOptimized = getAgenciesCountServer;
export const getFirstAgencyOptimized = getFirstAgencyServer;
