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

// Helper to check if escort has cleaned images
function hasCleanedImages(escort: Escort): boolean {
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (metadata: any) => metadata.status === "completed" && metadata.cleanedUrl,
  );
}

// Helper to check if practice is erotic massage
function isEroticMassage(practice: string): boolean {
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

  const lowerPractice = practice.toLowerCase();
  return eroticMassageTerms.some((term) =>
    lowerPractice.includes(term.toLowerCase()),
  );
}

/**
 * Get erotic massage escorts with cleaned images
 */
async function fetchEroticMassageEscorts(
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
      minAge,
      maxAge,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Build query
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

    // Get ALL documents
    const snapshot = await query.get();
    let allEscorts: Escort[] = snapshot.docs.map(convertDocToEscort);

    // ✅ Filter: Only escorts with cleaned images
    allEscorts = allEscorts.filter(hasCleanedImages);

    // Filter by region (client-side)
    if (region && region !== "all") {
      allEscorts = allEscorts.filter((doc) => doc.regions?.includes(region));
    }

    // ✅ Filter by erotic massage practice
    allEscorts = allEscorts.filter((doc) => {
      if (!doc.practices || doc.practices.length === 0) return false;
      return doc.practices.some((practice) => isEroticMassage(practice));
    });

    // Apply age filters
    if (minAge && minAge > 0) {
      allEscorts = allEscorts.filter(
        (doc) => doc.age && parseInt(doc.age) >= minAge,
      );
    }

    if (maxAge && maxAge > 0) {
      allEscorts = allEscorts.filter(
        (doc) => doc.age && parseInt(doc.age) <= maxAge,
      );
    }

    // Pagination
    const total = allEscorts.length;
    const startAt = (validPage - 1) * validLimit;
    const paginatedEscorts = allEscorts.slice(startAt, startAt + validLimit);

    return {
      escorts: paginatedEscorts,
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
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

// ✅ Cached version - 1 week
export const getEroticMassageEscorts = unstable_cache(
  fetchEroticMassageEscorts,
  ["escorts", "cleaned-images", "erotic-massage"],
);

// Also export the uncached version if needed
export const getEroticMassageEscortsUncached = fetchEroticMassageEscorts;
