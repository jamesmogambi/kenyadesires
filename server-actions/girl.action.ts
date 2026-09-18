"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { slugify } from "@/lib/utils";
import { executeQuery } from "@/lib/neon";
import { sql } from "@/app/lib/db";
import {
  Escort,
  GetEscortsParams,
  GetEscortsResponse,
  convertQueryDocToEscort,
} from "./escort.action";
import {
  sendWelcomeEmail,
  sendAdminNotificationEmail,
  sendVerificationSubmittedEmail,
  sendVerificationNotificationEmail,
} from "./email";
import {
  awardAccountCreationCredits,
  checkAndAwardProfileCompletion,
  awardVerificationCredits,
} from "./credit-rewards.action";

async function fetchEscortByIdInternal(id: string): Promise<Escort | null> {
  try {
    if (!id || id.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE id = ${id}
    `;
    if (!rows || rows.length === 0) return null;

    let escort = await convertQueryDocToEscort(rows[0]);

    await executeQuery(
      "UPDATE escorts SET total_views = total_views + 1 WHERE id = $1",
      [id],
    ).catch(() => {});

    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      return escort;
    }

    if (!escort.imagesMetadata) {
      return escort;
    }

    const metadata = escort.imagesMetadata;
    for (const key of Object.keys(metadata)) {
      const m = metadata[key];
      if (m?.status === "completed" && (m.cleanedUrl || m.cloudinaryUrl)) {
        escort = {
          ...escort,
          images: [m.cleanedUrl || m.cloudinaryUrl],
          previewPhoto: m.cleanedUrl || m.cloudinaryUrl || escort.previewPhoto,
        };
        break;
      }
    }

    return escort;
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return null;
  }
}

async function fetchEscortBySlugInternal(
  slug: string,
): Promise<Escort | null> {
  try {
    if (!slug || slug.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE slug = ${slug} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    const doc = rows[0];
    let escort = await convertQueryDocToEscort(doc);

    await executeQuery(
      "UPDATE escorts SET total_views = total_views + 1 WHERE id = $1",
      [doc.id],
    ).catch(() => {});

    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      return escort;
    }
    if (!escort.imagesMetadata) return escort;

    const previewMetadata = escort.imagesMetadata[escort.previewPhoto];
    if (previewMetadata?.status === "completed") {
      escort = {
        ...escort,
        previewPhoto:
          previewMetadata.cleanedUrl ||
          previewMetadata.cloudinaryUrl ||
          escort.previewPhoto,
      };
    }

    return escort;
  } catch (error) {
    console.error("Error fetching escort by slug:", error);
    return null;
  }
}

async function fetchEscortByUsernameInternal(
  username: string,
): Promise<Escort | null> {
  try {
    if (!username || username.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE username = ${username} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    const doc = rows[0];
    let escort = await convertQueryDocToEscort(doc);

    await executeQuery(
      "UPDATE escorts SET total_views = total_views + 1 WHERE id = $1",
      [doc.id],
    ).catch(() => {});

    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      return escort;
    }
    if (!escort.imagesMetadata) return escort;

    const previewMetadata = escort.imagesMetadata[escort.previewPhoto];
    if (previewMetadata?.status === "completed") {
      escort = {
        ...escort,
        previewPhoto:
          previewMetadata.cleanedUrl ||
          previewMetadata.cloudinaryUrl ||
          escort.previewPhoto,
      };
    }

    return escort;
  } catch (error) {
    console.error("Error fetching escort by username:", error);
    return null;
  }
}

export async function getEscortByIdentifier(
  identifier: string,
): Promise<Escort | null> {
  if (!identifier || identifier.trim() === "") return null;
  let escort = await getEscortById(identifier);
  if (escort) return escort;
  escort = await getEscortBySlug(identifier);
  if (escort) return escort;
  escort = await getEscortByUsername(identifier);
  if (escort) return escort;
  return null;
}

export async function getEscortByClerkUserId(
  clerkUserId: string,
): Promise<Escort | null> {
  try {
    if (!clerkUserId || clerkUserId.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE clerk_user_id = ${clerkUserId} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    return await convertQueryDocToEscort(rows[0]);
  } catch (error) {
    console.error("Error fetching escort by clerkUserId:", error);
    return null;
  }
}

export async function getEscortByEmail(
  email: string,
): Promise<Escort | null> {
  try {
    if (!email || email.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE email = ${email} LIMIT 1
    `;
    if (!rows || rows.length === 0) return null;

    return await convertQueryDocToEscort(rows[0]);
  } catch (error) {
    console.error("Error fetching escort by email:", error);
    return null;
  }
}

export const getEscortById = fetchEscortByIdInternal;

export const getEscortBySlug = fetchEscortBySlugInternal;

export const getEscortByUsername = fetchEscortByUsernameInternal;

export const getEscortByIdWithCleanedImages = fetchEscortByIdInternal;

export async function getEscortByIdOriginal(
  id: string,
): Promise<Escort | null> {
  try {
    if (!id || id.trim() === "") return null;

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE id = ${id}
    `;
    if (!rows || rows.length === 0) return null;

    await executeQuery(
      "UPDATE escorts SET total_views = total_views + 1 WHERE id = $1",
      [id],
    ).catch(() => {});

    return await convertQueryDocToEscort(rows[0]);
  } catch (error) {
    console.error("Error fetching escort:", error);
    return null;
  }
}

export async function getEscortByIdWithSeparateCleanedImages(
  id: string,
): Promise<{ escort: Escort | null; cleanedImages: string[] }> {
  try {
    if (!id || id.trim() === "") {
      return { escort: null, cleanedImages: [] };
    }

    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE id = ${id}
    `;
    if (!rows || rows.length === 0) {
      return { escort: null, cleanedImages: [] };
    }

    const escort = await convertQueryDocToEscort(rows[0]);

    await executeQuery(
      "UPDATE escorts SET total_views = total_views + 1 WHERE id = $1",
      [id],
    ).catch(() => {});

    const cleanedImages: string[] = [];
    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      cleanedImages.push(...escort.cleanedImages);
    } else if (escort.imagesMetadata) {
      for (const key of Object.keys(escort.imagesMetadata)) {
        const m = escort.imagesMetadata[key];
        if (m?.status === "completed" && (m.cleanedUrl || m.cloudinaryUrl)) {
          cleanedImages.push(m.cleanedUrl || m.cloudinaryUrl);
        }
      }
    }

    return {
      escort: {
        ...escort,
        images: cleanedImages.length > 0 ? cleanedImages : escort.images,
        previewPhoto:
          cleanedImages[0] || escort.previewPhoto,
      },
      cleanedImages,
    };
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return { escort: null, cleanedImages: [] };
  }
}

