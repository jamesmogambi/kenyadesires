// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cache } from "react";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

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

const LISTING_FIELDS = [
  "name",
  "username",
  "previewPhoto",
  "images",
  "videos",
  "imagesMetadata",
  "age",
  "county",
  "regions",
  "primaryRegion",
  "practices",
  "categories",
  "slug",
  "telephone",
  "whatsappPhone",
];

function buildBaseQuery() {
  let query: any = adminDb.collection("escorts");
  query = query.where("hasCleanedImages", "==", true);
  query = query.select(...LISTING_FIELDS);
  return query;
}

function applyServerSideFilters(
  query: any,
  params: GetEscortsParams,
): any {
  if (params.isActive !== undefined) {
    query = query.where("isActive", "==", params.isActive);
  }
  if (params.isVerified !== undefined) {
    query = query.where("isVerified", "==", params.isVerified);
  }
  if (params.isFeatured !== undefined) {
    query = query.where("isFeatured", "==", params.isFeatured);
  }
  if (params.county && params.county !== "all") {
    query = query.where("county", "==", params.county);
  }
  if (params.nationality && params.nationality !== "all") {
    query = query.where("nationality", "==", params.nationality);
  }
  return query;
}

function applySorting(query: any, sortBy: string, sortOrder: string): any {
  const validSortFields = [
    "createdAt",
    "updatedAt",
    "age",
    "totalViews",
    "rating",
    "totalBookings",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  return query.orderBy(sortField, sortOrder);
}

function applyClientFilters(escorts: Escort[], params: GetEscortsParams): Escort[] {
  let filtered = escorts;

  if (params.region && params.region !== "all") {
    filtered = filtered.filter((e) => e.regions?.includes(params.region!));
  }

  if (params.town && params.town !== "all") {
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => loc.town === params.town),
    );
  }

  if (params.estate && params.estate !== "all") {
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => loc.estate === params.estate),
    );
  }

  if (params.practice && params.practice !== "all") {
    filtered = filtered.filter((e) => e.practices?.includes(params.practice!));
  }

  if (params.practices && params.practices.length > 0) {
    filtered = filtered.filter((e) =>
      params.practices!.some((p) => e.practices?.includes(p)),
    );
  }

  if (params.category && params.category !== "all") {
    filtered = filtered.filter((e) => e.categories?.includes(params.category!));
  }

  if (params.categories && params.categories.length > 0) {
    filtered = filtered.filter((e) =>
      params.categories!.some((c) => e.categories?.includes(c)),
    );
  }

  if (params.minAge) {
    filtered = filtered.filter(
      (e) => parseInt(e.age || "0") >= params.minAge!,
    );
  }

  if (params.maxAge) {
    filtered = filtered.filter(
      (e) => parseInt(e.age || "0") <= params.maxAge!,
    );
  }

  if (params.minRating) {
    filtered = filtered.filter((e) => (e.rating || 0) >= params.minRating!);
  }

  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name?.toLowerCase().includes(searchLower) ||
        e.username?.toLowerCase().includes(searchLower) ||
        e.about?.toLowerCase().includes(searchLower),
    );
  }

  return filtered;
}

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

function getCleanedPreviewPhoto(escort: Escort): string | undefined {
  if (!escort.imagesMetadata || !escort.previewPhoto)
    return escort.previewPhoto;

  const previewMetadata = escort.imagesMetadata[escort.previewPhoto];
  if (previewMetadata?.status === "completed" && previewMetadata?.cleanedUrl) {
    return previewMetadata.cleanedUrl;
  }
  return escort.previewPhoto;
}

function applyCleanedImages(escorts: Escort[]): Escort[] {
  return escorts.map((escort) => {
    const cleanedImages = getCleanedImageUrls(escort);
    const cleanedPreviewPhoto = getCleanedPreviewPhoto(escort);

    return {
      ...escort,
      images: cleanedImages.length > 0 ? cleanedImages : escort.images,
      previewPhoto: cleanedPreviewPhoto || escort.previewPhoto,
    };
  });
}

