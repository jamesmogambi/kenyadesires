// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";
import { slugify } from "@/lib/utils";
import {
  sendWelcomeEmail,
  sendAdminNotificationEmail,
  sendVerificationNotificationEmail,
  sendVerificationSubmittedEmail,
} from "./email";
import {
  awardAccountCreationCredits,
  checkAndAwardProfileCompletion,
  awardVerificationCredits,
} from "./credit-rewards.action";

// Helper to convert Firestore doc to plain serializable object
function convertDocToEscort(
  doc:
    | FirebaseFirestore.DocumentSnapshot
    | FirebaseFirestore.QueryDocumentSnapshot,
): any {
  const data = (doc.data() || {}) as { [key: string]: any };

  const convertTimestamp = (value: any): any => {
    if (!value) return value;
    if (value.toDate && typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (Array.isArray(value)) {
      return value.map(convertTimestamp);
    }
    if (value && typeof value === "object") {
      const result: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = convertTimestamp(value[key]);
        }
      }
      return result;
    }
    return value;
  };

  const convertedData = convertTimestamp(data);

  return {
    id: doc.id,
    ...convertedData,
  } as Escort;
}

// Fast conversion for single documents (without deep timestamp conversion)
function convertDocToEscortFast(
  doc: FirebaseFirestore.DocumentSnapshot,
): Escort {
  const data = doc.data() || {};
  return {
    id: doc.id,
    ...data,
  } as Escort;
}

// Helper to check if escort has cleaned images
function hasCleanedImages(escort: Escort): boolean {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) return true;
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (metadata: any) => metadata.status === "completed" && metadata.cleanedUrl,
  );
}

// Helper to get cleaned image URLs from escort
function getCleanedImageUrls(escort: Escort): string[] {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) {
    return escort.cleanedImages;
  }

  if (!escort.imagesMetadata) return [];

  const cleanedUrls: string[] = [];
  Object.values(escort.imagesMetadata).forEach((metadata: any) => {
    if (metadata.status === "completed" && metadata.cleanedUrl) {
      cleanedUrls.push(metadata.cleanedUrl);
    }
  });
  return cleanedUrls;
}

// Helper to get cleaned preview photo
function getCleanedPreviewPhoto(escort: Escort): string | undefined {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) {
    // Use the first cleaned image as preview if available
    return escort.cleanedImages[0];
  }

  if (!escort.imagesMetadata || !escort.previewPhoto)
    return escort.previewPhoto;

  const previewMetadata = escort.imagesMetadata[escort.previewPhoto];
  if (previewMetadata?.status === "completed" && previewMetadata?.cleanedUrl) {
    return previewMetadata.cleanedUrl;
  }
  return escort.previewPhoto;
}

/**
 * Internal function that fetches escort by ID with cleaned images
 */
async function fetchEscortById(id: string): Promise<Escort | null> {
  try {
    if (!id || id.trim() === "") {
      return null;
    }

    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const escort = convertDocToEscort(doc);

    // Fire and forget - increment view count
    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    return {
      ...escort,
      images: cleanedImages.length > 0 ? cleanedImages : escort.images,
      previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
      imagesMetadata: escort.imagesMetadata,
    };
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return null;
  }
}

/**
 * Internal function that fetches escort by Slug
 */
