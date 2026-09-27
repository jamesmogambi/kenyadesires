// server-actions/agency.action.ts
"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { slugify } from "@/lib/utils";
import { IAgency } from "@/types/agency.types";
import { Escort } from "./escort.action";
import { executeQuery, encodeJsonColumn } from "@/lib/neon";
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

// ============================================
// GET AGENCIES
// ============================================
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
// GET AGENCY BY OWNER (Clerk user id)
// ============================================
export async function getAgencyByOwnerId(
  ownerId: string,
): Promise<IAgency | null> {
  try {
    if (!ownerId) return null;

    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies WHERE owner_id = $1 AND is_active = TRUE LIMIT 1`,
      [ownerId],
    );

    if (rows.length === 0) return null;

    return mapDbRowToAgency(rows[0]);
  } catch (error) {
    console.error("Error fetching agency by owner:", error);
    return null;
  }
}

/** True when the signed-in Clerk user has an admin role */
export const isAdminUser = async (): Promise<boolean> => {
  try {
    const { userId } = await auth();
    if (!userId) return false;

    const user = await currentUser();
    const metadataRole = user?.unsafeMetadata?.role as string | undefined;

    if (metadataRole === "admin" || metadataRole === "superadmin") {
      return true;
    }

    const rows: any[] = await executeQuery(
      `SELECT role FROM users WHERE clerk_user_id = $1 OR id = $1 LIMIT 1`,
      [userId],
    );

    const role = rows[0]?.role as string | undefined;

    return role === "admin" || role === "superadmin";
  } catch {
    return false;
  }
};

// ============================================
// GET AGENCY BY ID
// ============================================
export async function getAgencyById(id: string): Promise<IAgency | null> {
  try {
    if (!id) return null;

    const rows: any[] = await executeQuery(
      `SELECT ${AGENCY_NEON_COLUMNS.map((c) => `agencies.${c}`).join(", ")} FROM agencies WHERE id = $1 LIMIT 1`,
      [id],
    );

    if (rows.length === 0) return null;

    return mapDbRowToAgency(rows[0]);
  } catch (error) {
    console.error("Error fetching agency by id:", error);
    return null;
  }
}

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
  verificationDocuments?: IAgency["verificationDocuments"];
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

function cleanSocialMedia(socialMedia?: IAgency["socialMedia"]) {
  if (!socialMedia) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(socialMedia).filter(([, value]) => !!value?.trim()),
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export async function createAgency(
  data: CreateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    const existing: any[] = await executeQuery(
      `SELECT id FROM agencies WHERE owner_id = $1`,
      [data.ownerId],
    );

    if (existing.length > 0) {
      return {
        success: false,
        error: "You already have an agency profile",
      };
    }

    const now = new Date();
    const id = crypto.randomUUID();
    const slug = slugify(data.name);
    const planType = data.planType || "basic";
    const socialMedia = cleanSocialMedia(data.socialMedia);

    // Built as [column, value] pairs rather than a hand-written column list plus
    // $1..$147 placeholder list: those had drifted out of sync (147 placeholders
    // for 63 columns, and no value at all for `credits`), which produced a
    // statement mysql2 could not format. Deriving the placeholders from the
    // values makes the two impossible to desynchronise, and lets
    // encodeJsonColumn key off the real column name.
    const fields: [string, any][] = [
      ["id", id],
      ["name", data.name],
      ["slug", slug],
      ["description", data.description || ""],
      ["contact_email", data.contactEmail],
      ["contact_phone", data.contactPhone],
      ["whatsapp_phone", data.whatsappPhone || ""],
      ["website", data.website || ""],
      ["owner_id", data.ownerId],
      ["country", "Kenya"],
      ["county", data.county],
      ["county_code", data.countyCode || (data.county || "").toLowerCase().replace(/\s+/g, "-")],
      ["region", data.region],
      ["town", data.town],
      ["regions", data.regions || (data.region ? [data.region] : [])],
      ["primary_region", data.primaryRegion || data.region],
      ["estate", data.estate || ""],
      ["address", data.address || ""],
      ["street", data.street || ""],
      ["postal_code", data.postalCode || ""],
      ["business_type", data.businessType || "agency"],
      ["categories", data.categories || []],
      ["opening_hours", DEFAULT_OPENING_HOURS],
      ["services", data.services || []],
      ["specialties", data.specialties || []],
      ["is_verified", false],
      ["verification_status", "pending"],
      ["verification_documents", data.verificationDocuments || null],
      ["logo", data.logo || ""],
      ["cover_image", data.coverImage || ""],
      ["gallery", data.gallery || []],
      ["videos", data.videos || []],
      ["establishment_year", data.establishmentYear || null],
      ["languages", data.languages?.length ? data.languages : ["English"]],
      ["payment_methods", data.paymentMethods?.length ? data.paymentMethods : ["Cash", "M-Pesa"]],
      ["social_media", socialMedia || null],
      ["plan_type", planType],
      ["plan_is_active", true],
      ["plan_activated_at", now],
      ["plan_expires_at", null],
      ["plan_features", []],
      ["plan_max_employees", PLAN_LIMITS[planType].maxEmployees],
      ["plan_max_gallery_images", PLAN_LIMITS[planType].maxGalleryImages],
      ["rating", 0],
      ["total_reviews", 0],
      ["total_bookings", 0],
      ["total_views", 0],
      ["featured_employees_count", 0],
      ["credits", 10],
      ["is_active", true],
      ["is_featured", false],
      ["utm_source", data.utm_source ?? null],
      ["utm_medium", data.utm_medium ?? null],
      ["utm_campaign", data.utm_campaign ?? null],
      ["utm_content", data.utm_content ?? null],
      ["utm_term", data.utm_term ?? null],
      ["utm_id", data.utm_id ?? null],
      ["utm_source_platform", data.utm_source_platform ?? null],
      ["landing_page", data.landing_page ?? null],
      ["first_touch_at", data.first_touch_at ?? null],
      ["registration_date", data.registration_date || now.toISOString()],
      ["created_at", now],
      ["updated_at", now],
    ];

    const quotedColumns = fields
      .map(([column]) => `\`${column}\``)
      .join(", ");
    const placeholders = fields
      .map((_, index) => `$${index + 1}`)
      .join(", ");
    const params = fields.map(([column, value]) =>
      encodeJsonColumn(column, value),
    );

    await executeQuery(
      `INSERT INTO agencies (${quotedColumns}) VALUES (${placeholders})`,
      params,
    );

    await awardAccountCreationCredits(
      data.ownerId,
      data.contactEmail,
      data.contactPhone || data.whatsappPhone || "",
      "agency",
      id,
    );

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
      id,
    );

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);

    if (data.contactEmail) {
      await sendWelcomeEmail(data.contactEmail, data.name, "business", 10);
    }

    await sendAdminNotificationEmail(
      data.name,
      data.contactEmail,
      "business",
      data.ownerId,
    );

    return { success: true, id, slug };
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
  isVerified?: boolean;
  verificationStatus?: string;
  rating?: number;
  credits?: number;
  isActive?: boolean;
  isFeatured?: boolean;
};

