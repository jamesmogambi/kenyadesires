// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { unstable_cache } from "next/cache";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

// Helper to convert Firestore doc to plain serializable object
function convertDocToEscort(
  doc:
    | FirebaseFirestore.DocumentSnapshot
    | FirebaseFirestore.QueryDocumentSnapshot,
): Escort {
  const data = (doc.data() || {}) as { [key: string]: any };

  // Helper to convert Timestamp to ISO string
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

// Internal function that does the actual fetching
async function fetchEscortsWithCleanedImages(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      county,
      region,
      town,
      estate,
      practice,
      practices,
      category,
      categories,
      nationality,
      minAge,
      maxAge,
      isActive = true,
      isVerified,
      isFeatured,
      search,
      minRating,
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
      "age",
      "totalViews",
      "rating",
      "totalBookings",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.orderBy(sortField, sortOrder);

    // ✅ IMPORTANT: Get ALL documents (no limit) to properly filter for cleaned images
    const allDocsSnapshot = await query.get();

    // ✅ Convert ALL data
    let allEscorts: Escort[] = allDocsSnapshot.docs.map(convertDocToEscort);

    // ✅ Filter: Only escorts with cleaned images
    let escortsWithCleanedImages = allEscorts.filter((escort) => {
      if (!escort.imagesMetadata) return false;

      const hasCleanedImages = Object.values(escort.imagesMetadata).some(
        (metadata: any) =>
          metadata.status === "completed" && metadata.cleanedUrl,
      );

      return hasCleanedImages;
    });

    // ✅ Apply additional filters client-side
    if (region && region !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.regions?.includes(region),
      );
    }

    if (town && town !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.locations?.some((loc) => loc.town === town),
      );
    }

    if (estate && estate !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.locations?.some((loc) => loc.estate === estate),
      );
    }

    if (practice && practice !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.practices?.includes(practice),
      );
    }

    if (practices && practices.length > 0) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        practices.some((p) => e.practices?.includes(p)),
      );
    }

    if (category && category !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.categories?.includes(category),
      );
    }

    if (categories && categories.length > 0) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        categories.some((c) => e.categories?.includes(c)),
      );
    }

    if (nationality && nationality !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => e.nationality === nationality,
      );
    }

    if (minAge) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => parseInt(e.age) >= minAge,
      );
    }

    if (maxAge) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => parseInt(e.age) <= maxAge,
      );
    }

    if (minRating) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => (e.rating || 0) >= minRating,
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchLower) ||
          e.username?.toLowerCase().includes(searchLower) ||
          e.about?.toLowerCase().includes(searchLower),
      );
    }

    // ✅ Total count (all escorts with cleaned images that match filters)
    const total = escortsWithCleanedImages.length;

    // ✅ Apply pagination
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = Math.min(startIndex + validLimit, total);
    const paginatedEscorts = escortsWithCleanedImages.slice(
      startIndex,
      endIndex,
    );

    return {
      escorts: paginatedEscorts,
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: endIndex < total,
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

// ✅ Cached version - 1 week
export const getEscortsWithCleanedImages = unstable_cache(
  fetchEscortsWithCleanedImages /** cast to any to satisfy unstable_cache typings */,
  // Cache key based on params
  ((params: GetEscortsParams) => {
    const p = params || {};
    return [
      "escorts-cleaned",
      String(p.page || 1),
      String(p.limit || 20),
      String(p.county || "all"),
      String(p.region || "all"),
      String(p.town || "all"),
      String(p.estate || "all"),
      String(p.practice || "all"),
      String(p.practices?.join(",") || "all"),
      String(p.category || "all"),
      String(p.categories?.join(",") || "all"),
      String(p.nationality || "all"),
      String(p.minAge || "all"),
      String(p.maxAge || "all"),
      String(p.isActive?.toString() || "true"),
      String(p.isVerified?.toString() || "all"),
      String(p.isFeatured?.toString() || "all"),
      String(p.search || "all"),
      String(p.minRating || "all"),
      String(p.sortBy || "createdAt"),
      String(p.sortOrder || "desc"),
    ];
  }) as any,
  {
    revalidate: 604800, // 1 week in seconds
    tags: ["escorts", "cleaned-images"],
  },
);

// Internal function for practices
async function fetchPracticesFromCleanedEscorts(
  params: Omit<
    GetEscortsParams,
    "practice" | "practices" | "page" | "limit"
  > = {},
): Promise<{ practice: string; count: number }[]> {
  try {
    const {
      county,
      region,
      town,
      estate,
      category,
      categories,
      nationality,
      minAge,
      maxAge,
      isActive = true,
      isVerified,
      isFeatured,
      search,
      minRating,
    } = params;

    // ✅ Build query to get all escorts with the base filters
    let query: FirebaseFirestore.Query = adminDb.collection("escorts");

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

    // ✅ Get ALL documents
    const allDocsSnapshot = await query.get();

    // ✅ Convert ALL data
    let allEscorts: Escort[] = allDocsSnapshot.docs.map(convertDocToEscort);

    // ✅ Filter: Only escorts with cleaned images
    let escortsWithCleanedImages = allEscorts.filter((escort) => {
      if (!escort.imagesMetadata) return false;

      const hasCleanedImages = Object.values(escort.imagesMetadata).some(
        (metadata: any) =>
          metadata.status === "completed" && metadata.cleanedUrl,
      );

      return hasCleanedImages;
    });

    // ✅ Apply additional filters (same as main function)
    if (region && region !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.regions?.includes(region),
      );
    }

    if (town && town !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.locations?.some((loc) => loc.town === town),
      );
    }

    if (estate && estate !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.locations?.some((loc) => loc.estate === estate),
      );
    }

    if (category && category !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        e.categories?.includes(category),
      );
    }

    if (categories && categories.length > 0) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter((e) =>
        categories.some((c) => e.categories?.includes(c)),
      );
    }

    if (nationality && nationality !== "all") {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => e.nationality === nationality,
      );
    }

    if (minAge) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => parseInt(e.age) >= minAge,
      );
    }

    if (maxAge) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => parseInt(e.age) <= maxAge,
      );
    }

    if (minRating) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) => (e.rating || 0) >= minRating,
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (e) =>
          e.name?.toLowerCase().includes(searchLower) ||
          e.username?.toLowerCase().includes(searchLower) ||
          e.about?.toLowerCase().includes(searchLower),
      );
    }

    // ✅ Extract and count all practices
    const practiceCounts: Record<string, number> = {};

    escortsWithCleanedImages.forEach((escort) => {
      if (escort.practices && Array.isArray(escort.practices)) {
        escort.practices.forEach((practice) => {
          if (practice) {
            practiceCounts[practice] = (practiceCounts[practice] || 0) + 1;
          }
        });
      }
    });

    // ✅ Convert to array and sort by count (descending) or alphabetically
    const result = Object.entries(practiceCounts)
      .map(([practice, count]) => ({ practice, count }))
      .sort((a, b) => {
        // Sort by count descending first
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        // If counts are equal, sort alphabetically
        return a.practice.localeCompare(b.practice);
      });

    return result;
  } catch (error) {
    console.error("Error fetching practices from cleaned escorts:", error);
    return [];
  }
}

