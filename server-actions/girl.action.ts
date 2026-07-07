// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { unstable_cache } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

// Helper to convert Firestore doc to plain serializable object
function convertDocToEscort(
  doc:
    | FirebaseFirestore.DocumentSnapshot
    | FirebaseFirestore.QueryDocumentSnapshot,
): Escort {
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
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (metadata: any) => metadata.status === "completed" && metadata.cleanedUrl,
  );
}

// Helper to get cleaned image URLs from escort
function getCleanedImageUrls(escort: Escort): string[] {
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
 * This is the actual function that does the work (not cached)
 */
async function fetchEscortById(id: string): Promise<Escort | null> {
  try {
    // ✅ Early validation
    if (!id || id.trim() === "") {
      return null;
    }

    // ✅ Single query
    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    // ✅ Convert to Escort
    const escort = convertDocToEscort(doc);

    // ✅ Fire and forget - increment view count
    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {}); // Silent fail

    // ✅ If no cleaned images, return null
    if (!hasCleanedImages(escort)) {
      return null;
    }

    // ✅ Get cleaned image URLs
    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    // ✅ Return escort with only cleaned images
    return {
      ...escort,
      images: cleanedImages,
      previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
      imagesMetadata: escort.imagesMetadata,
    };
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return null;
  }
}

/**
 * Get a single escort by ID with only cleaned images
 * Returns the escort with images filtered to only cleaned ones
 * Cached for 2 weeks (1209600 seconds)
 */
export const getEscortById = unstable_cache(
  fetchEscortById,
  // Cache key
  ["escort-cleaned"],
  {
    revalidate: 1209600, // 2 weeks in seconds (14 days * 24 hours * 60 minutes * 60 seconds)
    tags: ["escorts", "cleaned-images", "escort-detail"],
  },
);

/**
 * Get a single escort by ID (returns original images, not cleaned)
 * Use this when you need the full escort data with original images
 * Not cached - always fresh
 */
export async function getEscortByIdOriginal(
  id: string,
): Promise<Escort | null> {
  try {
    // ✅ Early validation
    if (!id || id.trim() === "") {
      return null;
    }

    // ✅ Single query
    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    // ✅ Fire and forget - increment view count
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
    return null;
  }
}

/**
 * Get a single escort by ID with cleaned images (returns null if no cleaned images)
 * Alias for getEscortById for clarity
 * Cached for 2 weeks
 */
export const getEscortByIdWithCleanedImages = getEscortById;

/**
 * Get a single escort by ID and also get cleaned images separately
 * Returns both the escort and cleaned images
 * Cached for 2 weeks
 */
export const getEscortByIdWithSeparateCleanedImages = unstable_cache(
  async (
    id: string,
  ): Promise<{ escort: Escort | null; cleanedImages: string[] }> => {
    try {
      // ✅ Early validation
      if (!id || id.trim() === "") {
        return { escort: null, cleanedImages: [] };
      }

      // ✅ Single query
      const doc = await adminDb.collection("escorts").doc(id).get();

      if (!doc.exists) {
        return { escort: null, cleanedImages: [] };
      }

      // ✅ Convert to Escort
      const escort = convertDocToEscort(doc);

      // ✅ Fire and forget - increment view count
      adminDb
        .collection("escorts")
        .doc(id)
        .update({
          totalViews: FieldValue.increment(1),
        })
        .catch(() => {}); // Silent fail

      // ✅ Get cleaned images
      const cleanedImages = getCleanedImageUrls(escort);
      const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

      // ✅ Return both
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
  },
  // Cache key
  ["escort-cleaned-separate"],
  {
    revalidate: 1209600, // 2 weeks
    tags: ["escorts", "cleaned-images", "escort-detail"],
  },
);

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

// Function to manually revalidate escort cache
export async function revalidateEscortCache(id: string) {
  "use server";

  const { revalidateTag } = await import("next/cache");
  for (const tag of ["escorts", "cleaned-images", "escort-detail"]) {
    revalidateTag(tag, undefined as any);
  }

  return { success: true };
}
