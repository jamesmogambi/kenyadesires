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
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/utils";
import { IAgency } from "@/types/agency.types";
import { Escort } from "./escort.action";
import { executeQuery } from "@/lib/neon";
import { notifyAdminOfAgencyVerification } from "./agency-verification-email";
import {
  sendWelcomeEmail,
  sendAdminNotificationEmail,
  sendVerificationSubmittedEmail,
} from "./email";
import {
  awardAccountCreationCredits,
  checkAndAwardProfileCompletion,
  awardVerificationCredits,
} from "./credit-rewards.action";

// ============================================
// GET AGENCIES
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
export async function getCachedAgencies(
  page: number = 1,
  limitCount: number = 24,
) {
  try {
    console.log(`🔄 Fetching agencies from Neon DB (page ${page})...`);

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitCount));
    const offset = (validPage - 1) * validLimit;

    const countResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM agencies WHERE is_active = TRUE`,
    );
    const total = parseInt(countResult[0]?.count || "0", 10);

    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies WHERE is_active = TRUE ORDER BY agencies.created_at DESC, agencies.name ASC LIMIT $${1} OFFSET $${2}`,
      [validLimit, offset],
    );

    const agencies: IAgency[] = rows.map(mapDbRowToAgency);

    return {
      success: true,
      data: {
        agencies,
        total,
        page: validPage,
        totalPages: Math.max(1, Math.ceil(total / validLimit)),
        hasMore: total > validPage * validLimit,
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
    console.log(`🔄 Fetching agency by slug from Neon DB: ${slug}`);

    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies WHERE slug = $1 AND is_active = TRUE LIMIT 1`,
      [slug],
    );

    if (rows.length === 0) {
      return {
        success: false,
        data: null,
      };
    }

    const agency = mapDbRowToAgency(rows[0]);

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
    return await fetchAgenciesCountFromNeon(filters || {});
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
    return await fetchFirstAgencyFromNeon(filters || {});
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

export const getAgenciesServer = fetchAgenciesServer;

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

export const getAgenciesCountServer = fetchAgenciesCountServer;

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

export const getFirstAgencyServer = fetchFirstAgencyServer;

// ============================================
// GET AGENCY ESCORTS
// ============================================
export async function getCachedAgencyEscorts(
  agencyId: string,
  page: number = 1,
  limitCount: number = 20,
) {
  try {
    console.log(`🔄 Fetching escorts for agency from Neon DB: ${agencyId}`);

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitCount));
    const offset = (validPage - 1) * validLimit;

    const countResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM escorts WHERE agency_id = $1 AND is_active = TRUE`,
      [agencyId],
    );
    const total = parseInt(countResult[0]?.count || "0", 10);

    const rows: any[] = await executeQuery(
      `SELECT ${ESCORT_NEON_COLUMNS.map((c) => `escorts.${c}`).join(", ")} FROM escorts WHERE agency_id = $1 AND is_active = TRUE ORDER BY escorts.created_at DESC LIMIT $${2} OFFSET $${3}`,
      [agencyId, validLimit, offset],
    );

    const escorts: Escort[] = rows.map(mapDbRowToEscort);

    return {
      success: true,
      data: escorts,
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: total > validPage * validLimit,
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
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  utm_source_platform?: string;
  landing_page?: string;
  first_touch_at?: string;
  registration_date?: string;
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
      credits: 0,
      featuredEmployeesCount: 0,
      isActive: true,
      isFeatured: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      utm_id: data.utm_id,
      utm_source_platform: data.utm_source_platform,
      landing_page: data.landing_page,
      first_touch_at: data.first_touch_at,
      registration_date: data.registration_date || now.toISOString(),
    };

    const docRef = adminDb.collection("agencies").doc(slug);

    await docRef.set({
      id: docRef.id,
      ...agency,
      ...(socialMedia ? { socialMedia } : {}),
      ...(data.establishmentYear ? {} : { establishmentYear: null }),
    });

    // Award Milestone 1 — Create Account (10 credits)
    await awardAccountCreationCredits(
      data.ownerId,
      data.contactEmail,
      data.contactPhone || data.whatsappPhone || "",
      "agency",
      docRef.id,
    );

    // Award Milestone 2 — Complete Profile (20 credits) if threshold met
    await checkAndAwardProfileCompletion(
      data.ownerId,
      {
        name: data.name,
        contactEmail: data.contactEmail,
        county: data.county,
        region: data.region,
        businessType: data.businessType || "agency",
      },
      "agency",
      docRef.id,
    );

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);

    // Send welcome email to the new agency owner
    if (data.contactEmail) {
      await sendWelcomeEmail(data.contactEmail, data.name, "business", 10);
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

    const utmFields = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "utm_id",
      "utm_source_platform",
      "landing_page",
      "first_touch_at",
      "registration_date",
    ];

    for (const field of utmFields) {
      if (existing[field] && payload[field] === undefined) {
        payload[field] = existing[field];
      }
    }

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
// NEON DB QUERIES (no caching)
// ============================================