async function fetchEscortsWithCleanedImagesInternal(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit: limitParam = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitParam));

    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);
    query = applySorting(query, sortBy, sortOrder);

    const batchSize = 500;
    let lastDoc: any = null;
    const allFiltered: Escort[] = [];
    let hasMore = false;

    while (true) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      const docs = snapshot.docs.map(convertDocToEscortFast);
      const filtered = applyClientFilters(docs, params);
      allFiltered.push(...filtered);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.size === batchSize;

      if (!hasMore) {
        break;
      }
    }

    const total = allFiltered.length;
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = Math.min(startIndex + validLimit, total);
    const paginatedEscorts = allFiltered.slice(startIndex, endIndex);

    return {
      escorts: applyCleanedImages(paginatedEscorts),
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: endIndex < total || hasMore,
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

export const getEscortsWithCleanedImages = cache(
  fetchEscortsWithCleanedImagesInternal,
);

async function fetchPracticesFromCleanedEscortsInternal(
  params: Omit<
    GetEscortsParams,
    "practice" | "practices" | "page" | "limit"
  > = {},
): Promise<{ practice: string; count: number }[]> {
  try {
    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);

    const batchSize = 500;
    let lastDoc: any = null;
    const allFiltered: Escort[] = [];

    while (true) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      const docs = snapshot.docs.map(convertDocToEscortFast);
      const filtered = applyClientFilters(docs, params);
      allFiltered.push(...filtered);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < batchSize) {
        break;
      }
    }

    const practiceCounts: Record<string, number> = {};

    allFiltered.forEach((escort) => {
      if (escort.practices && Array.isArray(escort.practices)) {
        escort.practices.forEach((practice) => {
          if (practice) {
            practiceCounts[practice] = (practiceCounts[practice] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(practiceCounts)
      .map(([practice, count]) => ({ practice, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.practice.localeCompare(b.practice);
      });
  } catch (error) {
    console.error("Error fetching practices from cleaned escorts:", error);
    return [];
  }
}

export const getPracticesFromCleanedEscorts = cache(
  fetchPracticesFromCleanedEscortsInternal,
);

/**
 * Generic internal function to extract unique string values from a given
 * array field on escorts with cleaned images (mirrors the practices logic).
 */
async function fetchUniqueFieldFromCleanedEscortsInternal(
  params: Omit<
    GetEscortsParams,
    "practice" | "practices" | "page" | "limit"
  > = {},
  field: "practices" | "massage" | "categories" | "bdsm",
): Promise<{ value: string; count: number }[]> {
  try {
    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);

    const batchSize = 500;
    let lastDoc: any = null;
    const allFiltered: Escort[] = [];

    while (true) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      const docs = snapshot.docs.map(convertDocToEscortFast);
      const filtered = applyClientFilters(docs, params);
      allFiltered.push(...filtered);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < batchSize) {
        break;
      }
    }

    const valueCounts: Record<string, number> = {};

    allFiltered.forEach((escort) => {
      const values = (escort as any)[field];
      if (values && Array.isArray(values)) {
        values.forEach((value: string) => {
          if (value) {
            valueCounts[value] = (valueCounts[value] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(valueCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error(
      `Error fetching ${field} from cleaned escorts:`,
      error,
    );
    return [];
  }
}

/**
 * Terms that identify a practice/value as a massage type.
 * Used to extract massage types from escort `practices` and `massage` arrays.
 */
const MASSAGE_TYPE_TERMS = [
  "massage",
  "tantric",
  "nuru",
  "lingam",
  "yoni",
  "body to body",
  "body-to-body",
  "b2b",
  "sensual",
  "erotic",
  "four hands",
  "4 hands",
  "couples",
  "therapeutic",
  "relaxation",
  "wellness",
  "deep tissue",
  "swedish",
  "hot stone",
  "aromatherapy",
  "sports massage",
];

function isMassageType(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return MASSAGE_TYPE_TERMS.some((term) => lower.includes(term));
}

/**
 * Get all unique massage types from cleaned escorts.
 *
 * Massage types are extracted from BOTH the `practices` and `massage` array
 * fields on escorts with cleaned images. Only values that match known massage
 * type terms (e.g. "massage", "tantric", "nuru", "lingam", "yoni",
 * "body to body", "b2b", "sensual", etc.) are included.
 */
async function fetchMassagesFromCleanedEscortsInternal(
  params: Omit<
    GetEscortsParams,
    "practice" | "practices" | "page" | "limit"
  > = {},
): Promise<{ value: string; count: number }[]> {
  try {
    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);

    const batchSize = 500;
    let lastDoc: any = null;
    const allFiltered: Escort[] = [];

    while (true) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      const docs = snapshot.docs.map(convertDocToEscortFast);
      const filtered = applyClientFilters(docs, params);
      allFiltered.push(...filtered);

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < batchSize) {
        break;
      }
    }

    const valueCounts: Record<string, number> = {};

    allFiltered.forEach((escort) => {
      // Extract from `practices` field
      const practices = escort.practices;
      if (practices && Array.isArray(practices)) {
        practices.forEach((practice: string) => {
          if (practice && isMassageType(practice)) {
            valueCounts[practice] = (valueCounts[practice] || 0) + 1;
          }
        });
      }

      // Extract from `massage` field
      const massages = (escort as any).massage;
      if (massages && Array.isArray(massages)) {
        massages.forEach((massage: string) => {
          if (massage && isMassageType(massage) && !valueCounts[massage]) {
            valueCounts[massage] = (valueCounts[massage] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(valueCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error("Error fetching massages from cleaned escorts:", error);
    return [];
  }
}

/**
 * Get all unique massage types from cleaned escorts.
 * Extracts from both the `practices` and `massage` array fields,
 * filtering for values that match known massage type terms.
 */
export const getMassagesFromCleanedEscorts = cache(
  fetchMassagesFromCleanedEscortsInternal,
);

export async function getCleanedImagesForEscort(
  escortId: string,
): Promise<string[]> {
  try {
    const doc = await adminDb.collection("escorts").doc(escortId).get();

    if (!doc.exists) {
      return [];
    }

    const escort = convertDocToEscortFast(doc);

    if (!escort.imagesMetadata) {
      return [];
    }

    return Object.values(escort.imagesMetadata)
      .filter(
        (metadata: any) =>
          metadata.status === "completed" && metadata.cleanedUrl,
      )
      .map((metadata: any) => metadata.cleanedUrl!);
  } catch (error) {
    console.error("Error fetching cleaned images:", error);
    return [];
  }
}

export async function getCleanedImagesStats() {
  try {
    const batchSize = 500;
    let lastDoc: any = null;
    const stats = {
      totalEscorts: 0,
      escortsWithCleanedImages: 0,
      totalCleanedImages: 0,
      byCategory: {} as Record<string, number>,
      byCounty: {} as Record<string, number>,
    };

    while (true) {
      let query = adminDb
        .collection("escorts")
        .where("hasCleanedImages", "==", true)
        .select(
          "imagesMetadata",
          "categories",
          "county",
        );

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      stats.totalEscorts += snapshot.size;

      snapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        if (!data.imagesMetadata) return;

        const cleanedImages = Object.values(data.imagesMetadata).filter(
          (metadata: any) =>
            metadata.status === "completed" && metadata.cleanedUrl,
        );

        if (cleanedImages.length > 0) {
          stats.escortsWithCleanedImages++;
          stats.totalCleanedImages += cleanedImages.length;

          data.categories?.forEach((category: string) => {
            stats.byCategory[category] =
              (stats.byCategory[category] || 0) + 1;
          });

          if (data.county) {
            stats.byCounty[data.county] =
              (stats.byCounty[data.county] || 0) + 1;
          }
        }
      });

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < batchSize) {
        break;
      }
    }

    return stats;
  } catch (error) {
    console.error("Error fetching cleaned images stats:", error);
    return null;
  }
}
