"use server";

import { executeQuery } from "@/lib/neon";
import { normalizedEquals } from "@/lib/escort-filters";
import { IAgency } from "@/types/agency.types";
import { Escort } from "./escort.action";
import { boostOrderBy } from "@/lib/boost";

const AGENCY_LISTING_COLUMNS = [
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
  // Boost state (migration 008) — read for the badge and the boosted sort.
  "boost_until", "boost_priority", "active_boost_package_id",
];

const AGENCY_SELECT = AGENCY_LISTING_COLUMNS.map((c) => `agencies.${c}`).join(", ");

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
    regions: Array.isArray(row.regions) ? row.regions : [],
    primaryRegion: row.primary_region || row.region || "",
    estate: row.estate,
    address: row.address,
    street: row.street,
    postalCode: row.postal_code,
    businessType: (row.business_type as IAgency["businessType"]) || "agency",
    categories: Array.isArray(row.categories) ? row.categories : [],
    openingHours: row.opening_hours || {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "Closed",
    },
    services: Array.isArray(row.services) ? row.services : [],
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    isVerified: row.is_verified || false,
    verificationStatus: row.verification_status || "pending",
    verificationDocuments: row.verification_documents,
    logo: row.logo,
    coverImage: row.cover_image,
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    videos: Array.isArray(row.videos) ? row.videos : [],
    establishmentYear: row.establishment_year,
    languages: Array.isArray(row.languages) ? row.languages : ["English"],
    paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : ["Cash", "M-Pesa"],
    socialMedia: row.social_media,
    plan: {
      type: row.plan_type || "basic",
      isActive: row.plan_is_active !== undefined ? row.plan_is_active : true,
      activatedAt: row.plan_activated_at,
      expiresAt: row.plan_expires_at,
      features: Array.isArray(row.plan_features) ? row.plan_features : [],
      maxEmployees: row.plan_max_employees || 5,
      maxGalleryImages: row.plan_max_gallery_images || 10,
    },
    rating: Number(row.rating || 0),
    totalReviews: Number(row.total_reviews || 0),
    totalBookings: Number(row.total_bookings || 0),
    totalViews: Number(row.total_views || 0),
    credits: row.credits,
    boostUntil: row.boost_until || null,
    boostPriority: Number(row.boost_priority) || 0,
    boostPackageId: row.active_boost_package_id || null,
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

function mapDbRowToEscort(row: any): Escort {
  return {
    id: row.id,
    name: row.name || "",
    username: row.username || "",
    slug: row.slug || "",
    previewPhoto: row.preview_photo || "",
    labels: Array.isArray(row.labels) ? row.labels : [],
    email: row.email || "",
    age: row.age || "",
    telephone: row.telephone || "",
    whatsappPhone: row.whatsapp_phone,
    images: Array.isArray(row.images) ? row.images : [],
    videos: Array.isArray(row.videos) ? row.videos : [],
    about: row.about || "",
    availability: Array.isArray(row.availability) ? row.availability : [],
    ethnicity: row.ethnicity || "",
    nationality: row.nationality || "",
    bustSize: row.bust_size || "",
    weight: row.weight || "",
    zodiacSign: row.zodiac_sign || "",
    sexualOrientation: row.sexual_orientation || "",
    gender: row.gender || "girl",
    languages: Array.isArray(row.languages) ? row.languages : [],
    categories: Array.isArray(row.categories) ? row.categories : [],
    country: row.country || "Kenya",
    county: row.county || "",
    countyCode: row.county_code || "",
    regions: Array.isArray(row.regions) ? row.regions : [],
    primaryRegion: row.primary_region || "",
    locations: row.locations || [],
    source: row.source || "custom",
    practices: Array.isArray(row.practices) ? row.practices : [],
    bdsm: Array.isArray(row.bdsm) ? row.bdsm : [],
    massage: Array.isArray(row.massage) ? row.massage : [],
    extraServices: Array.isArray(row.extraServices) ? row.extraServices : [],
    agencyId: row.agency_id,
    isAgencyOwned: row.is_agency_owned,
    clerkUserId: row.clerk_user_id,
    isAgencyFeatured: row.is_agency_featured || false,
    isActive: row.is_active !== undefined ? row.is_active : true,
    isVerified: row.is_verified || false,
    verificationStatus: row.verification_status,
    verificationDocuments: row.verification_documents,
    isFeatured: row.is_featured || false,
    plan: row.plan || { type: "basic", isActive: true, features: [] },
    totalBookings: Number(row.total_bookings || 0),
    totalReviews: Number(row.total_reviews || 0),
    rating: Number(row.rating || 0),
    totalViews: Number(row.total_views || 0),
    credits: row.credits,
    cleanedImages: Array.isArray(row.cleaned_images) ? row.cleaned_images : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as unknown as Escort;
}

function buildWhereClause(params: {
  county?: string;
  region?: string;
  business?: string;
  town?: string;
  verified?: string;
  featured?: string;
  search?: string;
}): { conditions: string[]; params: any[] } {
  const conditions: string[] = ["agencies.is_active = TRUE"];
  const params_arr: any[] = [];
  let paramIndex = 1;

  if (params.county && params.county !== "all") {
    conditions.push(normalizedEquals("county", paramIndex, "agencies."));
    params_arr.push(params.county);
    paramIndex++;
  }
  if (params.region && params.region !== "all") {
    conditions.push(normalizedEquals("region", paramIndex, "agencies."));
    params_arr.push(params.region);
    paramIndex++;
  }
  if (params.business && params.business !== "all") {
    // `business_type` is underscore-separated on disk (`massage_parlor`), so the
    // comparison folds `_` on both sides and a `massage-parlor` URL still matches.
    conditions.push(normalizedEquals("business_type", paramIndex, "agencies."));
    params_arr.push(params.business);
    paramIndex++;
  }
   if (params.town && params.town !== "all") {
     // Folded on both sides for the same reason as county/region/business: the
     // URL carries a slug while `locations[].town` holds a display name.
     conditions.push(
       `EXISTS (SELECT 1 FROM JSON_TABLE(agencies.locations, '$[*]' COLUMNS (town VARCHAR(255) PATH '$.town')) AS jt WHERE TRIM(REGEXP_REPLACE(LOWER(COALESCE(jt.town, '')), '[^a-z0-9]+', ' ')) = TRIM(REGEXP_REPLACE(LOWER($${paramIndex}), '[^a-z0-9]+', ' ')))`,
     );
     params_arr.push(params.town);
     paramIndex++;
   }
  if (params.verified === "true") {
    conditions.push(`agencies.is_verified = TRUE`);
  }
  if (params.featured === "true") {
    conditions.push(`agencies.is_featured = TRUE`);
  }
  if (params.search) {
    const searchTerm = `%${params.search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(agencies.name) LIKE $${paramIndex} OR LOWER(agencies.description) LIKE $${paramIndex + 1})`,
    );
    params_arr.push(searchTerm, searchTerm);
    paramIndex += 2;
  }

  return { conditions, params: params_arr };
}