function mapDbRowToAgency(row: any): IAgency {
  return {
    id: row.id,
    name: row.name || "",
    slug: row.slug || "",
    description: row.description || "",
    contactEmail: row.contact_email || "",
    contactPhone: row.contact_phone || "",
    whatsappPhone: row.whatsapp_phone,
    website: row.website,
    ownerId: row.owner_id || "",
    country: row.country || "Kenya",
    county: row.county || "",
    countyCode: row.county_code || "",
    region: row.region || "",
    town: row.town || "",
    regions: row.regions || [],
    primaryRegion: row.primary_region || "",
    estate: row.estate,
    address: row.address,
    street: row.street,
    postalCode: row.postal_code,
    businessType: (row.business_type as IAgency["businessType"]) || "agency",
    categories: row.categories || [],
    openingHours: row.opening_hours || {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "Closed",
    },
    services: row.services || [],
    specialties: row.specialties || [],
    isVerified: row.is_verified || false,
    verificationStatus: row.verification_status || "pending",
    verificationDocuments: row.verification_documents,
    logo: row.logo,
    coverImage: row.cover_image,
    gallery: row.gallery || [],
    videos: row.videos || [],
    establishmentYear: row.establishment_year,
    languages: row.languages || ["English"],
    paymentMethods: row.payment_methods || ["Cash", "M-Pesa"],
    socialMedia: row.social_media,
    plan: {
      type: row.plan_type || "basic",
      isActive: row.plan_is_active !== undefined ? row.plan_is_active : true,
      activatedAt: row.plan_activated_at,
      expiresAt: row.plan_expires_at,
      features: row.plan_features || [],
      maxEmployees: row.plan_max_employees || 5,
      maxGalleryImages: row.plan_max_gallery_images || 10,
    },
    rating: Number(row.rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    totalBookings: Number(row.total_bookings || 0),
    totalViews: Number(row.total_views || 0),
    credits: row.credits,
    featuredEmployeesCount: Number(row.featured_employees_count || 0),
    isActive: row.is_active !== undefined ? row.is_active : true,
    isFeatured: row.is_featured || false,
    utm_source: row.utm_source,
    utm_medium: row.utm_medium,
    utm_campaign: row.utm_campaign,
    utm_content: row.utm_content,
    utm_term: row.utm_term,
    utm_id: row.utm_id,
    utm_source_platform: row.utm_source_platform,
    landing_page: row.landing_page,
    first_touch_at: row.first_touch_at,
    registration_date: row.registration_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const AGENCY_NEON_COLUMNS = [
  "id", "name", "slug", "description", "contact_email", "contact_phone",
  "whatsapp_phone", "website", "owner_id", "country", "county", "county_code",
  "region", "town", "regions", "primary_region", "estate", "address", "street",
  "postal_code", "business_type", "categories", "opening_hours", "services",
  "specialties", "is_verified", "verification_status", "verification_documents",
  "logo", "cover_image", "gallery", "videos", "establishment_year", "languages",
  "payment_methods", "social_media", "plan_type", "plan_is_active",
  "plan_activated_at", "plan_expires_at", "plan_features", "plan_max_employees",
  "plan_max_gallery_images", "rating", "total_reviews", "total_bookings",
  "total_views", "credits", "featured_employees_count", "is_active",
  "is_featured", "utm_source", "utm_medium", "utm_campaign", "utm_content",
  "utm_term", "utm_id", "utm_source_platform", "landing_page", "first_touch_at",
  "registration_date", "created_at", "updated_at",
];

async function fetchAgenciesFromNeon(
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

  const conditions: string[] = ["agencies.is_active = TRUE"];
  const params_arr: any[] = [];
  let paramIndex = 1;

  if (county && county !== "all") {
    conditions.push(`agencies.county = $${paramIndex}`);
    params_arr.push(county);
    paramIndex++;
  }
  if (region && region !== "all") {
    conditions.push(`agencies.region = $${paramIndex}`);
    params_arr.push(region);
    paramIndex++;
  }
  if (business && business !== "all") {
    conditions.push(`agencies.business_type = $${paramIndex}`);
    params_arr.push(business);
    paramIndex++;
  }
  if (verified === "true") {
    conditions.push(`agencies.is_verified = TRUE`);
  }
  if (featured === "true") {
    conditions.push(`agencies.is_featured = TRUE`);
  }
  if (search && search !== "all") {
    const searchTerm = `%${search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(agencies.name) LIKE $${paramIndex} OR LOWER(agencies.description) LIKE $${paramIndex + 1})`,
    );
    params_arr.push(searchTerm, searchTerm);
    paramIndex += 2;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalResult: any[] = await executeQuery(
    `SELECT COUNT(*) as count FROM agencies ${where}`,
    params_arr,
  );
  const total = parseInt(totalResult[0]?.count || "0", 10);

  const offset = (validPage - 1) * validLimit;
  const rows: any[] = await executeQuery(
    `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies ${where} ORDER BY agencies.created_at DESC, agencies.name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params_arr, validLimit, offset],
  );

  const agencies = rows.map(mapDbRowToAgency);

  return {
    agencies,
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: total > validPage * validLimit,
  };
}

async function fetchAgenciesCountFromNeon(
  params: Pick<GetAgenciesServerParams, "county" | "region" | "business"> = {},
): Promise<number> {
  try {
    const { county, region, business } = params;
    const conditions: string[] = ["is_active = TRUE"];
    const params_arr: any[] = [];
    let paramIndex = 1;

    if (county && county !== "all") {
      conditions.push(`county = $${paramIndex}`);
      params_arr.push(county);
      paramIndex++;
    }
    if (region && region !== "all") {
      conditions.push(`region = $${paramIndex}`);
      params_arr.push(region);
      paramIndex++;
    }
    if (business && business !== "all") {
      conditions.push(`business_type = $${paramIndex}`);
      params_arr.push(business);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM agencies ${where}`,
      params_arr,
    );
    return parseInt(result[0]?.count || "0", 10);
  } catch (error) {
    console.error("Error getting agencies count from Neon:", error);
    return 0;
  }
}

async function fetchFirstAgencyFromNeon(
  params: Pick<GetAgenciesServerParams, "county" | "region" | "business"> = {},
): Promise<IAgency | null> {
  try {
    const { county, region, business } = params;
    const conditions: string[] = ["is_active = TRUE"];
    const params_arr: any[] = [];
    let paramIndex = 1;

    if (county && county !== "all") {
      conditions.push(`county = $${paramIndex}`);
      params_arr.push(county);
      paramIndex++;
    }
    if (region && region !== "all") {
      conditions.push(`region = $${paramIndex}`);
      params_arr.push(region);
      paramIndex++;
    }
    if (business && business !== "all") {
      conditions.push(`business_type = $${paramIndex}`);
      params_arr.push(business);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies ${where} ORDER BY agencies.created_at DESC LIMIT 1`,
      params_arr,
    );

    if (rows.length === 0) return null;
    return mapDbRowToAgency(rows[0]);
  } catch (error) {
    console.error("Error getting first agency from Neon:", error);
    return null;
  }
}

// ============================================
// NEON DB: AGENCY ESCORTS (no caching)
// ============================================

const ESCORT_NEON_COLUMNS = [
  "id", "clerk_user_id", "name", "username", "preview_photo", "labels",
  "email", "age", "telephone", "whatsapp_phone", "images", "videos",
  "about", "availability", "ethnicity", "nationality", "bust_size", "weight",
  "zodiac_sign", "sexual_orientation", "gender", "languages", "categories",
  "country", "county", "county_code", "regions", "primary_region", "locations",
  "source", "practices", "bdsm", "massage", "extra_services", "slug", "role",
  "opening_hours", "rates", "breast_size", "age_category", "character",
  "hair_color", "experience", "work_type", "agency_id", "agency_role",
  "agency_commission_rate", "is_agency_featured", "is_active", "is_verified",
  "is_featured", "verification_status", "verification_documents", "street",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "utm_id", "utm_source_platform", "landing_page", "first_touch_at",
  "registration_date", "watermark_status", "watermark_error", "last_processed_at",
  "images_metadata", "total_images_processed", "total_images_failed",
  "has_cleaned_images", "cleaned_images", "credits", "plan_type",
  "plan_is_active", "plan_features", "plan_activated_at", "plan_expires_at",
  "total_bookings", "total_reviews", "rating", "total_views", "created_at",
  "updated_at",
];

function mapDbRowToEscort(row: any): Escort {
  return {
    id: row.id,
    name: row.name || "",
    username: row.username || "",
    previewPhoto: row.preview_photo || "",
    labels: row.labels || [],
    email: row.email || "",
    age: row.age || "",
    telephone: row.telephone || "",
    whatsappPhone: row.whatsapp_phone,
    images: row.images || [],
    videos: row.videos || [],
    about: row.about || "",
    availability: row.availability || [],
    ethnicity: row.ethnicity || "",
    nationality: row.nationality || "",
    bustSize: row.bust_size || "",
    weight: row.weight || "",
    zodiacSign: row.zodiac_sign || "",
    sexualOrientation: row.sexual_orientation || "",
    gender: row.gender || "girl",
    languages: row.languages || [],
    categories: row.categories || [],
    country: row.country || "Kenya",
    county: row.county || "",
    countyCode: row.county_code || "",
    regions: row.regions || [],
    primaryRegion: row.primary_region || "",
    locations: row.locations || [],
    source: row.source || "custom",
    practices: row.practices || [],
    bdsm: row.bdsm || [],
    massage: row.massage || [],
    extraServices: row.extra_services || [],
    slug: row.slug || "",
    role: row.role || "escort",
    openingHours: row.opening_hours || {
      monday: "", tuesday: "", wednesday: "", thursday: "",
      friday: "", saturday: "", sunday: "",
    },
    rates: row.rates || [],
    breastSize: row.breast_size || "",
    ageCategory: row.age_category || "",
    character: row.character || "",
    hairColor: row.hair_color || "",
    experience: row.experience || "",
    workType: row.work_type || "independent",
    agencyId: row.agency_id,
    agencyRole: row.agency_role,
    agencyCommissionRate: row.agency_commission_rate,
    isAgencyFeatured: row.is_agency_featured || false,
    isActive: row.is_active !== undefined ? row.is_active : true,
    isVerified: row.is_verified || false,
    isFeatured: row.is_featured || false,
    verificationStatus: row.verification_status,
    verificationDocuments: row.verification_documents,
    street: row.street,
    plan: {
      type: row.plan_type || "basic",
      isActive: row.plan_is_active !== undefined ? row.plan_is_active : true,
      features: row.plan_features || [],
      maxEmployees: 0,
      maxGalleryImages: 0,
    },
    totalBookings: Number(row.total_bookings || 0),
    totalReviews: Number(row.total_reviews || 0),
    rating: Number(row.rating || 0),
    totalViews: Number(row.total_views || 0),
    credits: row.credits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAgencyEscortsFromNeon(
  agencyId: string,
  page: number = 1,
  limitCount: number = 20,
): Promise<{ success: boolean; data: Escort[]; error?: string; total: number; page: number; totalPages: number; hasMore: boolean }> {
  try {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitCount));
    const offset = (validPage - 1) * validLimit;

    const countResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM escorts WHERE agency_id = $1 AND is_active = TRUE`,
      [agencyId],
    );
    const total = parseInt(countResult[0]?.count || "0", 10);

    const rows: any[] = await executeQuery(
      `${ESCORT_NEON_COLUMNS.map((c) => `escorts.${c}`).join(", ")} FROM escorts WHERE agency_id = $1 AND is_active = TRUE ORDER BY escorts.created_at DESC LIMIT $${2} OFFSET $${3}`,
      [agencyId, validLimit, offset],
    );

    return {
      success: true,
      data: rows.map(mapDbRowToEscort),
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: total > validPage * validLimit,
    };
  } catch (error) {
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
// NEON DB: AGENCIES WITH ESCORTS (single optimized query)
// ============================================
export async function getAgenciesWithEscortsFromNeon(
  params: GetAgenciesServerParams = {},
  escortsLimit: number = 10,
): Promise<
  GetAgenciesServerResponse & {
    agencies: (IAgency & { escorts?: Escort[] })[];
  }
> {
  try {
    const result = await fetchAgenciesFromNeon(params);
    const { agencies, total, page, totalPages, hasMore } = result;

    if (agencies.length === 0) {
      return { agencies, total, page, totalPages, hasMore };
    }

    const agencyIds = agencies.map((a) => a.id);
    const placeholders = agencyIds.map((_, i) => `$${i + 1}`).join(", ");

    const rows: any[] = await executeQuery(
      `SELECT ${ESCORT_NEON_COLUMNS.map((c) => `escorts.${c}`).join(", ")}
       FROM escorts
       WHERE agency_id IN (${placeholders}) AND is_active = TRUE
       ORDER BY escorts.created_at DESC`,
      agencyIds,
    );

    // Group escorts by agency_id and cap each list to escortsLimit
    const escortsByAgency = new Map<string, Escort[]>();
    for (const row of rows) {
      const escort = mapDbRowToEscort(row);
      const agencyId = escort.agencyId;
      if (!agencyId) continue;

      if (!escortsByAgency.has(agencyId)) {
        escortsByAgency.set(agencyId, []);
      }
      const list = escortsByAgency.get(agencyId)!;
      if (list.length < escortsLimit) {
        list.push(escort);
      }
    }

    const agenciesWithEscorts = agencies.map((agency) => ({
      ...agency,
      escorts: escortsByAgency.get(agency.id) || [],
    }));

    return {
      agencies: agenciesWithEscorts,
      total,
      page,
      totalPages,
      hasMore,
    };
  } catch (error) {
    console.error("Error getting agencies with escorts from Neon:", error);
    return {
      agencies: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

// ============================================
// NEON DB EXPORTS (no caching)
// ============================================
export const getAgenciesFromNeon = fetchAgenciesFromNeon;
export const getAgenciesCountFromNeon = fetchAgenciesCountFromNeon;
export const getFirstAgencyFromNeon = fetchFirstAgencyFromNeon;

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
// These point to the Neon DB versions (no caching)
export const getAgenciesCount = getAgenciesCountFromNeon;
export const getFirstAgency = getFirstAgencyFromNeon;
export const getAgencyEscorts = getAgencyEscortsFromNeon;

// ============================================
// OPTIMIZED EXPORTS (use adminDb + getCountFromServer for speed)
// ============================================
export const getAgencies = getAgenciesServer;
export const getAgenciesCountOptimized = getAgenciesCountServer;
export const getFirstAgencyOptimized = getFirstAgencyServer;