export async function getCleanedImagesForEscort(
  escortId: string,
): Promise<string[]> {
  try {
    const rows: any[] = await sql`
      SELECT cleaned_images, images_metadata FROM escorts WHERE id = ${escortId}
    `;
    if (!rows || rows.length === 0) return [];

    const row = rows[0];
    const cleanedImages: string[] = row.cleaned_images || [];
    if (cleanedImages.length > 0) return cleanedImages;

    const metadata: Record<string, any> = row.images_metadata || {};
    const urls: string[] = [];
    for (const key of Object.keys(metadata)) {
      const m = metadata[key];
      if (m?.status === "completed" && (m.cleanedUrl || m.cloudinaryUrl)) {
        urls.push(m.cleanedUrl || m.cloudinaryUrl);
      }
    }
    return urls;
  } catch (error) {
    console.error("Error fetching cleaned images:", error);
    return [];
  }
}

export async function getCleanedImagesCountForEscort(
  escortId: string,
): Promise<number> {
  const images = await getCleanedImagesForEscort(escortId);
  return images.length;
}

export async function hasEscortCleanedImages(
  escortId: string,
): Promise<boolean> {
  const count = await getCleanedImagesCountForEscort(escortId);
  return count > 0;
}

export async function revalidateEscortCache(id: string) {
  revalidateTag("escorts", {});
  revalidateTag("cleaned-images", {});
  revalidateTag("escort-detail", {});
  revalidateTag("escort-cleaned-id", {});
  revalidateTag("escort-cleaned-slug", {});
  revalidateTag("escort-cleaned-username", {});
  revalidateTag("escort-cleaned-separate", {});

  return { success: true };
}

