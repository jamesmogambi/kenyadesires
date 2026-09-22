// server-actions/agency.action.ts
"use server";

import { revalidatePath } from "next/cache";
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

    await executeQuery(
      `INSERT INTO agencies (
        id, name, slug, description, contact_email, contact_phone, whatsapp_phone, website,
        owner_id, country, county, county_code, region, town, regions, primary_region,
        estate, address, street, postal_code, business_type, categories, opening_hours,
        services, specialties, is_verified, verification_status, verification_documents,
        logo, cover_image, gallery, videos, establishment_year, languages, payment_methods,
        social_media, plan_type, plan_is_active, plan_activated_at, plan_expires_at,
        plan_features, plan_max_employees, plan_max_gallery_images, rating, total_reviews,
        total_bookings, total_views, featured_employees_count, credits, is_active, is_featured,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id,
        utm_source_platform, landing_page, first_touch_at, registration_date,
        created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,
        $25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,
        $47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57,$58,$59,$60,$61,$62,$63,$64,$65,$66,$67,$68,$69,$70,$71,$72,$73,$74,$75,$76,$77,$78,$79,$80,$81,$82,$83,$84,$85,$86,$87,$88,$89,$90,$91,$92,$93,$94,$95,$96,$97,$98,$99,$100,$101,$102,$103,$104,$105,$106,$107,$108,$109,$110,$111,$112,$113,$114,$115,$116,$117,$118,$119,$120,$121,$122,$123,$124,$125,$126,$127,$128,$129,$130,$131,$132,$133,$134,$135,$136,$137,$138,$139,$140,$141,$142,$143,$144,$145,$146,$147
      )`,
      [
        id, data.name, slug, data.description || "", data.contactEmail, data.contactPhone, data.whatsappPhone || "", data.website || "",
        data.ownerId, "Kenya", data.county, data.countyCode || data.county.toLowerCase().replace(/\s+/g, "-"), data.region, data.town,
        data.regions || (data.region ? [data.region] : []), data.primaryRegion || data.region,
        data.estate || "", data.address || "", data.street || "", data.postalCode || "",
        data.businessType || "agency", data.categories || [], JSON.stringify({
          monday: "9:00 AM - 6:00 PM", tuesday: "9:00 AM - 6:00 PM", wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM", friday: "9:00 AM - 6:00 PM", saturday: "9:00 AM - 6:00 PM", sunday: "Closed",
        }),
        data.services || [], data.specialties || [], false, "pending", data.verificationDocuments || null,
        data.logo || "", data.coverImage || "", data.gallery || [], data.videos || [],
        data.establishmentYear || null, data.languages?.length ? data.languages : ["English"], data.paymentMethods?.length ? data.paymentMethods : ["Cash", "M-Pesa"],
        socialMedia ? JSON.stringify(socialMedia) : null, planType, true, now.toISOString(), null,
        JSON.stringify([]), PLAN_LIMITS[planType].maxEmployees, PLAN_LIMITS[planType].maxGalleryImages, 0, 0, 0, 0, 0,
        true, false,
        data.utm_source, data.utm_medium, data.utm_campaign, data.utm_content, data.utm_term, data.utm_id,
        data.utm_source_platform, data.landing_page, data.first_touch_at, data.registration_date || now.toISOString(),
        now.toISOString(), now.toISOString(),
      ],
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

    const existing = rows[0];

    if (!existing) {
      return { success: false, error: "Agency profile not found" };
    }

    if (existing.owner_id !== data.ownerId) {
      return {
        success: false,
        error: "You are not allowed to edit this agency",
      };
    }

    const { ownerId, planType, openingHours, socialMedia, ...rest } = data;
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

    if (planType) {
      updateData.plan_type = planType;
      updateData.plan_max_employees = PLAN_LIMITS[planType]?.maxEmployees;
      updateData.plan_max_gallery_images = PLAN_LIMITS[planType]?.maxGalleryImages;
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
    const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(", ");

    await executeQuery(
      `UPDATE agencies SET ${setClause} WHERE id = $${columns.length + 1}`,
      [...values, id],
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

    await executeQuery(
      `UPDATE agencies SET verification_documents = $1, verification_status = $2, is_verified = $3, updated_at = NOW()${data.agencyName && data.agencyName !== existing.name ? ", name = $" + (data.agencyName ? "4" : "3") : ""} WHERE id = $${data.agencyName && data.agencyName !== existing.name ? "5" : "4"}`,
      [
        JSON.stringify(verificationDocuments),
        "under_review",
        false,
        ...(data.agencyName && data.agencyName !== existing.name ? [data.agencyName] : []),
        agencyId,
      ],
    );

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