export async function getAgenciesFromNeon(params: {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  business?: string;
  town?: string;
  verified?: string;
  featured?: string;
  search?: string;
}): Promise<{ agencies: IAgency[]; total: number }> {
  try {
    const { page = 1, limit = 24 } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const offset = (validPage - 1) * validLimit;

    const { conditions, params: params_arr } = buildWhereClause(params);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM agencies ${where}`,
      params_arr,
    );
    const total = parseInt(totalResult[0]?.count || "0", 10);

    // Live agency boosts rank first; expired boosts fall to priority 0 in the
    // CASE, so this is correct even before the cleanup script has run.
    const dataQuery = `SELECT ${AGENCY_SELECT} FROM agencies ${where} ORDER BY ${boostOrderBy("agencies", "agencies.created_at", "DESC")}, agencies.name ASC LIMIT $${params_arr.length + 1} OFFSET $${params_arr.length + 2}`;
    const rows: any[] = await executeQuery(dataQuery, [...params_arr, validLimit, offset]);

    return {
      agencies: rows.map(mapDbRowToAgency),
      total,
    };
  } catch (error) {
    console.error("Error fetching agencies from Neon:", error);
    return { agencies: [], total: 0 };
  }
}

export async function getAgenciesWithEscortsFromNeon(params: {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  business?: string;
  town?: string;
  verified?: string;
  featured?: string;
  search?: string;
}): Promise<{
  agencies: (IAgency & { escorts: Escort[]})[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}> {
  try {
    const { page = 1, limit = 24 } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const { agencies, total } = await getAgenciesFromNeon(params);

    const totalPages = Math.max(1, Math.ceil(total / validLimit));
    const hasMore = validPage < totalPages;

    const agencyIds = agencies.map((a) => a.id);
    const escortsMap: Record<string, Escort[]> = {};

    if (agencyIds.length > 0) {
      const placeholders = agencyIds.map((_, i) => `$${i + 1}`).join(", ");
      const escortQuery = `SELECT * FROM escorts WHERE agency_id IN (${placeholders}) AND is_active = TRUE ORDER BY created_at DESC`;
      const escortRows: any[] = await executeQuery(escortQuery, agencyIds);

      for (const row of escortRows) {
        if (row.agency_id) {
          if (!escortsMap[row.agency_id]) {
            escortsMap[row.agency_id] = [];
          }
          escortsMap[row.agency_id].push(mapDbRowToEscort(row));
        }
      }
    }

    const agenciesWithEscorts = agencies.map((agency) => ({
      ...agency,
      escorts: escortsMap[agency.id] || [],
    }));

    return {
      agencies: agenciesWithEscorts,
      total,
      page: validPage,
      totalPages,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching agencies with escorts from Neon:", error);
    return {
      agencies: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

export async function getAgenciesCountFromNeon(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<number> {
  try {
    const { conditions, params: params_arr } = buildWhereClause(params);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const totalResult: any[] = await executeQuery(
      `SELECT COUNT(*) as count FROM agencies ${where}`,
      params_arr,
    );
    return parseInt(totalResult[0]?.count || "0", 10);
  } catch (error) {
    console.error("Error getting agencies count from Neon:", error);
    return 0;
  }
}

export async function getFirstAgencyFromNeon(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<IAgency | null> {
  try {
    const { conditions, params: params_arr } = buildWhereClause(params);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_SELECT} FROM agencies ${where} ORDER BY agencies.created_at DESC LIMIT 1`,
      params_arr,
    );

    if (rows.length === 0) return null;
    return mapDbRowToAgency(rows[0]);
  } catch (error) {
    console.error("Error getting first agency from Neon:", error);
    return null;
  }
}

export async function getAgencyBySlugFromNeon(slug: string): Promise<IAgency | null> {
  try {
    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_SELECT} FROM agencies WHERE slug = $1 AND is_active = TRUE LIMIT 1`,
      [slug],
    );

    if (rows.length === 0) return null;
    return mapDbRowToAgency(rows[0]);
  } catch (error) {
    console.error("Error fetching agency by slug from Neon:", error);
    return null;
  }
}