export interface NewEscortProfileInput {
  id?: string;
  name: string;
  email: string;
  street: string;
  phone: string;
  whatsappNumber: string;
  region: string;
  towns: string[];
  county: string;
  regions?: string[];
  nationality: string;
  age: string;
  height: string;
  breasts: string;
  weight: string;
  ageCategory?: string;
  character: string;
  hairColor: string;
  experience: string;
  about: string;
  previewPhoto: string;
  images: string[];
  videos?: string[];
  telephone: string;
  whatsappPhone: string;
  availability: string[];
  languages: string[];
  practices: string[];
  bdsm: string[];
  massages: string[];
  extraServices: string[];
  categories: string[];
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  bustSize?: string;
  clerkUserId?: string;
  agencyId?: string;
  isAgencyOwned?: boolean;
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

export async function saveNewEscortProfile(
  data: NewEscortProfileInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date();
    const baseUsername = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .substring(0, 20);
    const timestamp = Date.now().toString().slice(-6);
    const username = `${baseUsername}_${timestamp}`;
    const phoneSuffix = (data.phone || data.whatsappNumber || "")
      .replace(/\D/g, "")
      .slice(-6);
    const slug = `${slugify(data.name)}-${phoneSuffix}`;

    const id = data.id || crypto.randomUUID();

    const columns: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const addField = (column: string, value: any) => {
      if (value === undefined) return;
      columns.push(column);
      values.push(value);
      paramIndex++;
    };

    addField("id", id);
    addField("clerk_user_id", data.clerkUserId || "");
    addField("name", data.name);
    addField("username", username);
    addField("slug", slug);
    addField("email", data.email);
    addField("preview_photo", data.previewPhoto || "");
    addField("telephone", data.telephone || data.phone || "");
    addField("whatsapp_phone", data.whatsappPhone || data.whatsappNumber || "");
    addField("about", data.about || "");
    addField("availability", data.availability || []);
    addField("nationality", data.nationality || "");
    addField("bust_size", data.bustSize || data.breasts || "");
    addField("weight", data.weight || "");
    addField("gender", "girl");
    addField("languages", data.languages || []);
    addField("regions", data.regions && data.regions.length > 0 ? data.regions : data.region ? [data.region] : []);
    addField("practices", data.practices || []);
    addField("bdsm", data.bdsm || []);
    addField("massage", data.massages || []);
    addField("extra_services", data.extraServices || []);
    addField("categories", data.categories || []);
    addField("role", "escort");
    addField("opening_hours", data.openingHours || {});
    addField("age_category", data.ageCategory || "");
    addField("character", data.character || "");
    addField("hair_color", data.hairColor || "");
    addField("experience", data.experience || "");
    addField("age", data.age || "");
    addField("street", data.street || "");
    addField("images", data.images || []);
    addField("videos", []);
    addField("country", "Kenya");
    addField("county", data.county || "");
    addField("county_code", "");
    addField("primary_region", data.region || "");
    addField("locations", []);
    addField("source", "admin");
    addField("work_type", data.isAgencyOwned ? "agency" : "independent");
    addField("agency_id", data.agencyId || "");
    addField("is_agency_featured", false);
    addField("is_active", true);
    addField("is_verified", false);
    addField("is_featured", false);
    addField("plan_type", "basic");
    addField("plan_is_active", true);
    addField("plan_features", []);
    addField("total_bookings", 0);
    addField("total_reviews", 0);
    addField("rating", 0);
    addField("total_views", 0);
    addField("credits", 10);
    addField("created_at", now);
    addField("updated_at", now);
    addField("has_cleaned_images", false);
    addField("utm_source", data.utm_source);
    addField("utm_medium", data.utm_medium);
    addField("utm_campaign", data.utm_campaign);
    addField("utm_content", data.utm_content);
    addField("utm_term", data.utm_term);
    addField("utm_id", data.utm_id);
    addField("utm_source_platform", data.utm_source_platform);
    addField("landing_page", data.landing_page);
    addField("first_touch_at", data.first_touch_at);
    addField("registration_date", data.registration_date || now.toISOString());

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const query = `INSERT INTO escorts (${columns.join(", ")}) VALUES (${placeholders})`;

    await executeQuery(query, values);

    if (data.clerkUserId) {
      await awardAccountCreationCredits(
        data.clerkUserId,
        data.email,
        data.telephone || data.whatsappNumber || "",
        "escort",
        id,
      );
    } else {
      await awardAccountCreationCredits(
        id,
        data.email,
        data.telephone || data.whatsappNumber || "",
        "escort",
        id,
      );
    }

    const escortClerkUserId = data.clerkUserId || id;
    await checkAndAwardProfileCompletion(
      escortClerkUserId,
      {
        name: data.name,
        email: data.email,
        previewPhoto: data.previewPhoto,
        about: data.about,
        county: data.county,
        primaryRegion: data.region,
        age: data.age,
        images: data.images,
        categories: data.categories,
        languages: data.languages,
      },
      "escort",
      id,
    );

    if (data.email) {
      await sendWelcomeEmail(data.email, data.name, "user", 10);
    }

    await sendAdminNotificationEmail(
      data.name,
      data.email || "",
      "user",
      data.clerkUserId || "",
    );

    return { success: true, id };
  } catch (error) {
    console.error("Error saving escort profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save profile",
    };
  }
}

