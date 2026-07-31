// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

// Fast conversion - only converts known timestamp fields, no deep recursion
const TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "joinedDate",
  "lastProcessedAt",
];

function convertDocToEscortFast(doc: any): Escort {
  const data = doc.data();
  const result: any = {
    id: doc.id,
    ...data,
  };

  for (const field of TIMESTAMP_FIELDS) {
    if (result[field] && typeof result[field]?.toDate === "function") {
      result[field] = result[field].toDate().toISOString();
    }
  }

  return result as Escort;
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
    let allEscorts: Escort[] = snapshot.docs.map(convertDocToEscortFast);

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

export const getEroticMassageEscorts = fetchEroticMassageEscorts;