// ✅ Cached version - 1 week
export const getPracticesFromCleanedEscorts = unstable_cache(
  fetchPracticesFromCleanedEscorts,
  ["practices-cleaned"],
  {
    revalidate: 604800, // 1 week in seconds
    tags: ["practices", "cleaned-images"],
  },
);

// ⚠️ These functions are NOT cached (they're fast and should always be fresh)
/**
 * Get cleaned images for a specific escort
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
 * Get count of escorts with cleaned images by category/type
 */
export async function getCleanedImagesStats() {
  try {
    const snapshot = await adminDb.collection("escorts").get();
    const escorts: Escort[] = snapshot.docs.map(convertDocToEscort);

    const stats = {
      totalEscorts: escorts.length,
      escortsWithCleanedImages: 0,
      totalCleanedImages: 0,
      byCategory: {} as Record<string, number>,
      byCounty: {} as Record<string, number>,
    };

    escorts.forEach((escort) => {
      if (!escort.imagesMetadata) return;

      const cleanedImages = Object.values(escort.imagesMetadata).filter(
        (metadata: any) =>
          metadata.status === "completed" && metadata.cleanedUrl,
      );

      if (cleanedImages.length > 0) {
        stats.escortsWithCleanedImages++;
        stats.totalCleanedImages += cleanedImages.length;

        escort.categories?.forEach((category) => {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });

        if (escort.county) {
          stats.byCounty[escort.county] =
            (stats.byCounty[escort.county] || 0) + 1;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching cleaned images stats:", error);
    return null;
  }
}