async function fetchEscortBySlug(slug: string): Promise<Escort | null> {
  try {
    if (!slug || slug.trim() === "") {
      return null;
    }

    const snapshot = await adminDb
      .collection("escorts")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

const doc = snapshot.docs[0];
    const escort = convertDocToEscort(doc);

    // Fire and forget - increment view count
    adminDb
      .collection("escorts")
      .doc(doc.id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    return {
      ...escort,
      images: cleanedImages.length > 0 ? cleanedImages : escort.images,
      previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
      imagesMetadata: escort.imagesMetadata,
    };
  } catch (error) {
    console.error("Error fetching escort by slug:", error);
    return null;
  }
};

/**
 * Internal function that fetches escort by Username
 */
async function fetchEscortByUsername(username: string): Promise<Escort | null> {
  try {
    if (!username || username.trim() === "") {
      return null;
    }

    const snapshot = await adminDb
      .collection("escorts")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

const doc = snapshot.docs[0];
    const escort = convertDocToEscort(doc);

    // Fire and forget - increment view count
    adminDb
      .collection("escorts")
      .doc(doc.id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    return {
      ...escort,
      images: cleanedImages.length > 0 ? cleanedImages : escort.images,
      previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
      imagesMetadata: escort.imagesMetadata,
    };
  } catch (error) {
    console.error("Error fetching escort by username:", error);
    return null;
  }
};

/**
 * Get a single escort by any identifier (ID, Slug, or Username)
 * Tries ID first, then Slug, then Username
 */
export async function getEscortByIdentifier(
  identifier: string,
): Promise<Escort | null> {
  if (!identifier || identifier.trim() === "") {
    return null;
  }

  // Try by ID first
  let escort = await getEscortById(identifier);
  if (escort) return escort;

  // Try by Slug
  escort = await getEscortBySlug(identifier);
  if (escort) return escort;

  // Try by Username
  escort = await getEscortByUsername(identifier);
  if (escort) return escort;

  return null;
}

/**
 * Get escort by Clerk user ID
 */
export async function getEscortByClerkUserId(
  clerkUserId: string,
): Promise<Escort | null> {
  try {
    if (!clerkUserId || clerkUserId.trim() === "") {
      return null;
    }

    const snapshot = await adminDb
      .collection("escorts")
      .where("clerkUserId", "==", clerkUserId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return convertDocToEscort(snapshot.docs[0]);
  } catch (error) {
    console.error("Error fetching escort by clerkUserId:", error);
    return null;
  }
}

/**
 * Get escort by email address
 */
export async function getEscortByEmail(
  email: string,
): Promise<Escort | null> {
  try {
    if (!email || email.trim() === "") {
      return null;
    }

    const snapshot = await adminDb
      .collection("escorts")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return convertDocToEscort(snapshot.docs[0]);
  } catch (error) {
    console.error("Error fetching escort by email:", error);
    return null;
  }
}

export const getEscortById = fetchEscortById;

/**
 * Get a single escort by Slug with only cleaned images
 */
export const getEscortBySlug = fetchEscortBySlug;

/**
 * Get a single escort by Username with only cleaned images
 */
export const getEscortByUsername = fetchEscortByUsername;

/**
 * Get a single escort by ID with cleaned images (returns null if no cleaned images)
 * Alias for getEscortById for clarity
 */
export const getEscortByIdWithCleanedImages = getEscortById;

/**
 * Get a single escort by ID (returns original images, not cleaned)
 * Not cached - always fresh
 */
export async function getEscortByIdOriginal(
  id: string,
): Promise<Escort | null> {
  try {
    if (!id || id.trim() === "") {
      return null;
    }

    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    return convertDocToEscortFast(doc);
  } catch (error) {
    console.error("Error fetching escort:", error);
    return null;
  }
}

/**
 * Get a single escort by ID and also get cleaned images separately
 */
export async function getEscortByIdWithSeparateCleanedImages(
  id: string,
): Promise<{ escort: Escort | null; cleanedImages: string[] }> {
  try {
    if (!id || id.trim() === "") {
      return { escort: null, cleanedImages: [] };
    }

    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return { escort: null, cleanedImages: [] };
    }

    const escort = convertDocToEscort(doc);

    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    return {
      escort: {
        ...escort,
        images: cleanedImages,
        previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
      },
      cleanedImages,
    };
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return { escort: null, cleanedImages: [] };
  }
}

/**
 * Get cleaned images for a specific escort
 * Not cached - always fresh
 */
export async function getCleanedImagesForEscort(
  escortId: string,
): Promise<string[]> {
  try {
    const doc = await adminDb.collection("escorts").doc(escortId).get();

    if (!doc.exists) {
      return [];
    }

    const escort = convertDocToEscort(doc);

    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      return escort.cleanedImages;
    }

    if (!escort.imagesMetadata) {
      return [];
    }

    const cleanedImages = Object.values(escort.imagesMetadata)
      .filter(
        (metadata: any) =>
          metadata.status === "completed" && metadata.cleanedUrl,
      )
      .map((metadata: any) => metadata.cleanedUrl!);

    return cleanedImages;
  } catch (error) {
    console.error("Error fetching cleaned images:", error);
    return [];
  }
}

/**
 * Get count of cleaned images for a specific escort
 * Not cached - always fresh
 */
export async function getCleanedImagesCountForEscort(
  escortId: string,
): Promise<number> {
  try {
    const images = await getCleanedImagesForEscort(escortId);
    return images.length;
  } catch (error) {
    console.error("Error fetching cleaned images count:", error);
    return 0;
  }
}

/**
 * Check if an escort has cleaned images
 * Not cached - always fresh
 */
export async function hasEscortCleanedImages(
  escortId: string,
): Promise<boolean> {
  try {
    const count = await getCleanedImagesCountForEscort(escortId);
    return count > 0;
  } catch (error) {
    console.error("Error checking cleaned images:", error);
    return false;
  }
}

/**
 * Manually revalidate escort cache
 */
export async function revalidateEscortCache(id: string) {
  "use server";

  const { revalidateTag } = await import("next/cache");
  // revalidateTag requires two arguments in this Next.js version: tag and options.
  // Provide an empty options object to satisfy the type.
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

    const docRef = adminDb.collection("escorts").doc();

    const newEscort: Escort = {
      id: docRef.id,
      name: data.name,
      username,
      slug,
      email: data.email,
      previewPhoto: data.previewPhoto || "",
      telephone: data.telephone || data.phone || "",
      whatsappPhone: data.whatsappPhone || data.whatsappNumber || "",
      about: data.about || "",
      availability: data.availability || [],
      nationality: data.nationality || "",
      bustSize: data.bustSize || data.breasts || "",
      breastSize: data.bustSize || data.breasts || "",
      languages: data.languages || [],
      regions: (data.regions && data.regions.length > 0)
        ? data.regions
        : (data.region ? [data.region] : []),
      practices: data.practices || [],
      bdsm: data.bdsm || [],
      massage: data.massages || [],
      extraServices: data.extraServices || [],
      categories: data.categories || [],
      role: "escort",
      openingHours: data.openingHours || {},
      ageCategory: data.ageCategory || "",
      character: data.character || "",
      hairColor: data.hairColor || "",
      experience: data.experience || "",
      age: data.age || "",
      weight: data.weight || "",
      street: data.street || "",
      images: data.images || [],
      videos: [],
      labels: [],
      ethnicity: "",
      zodiacSign: "",
      sexualOrientation: "",
      gender: "girl",
      country: "Kenya",
      county: data.county || "",
      countyCode: "",
      primaryRegion: data.region || "",
      locations: [],
      source: "admin",
      workType: data.isAgencyOwned ? "agency" : "independent",
      agencyId: data.agencyId || "",
      isAgencyOwned: data.isAgencyOwned || false,
      clerkUserId: data.clerkUserId || "",
      isAgencyFeatured: false,
      isActive: true,
      isVerified: false,
      isFeatured: false,
      plan: {
        type: "basic",
        isActive: true,
        features: [],
      },
      
      totalBookings: 0,
      totalReviews: 0,
      rating: 0,
      totalViews: 0,
      credits: 10,
      createdAt: now,
      updatedAt: now,
      cleaningHistory: [],
      hasCleanedImages: false,
      rates: [],
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

    await docRef.set(newEscort);

    // Award Milestone 1 — Create Account (10 credits)
    // Check first if already awarded to avoid double-counting from the
    // inline credits: 10 above. The reward system is the source of truth.
    if (data.clerkUserId) {
      await awardAccountCreationCredits(
        data.clerkUserId,
        data.email,
        data.telephone || data.whatsappNumber || "",
        "escort",
        docRef.id,
      );
    } else {
      await awardAccountCreationCredits(
        docRef.id,
        data.email,
        data.telephone || data.whatsappNumber || "",
        "escort",
        docRef.id,
      );
    }

    // Award Milestone 2 — Complete Profile (20 credits) if threshold met
    const escortClerkUserId = data.clerkUserId || docRef.id;
    await checkAndAwardProfileCompletion(
      escortClerkUserId,
      {
        name: newEscort.name,
        email: newEscort.email,
        previewPhoto: newEscort.previewPhoto,
        about: newEscort.about,
        county: newEscort.county,
        primaryRegion: newEscort.primaryRegion,
        age: newEscort.age,
        images: newEscort.images,
        categories: newEscort.categories,
        languages: newEscort.languages,
      },
      "escort",
      docRef.id,
    );

    // Send welcome email to the new escort
    if (data.email) {
      await sendWelcomeEmail(data.email, data.name, "user", 10);
    }

    // Notify admin of new registration
    await sendAdminNotificationEmail(
      data.name,
      data.email || "",
      "user",
      data.clerkUserId || "",
    );

    return {
      success: true,
      id: docRef.id,
    };
  } catch (error) {
    console.error("Error saving escort profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save profile",
    };
  }
}

// ============================================
// ESCORT IDENTITY VERIFICATION DOCUMENTS
// ============================================
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
    const docRef = adminDb.collection("escorts").doc(data.escortId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return { success: false, error: "Profile not found" };
    }

    const existing = snapshot.data() || {};
    const currentDocs = existing.verificationDocuments || {};

    const verificationDocuments = {
      ...currentDocs,
      idProof: data.idFront || currentDocs.idProof || "",
      idBack: data.idBack || currentDocs.idBack || "",
      selfieWithId: data.selfie || currentDocs.selfieWithId || "",
    };

    const hasAnyDoc =
      verificationDocuments.idProof ||
      verificationDocuments.idBack ||
      verificationDocuments.selfieWithId;

    if (!hasAnyDoc) {
      return { success: false, error: "Please upload at least one document" };
    }

    await docRef.update({
      verificationDocuments,
      verificationStatus: "pending",
      isVerified: false,
      updatedAt: new Date(),
    });

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
      existing.clerkUserId || data.escortId,
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