export async function updateAgency(
  id: string,
  data: UpdateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    const rows: any[] = await executeQuery(
      `SELECT * FROM agencies WHERE id = $1`,
      [id],
    );

    const existing: any = rows[0];

    if (!existing) {
      return { success: false, error: "Agency profile not found" };
    }

    if (existing.owner_id !== data.ownerId) {
      const callerIsAdmin = await isAdminUser();

      if (!callerIsAdmin) {
        return {
          success: false,
          error: "You are not allowed to edit this agency",
        };
      }
    }

    const { ownerId, planType, openingHours, socialMedia, ...rest } = data as any;
    const now = new Date();

    const updateData: Record<string, any> = { updated_at: now };

    if (rest.name !== undefined) updateData.name = rest.name;
    if (rest.description !== undefined) updateData.description = rest.description;
    if (rest.contactEmail !== undefined) updateData.contact_email = rest.contactEmail;
    if (rest.contactPhone !== undefined) updateData.contact_phone = rest.contactPhone;
    if (rest.whatsappPhone !== undefined) updateData.whatsapp_phone = rest.whatsappPhone;
    if (rest.website !== undefined) updateData.website = rest.website;
    if (rest.county !== undefined) updateData.county = rest.county;
    if (rest.countyCode !== undefined) updateData.county_code = rest.countyCode;
    if (rest.region !== undefined) updateData.region = rest.region;
    if (rest.town !== undefined) updateData.town = rest.town;
    if (rest.regions !== undefined) updateData.regions = rest.regions;
    if (rest.primaryRegion !== undefined) updateData.primary_region = rest.primaryRegion;
    if (rest.estate !== undefined) updateData.estate = rest.estate;
    if (rest.address !== undefined) updateData.address = rest.address;
    if (rest.street !== undefined) updateData.street = rest.street;
    if (rest.postalCode !== undefined) updateData.postal_code = rest.postalCode;
    if (rest.businessType !== undefined) updateData.business_type = rest.businessType;
    if (rest.categories !== undefined) updateData.categories = rest.categories;
    if (rest.services !== undefined) updateData.services = rest.services;
    if (rest.specialties !== undefined) updateData.specialties = rest.specialties;
    if (rest.languages !== undefined) updateData.languages = rest.languages;
    if (rest.paymentMethods !== undefined) updateData.payment_methods = rest.paymentMethods;
    if (rest.logo !== undefined) updateData.logo = rest.logo;
    if (rest.coverImage !== undefined) updateData.cover_image = rest.coverImage;
    if (rest.gallery !== undefined) updateData.gallery = rest.gallery;
    if (rest.videos !== undefined) updateData.videos = rest.videos;
    if (rest.establishmentYear !== undefined) updateData.establishment_year = rest.establishmentYear;
    if (rest.isVerified !== undefined) updateData.is_verified = rest.isVerified;
    if (rest.verificationStatus !== undefined) updateData.verification_status = rest.verificationStatus;
    if (rest.rating !== undefined) updateData.rating = rest.rating;
    if (rest.credits !== undefined) updateData.credits = rest.credits;
    if (rest.isActive !== undefined) updateData.is_active = rest.isActive;
    if (rest.isFeatured !== undefined) updateData.is_featured = rest.isFeatured;

    if (planType && planType in PLAN_LIMITS) {
      updateData.plan_type = planType;
      updateData.plan_max_employees = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.maxEmployees;
      updateData.plan_max_gallery_images = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]?.maxGalleryImages;
    }

    if (openingHours) {
      updateData.opening_hours = {
        ...DEFAULT_OPENING_HOURS,
        ...(existing.opening_hours || {}),
        ...openingHours,
      };
    }

    if (socialMedia) {
      updateData.social_media = cleanSocialMedia(socialMedia) || {};
    }

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = columns
      .map((c, i) => `\`${c}\` = $${i + 1}`)
      .join(", ");
    const params = columns.map((column, i) =>
      encodeJsonColumn(column, values[i]),
    );

    await executeQuery(
      `UPDATE agencies SET ${setClause} WHERE id = $${columns.length + 1}`,
      [...params, id],
    );

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
    const rows: any[] = await executeQuery(
      `SELECT * FROM agencies WHERE id = $1`,
      [agencyId],
    );

    const existing = rows[0];

    if (!existing) {
      return { success: false, error: "Agency profile not found" };
    }

    if (existing.owner_id !== data.ownerId) {
      return { success: false, error: "Not allowed to verify this agency" };
    }

    const currentDocs = existing.verification_documents || {};

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

    const shouldUpdateName = data.agencyName && data.agencyName !== existing.name;

    if (shouldUpdateName) {
      await executeQuery(
        `UPDATE agencies SET verification_documents = $1, verification_status = $2, is_verified = $3, name = $4, updated_at = NOW() WHERE id = $5`,
        [
          JSON.stringify(verificationDocuments),
          "under_review",
          false,
          data.agencyName,
          agencyId,
        ],
      );
    } else {
      await executeQuery(
        `UPDATE agencies SET verification_documents = $1, verification_status = $2, is_verified = $3, updated_at = NOW() WHERE id = $4`,
        [
          JSON.stringify(verificationDocuments),
          "under_review",
          false,
          agencyId,
        ],
      );
    }

    const updatedName = data.agencyName && data.agencyName !== existing.name
      ? data.agencyName
      : existing.name || "";

    await notifyAdminOfAgencyVerification({
      name: updatedName,
      id: agencyId,
      ownerId: existing.owner_id || data.ownerId,
      verificationDocuments,
    });

    if (existing.contact_email) {
      await sendVerificationSubmittedEmail(
        existing.contact_email,
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
    } as any,
    totalBookings: Number(row.total_bookings || 0),
    totalReviews: Number(row.total_reviews || 0),
    rating: Number(row.rating || 0),
    totalViews: Number(row.total_views || 0),
    credits: row.credits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } as any;
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
export const getAgenciesCount = getAgenciesCountFromNeon;
export const getFirstAgency = getFirstAgencyFromNeon;
export const getAgencyEscorts = getAgencyEscortsFromNeon;

// ============================================
// EXPORTS
// ============================================
export const getAgencies = getCachedAgencies;
export const getAgenciesCountOptimized = getAgenciesCountFromNeon;
export const getFirstAgencyOptimized = getFirstAgencyFromNeon;