export interface EscortVerificationInput {
  escortId: string;
  fullName: string;
  idFront?: string;
  idBack?: string;
  selfie?: string;
}

export async function submitEscortVerification(
  data: EscortVerificationInput,
): Promise<{ success: boolean; error?: string }> {
  try {
    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE id = ${data.escortId}
    `;
    if (!rows || rows.length === 0) {
      return { success: false, error: "Profile not found" };
    }

    const existing = rows[0];
    const currentDocs = existing.verification_documents || {};

    const verificationDocuments = {
      ...currentDocs,
      id_proof: data.idFront || currentDocs.id_proof || "",
      id_back: data.idBack || currentDocs.id_back || "",
      selfie_with_id: data.selfie || currentDocs.selfie_with_id || "",
    };

    const hasAnyDoc =
      verificationDocuments.id_proof ||
      verificationDocuments.id_back ||
      verificationDocuments.selfie_with_id;

    if (!hasAnyDoc) {
      return { success: false, error: "Please upload at least one document" };
    }

    await executeQuery(
      `UPDATE escorts SET
        verification_documents = $${1},
        verification_status = $${2},
        is_verified = $${3},
        updated_at = NOW()
      WHERE id = $${4}`,
      [
        verificationDocuments,
        "pending",
        false,
        data.escortId,
      ],
    );

    const email = existing.email;
    if (email) {
      await sendVerificationSubmittedEmail(
        email,
        data.fullName || existing.name || "User",
        "escort",
      );
    }

    await sendAdminNotificationEmail(
      data.fullName || existing.name || "Escort",
      email || "",
      "escort",
      existing.clerk_user_id || data.escortId,
    );

    revalidatePath(`/girl/${existing.slug}`);
    revalidatePath(`/girl/${data.escortId}`);

    return { success: true };
  } catch (error) {
    console.error("Error submitting escort verification:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to submit escort verification",
    };
  }
}
