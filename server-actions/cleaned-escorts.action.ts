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

const normalize = (val?: string) => (val || "").toLowerCase().trim();
const normalizeSlug = (val?: string) => normalize(val).replace(/[-_]/g, " ");

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
  "bdsm",
  "massage",
  "extraServices",
  "categories",
  "slug",
  "telephone",
  "whatsappPhone",
  "isActive",
  "isVerified",
  "isFeatured",
  "hasCleanedImages",
  "createdAt",
  "updatedAt",
  "totalViews",
  "rating",
  "totalBookings",
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
  useArrayContains: boolean = false,
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
  if (
    useArrayContains &&
    params.region &&
    params.region !== "all"
  ) {
    query = query.where("regions", "array-contains", params.region);
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

  if (params.county && params.county !== "all") {
    const countyLower = normalize(params.county);
    filtered = filtered.filter((e) => normalize(e.county) === countyLower);
  }

  if (params.region && params.region !== "all") {
    const regionLower = normalize(params.region);
    filtered = filtered.filter((e) =>
      (e.regions || []).some((r) => normalize(r) === regionLower) ||
      normalize(e.primaryRegion) === regionLower
    );
  }

  if (params.town && params.town !== "all") {
    const townLower = normalize(params.town);
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => normalize(loc.town) === townLower),
    );
  }

  if (params.estate && params.estate !== "all") {
    const estateLower = normalize(params.estate);
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => normalize(loc.estate) === estateLower),
    );
  }

  if (params.practice && params.practice !== "all") {
    const practiceLower = normalize(params.practice);
    filtered = filtered.filter((e) =>
      (e.practices || []).some((p) => normalize(p) === practiceLower) ||
      (e.bdsm || []).some((p) => normalize(p) === practiceLower) ||
      (e.massage || []).some((p) => normalize(p) === practiceLower) ||
      (e.extraServices || []).some((p) => normalize(p) === practiceLower)
    );
  }

  if (params.practices && params.practices.length > 0) {
    const practicesLower = params.practices.map(normalize);
    filtered = filtered.filter((e) =>
      (e.practices || []).some((p) => practicesLower.includes(normalize(p))) ||
      (e.bdsm || []).some((p) => practicesLower.includes(normalize(p))) ||
      (e.massage || []).some((p) => practicesLower.includes(normalize(p))) ||
      (e.extraServices || []).some((p) => practicesLower.includes(normalize(p)))
    );
  }

  if (params.category && params.category !== "all") {
    const categoryLower = normalize(params.category);
    filtered = filtered.filter((e) =>
      e.categories?.some((c) => normalize(c) === categoryLower),
    );
  }

  if (params.categories && params.categories.length > 0) {
    const categoriesLower = params.categories.map(normalize);
    filtered = filtered.filter((e) =>
      e.categories?.some((c) => categoriesLower.includes(normalize(c))),
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

function applyCleanedImagesWrapper(
  result: GetEscortsResponse,
  validPage: number,
  validLimit: number,
): GetEscortsResponse {
  const total = result.total;
  const startIndex = (validPage - 1) * validLimit;
  const endIndex = Math.min(startIndex + validLimit, total);
  const paginatedEscorts = result.escorts.slice(startIndex, endIndex);
  return {
    escorts: applyCleanedImages(paginatedEscorts),
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: endIndex < total || result.hasMore,
  };
}

async function runQueryWithFilters(
  params: GetEscortsParams,
  validPage: number,
  validLimit: number,
  sortBy: string,
  sortOrder: string,
  useArrayContains: boolean,
  serverSideParams?: GetEscortsParams,
): Promise<GetEscortsResponse> {
  const batchSize = Math.max(validLimit * 5, 200);
  const effectiveServerParams = serverSideParams || params;

  let query = buildBaseQuery();
  query = applyServerSideFilters(query, effectiveServerParams, useArrayContains);
  query = applySorting(query, sortBy, sortOrder);

  let lastDoc: any = null;
  const allResults: Escort[] = [];
  let hasMore = false;

  let iterations = 0;
  const maxIterations = 10;

  while (allResults.length < validLimit * 2 && iterations < maxIterations) {
    iterations++;
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
    allResults.push(...filtered);

    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    hasMore = snapshot.size === batchSize;

    if (!hasMore) {
      break;
    }
  }

  return {
    escorts: allResults,
    total: allResults.length,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(allResults.length / validLimit)),
    hasMore: allResults.length > validPage * validLimit || hasMore,
  };
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

    // Phase 1: Try with server-side array-contains for region (fast, exact match)
    const hasRegionFilter = !!(params.region && params.region !== "all");
    const hasPracticeFilter = !!(params.practice && params.practice !== "all");

    let result: GetEscortsResponse;

    try {
      result = await runQueryWithFilters(
        params,
        validPage,
        validLimit,
        sortBy,
        sortOrder,
        hasRegionFilter,
      );
    } catch (queryError: any) {
      console.warn(
        "Server-side array-contains query failed, falling back to client-side filtering:",
        queryError?.message || queryError,
      );
      result = {
        escorts: [],
        total: 0,
        page: validPage,
        totalPages: 0,
        hasMore: false,
      };
    }

    // Phase 2: Fallback to case-insensitive client-side filtering if 0 results
    // and there is a region or practice filter (handles case mismatches in data
    // or missing composite indexes)
    if (
      result.total === 0 &&
      (hasRegionFilter || hasPracticeFilter)
    ) {
      try {
        const fallback = await runQueryWithFilters(
          params,
          validPage,
          validLimit,
          sortBy,
          sortOrder,
          false,
        );
        return applyCleanedImagesWrapper(fallback, validPage, validLimit);
      } catch (fallbackError: any) {
        console.warn(
          "Phase 2 fallback failed:",
          fallbackError?.message || fallbackError,
        );
      }
    }

    // Phase 3: If still 0 results and county filter exists, retry with
    // county filter stripped from server-side (handles case mismatches like
    // "Mombasa" vs "mombasa")
    if (
      result.total === 0 &&
      (hasRegionFilter || hasPracticeFilter) &&
      params.county &&
      params.county !== "all"
    ) {
      try {
        const countyStrippedParams = { ...params, county: undefined };
        const fallback = await runQueryWithFilters(
          params,
          validPage,
          validLimit,
          sortBy,
          sortOrder,
          false,
          countyStrippedParams,
        );
        return applyCleanedImagesWrapper(fallback, validPage, validLimit);
      } catch (fallbackError: any) {
        console.warn(
          "Phase 3 county-stripped fallback failed:",
          fallbackError?.message || fallbackError,
        );
      }
    }

    return applyCleanedImagesWrapper(result, validPage, validLimit);
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

interface GetMassageEscortsParams
  extends Omit<GetEscortsParams, "practice" | "practices"> {
  massageType?: string;
}

async function fetchMassageEscortsWithCleanedImagesInternal(
  params: GetMassageEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit: limitParam = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      massageType,
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitParam));

    function filterForMassage(escorts: Escort[]): Escort[] {
      return escorts.filter((escort) => {
        const practices = escort.practices || [];
        const bdsm = (escort as any).bdsm || [];
        const massages = (escort as any).massage || [];
        const extraServices = (escort as any).extraServices || [];
        const allServices: string[] = [...practices, ...bdsm, ...massages, ...extraServices];

        // Escort must offer at least one massage-related service
        const hasMassage = allServices.some((p: string) => p && isMassageType(p));
        if (!hasMassage) return false;

        // If a specific massage type is selected, further filter
        if (massageType && massageType !== "all") {
          const lowerType = normalizeSlug(massageType);
          const matches = allServices.some(
            (p: string) => p && normalizeSlug(p).includes(lowerType),
          );
          if (!matches) return false;
        }

        return true;
      });
    }

    // Phase 1: Try with server-side array-contains for region
    const hasRegionFilter = !!(params.region && params.region !== "all");

    let result: GetEscortsResponse;

    try {
      result = await runQueryWithFilters(
        params,
        validPage,
        validLimit,
        sortBy,
        sortOrder,
        hasRegionFilter,
      );
    } catch (queryError: any) {
      console.warn(
        "Massage escorts: Server-side array-contains query failed, falling back to client-side filtering:",
        queryError?.message || queryError,
      );
      result = {
        escorts: [],
        total: 0,
        page: validPage,
        totalPages: 0,
        hasMore: false,
      };
    }

    const massageFiltered = filterForMassage(result.escorts);

    // Phase 2: Fallback if 0 results and region filter
    if (massageFiltered.length === 0 && hasRegionFilter) {
      try {
        const fallback = await runQueryWithFilters(
          params,
          validPage,
          validLimit,
          sortBy,
          sortOrder,
          false,
        );

        const fallbackFiltered = filterForMassage(fallback.escorts);
        return {
          escorts: applyCleanedImages(
            fallbackFiltered.slice(
              (validPage - 1) * validLimit,
              Math.min((validPage - 1) * validLimit + validLimit, fallbackFiltered.length),
            ),
          ),
          total: fallbackFiltered.length,
          page: validPage,
          totalPages: Math.max(1, Math.ceil(fallbackFiltered.length / validLimit)),
          hasMore:
            fallbackFiltered.length > validPage * validLimit || fallback.hasMore,
        };
      } catch (fallbackError: any) {
        console.warn(
          "Massage escorts: Phase 2 fallback failed:",
          fallbackError?.message || fallbackError,
        );
      }
    }

    // Phase 3: If still 0 results and county filter exists, retry with
    // county filter stripped from server-side (handles case mismatches)
    if (
      massageFiltered.length === 0 &&
      hasRegionFilter &&
      params.county &&
      params.county !== "all"
    ) {
      try {
        const countyStrippedParams = { ...params, county: undefined };
        const fallback = await runQueryWithFilters(
          params,
          validPage,
          validLimit,
          sortBy,
          sortOrder,
          false,
          countyStrippedParams,
        );

        const fallbackFiltered = filterForMassage(fallback.escorts);
        return {
          escorts: applyCleanedImages(
            fallbackFiltered.slice(
              (validPage - 1) * validLimit,
              Math.min((validPage - 1) * validLimit + validLimit, fallbackFiltered.length),
            ),
          ),
          total: fallbackFiltered.length,
          page: validPage,
          totalPages: Math.max(1, Math.ceil(fallbackFiltered.length / validLimit)),
          hasMore:
            fallbackFiltered.length > validPage * validLimit || fallback.hasMore,
        };
      } catch (fallbackError: any) {
        console.warn(
          "Massage escorts: Phase 3 county-stripped fallback failed:",
          fallbackError?.message || fallbackError,
        );
      }
    }

    const allResults = massageFiltered;
    const startIndex = (validPage - 1) * validLimit;
    const endIndex = Math.min(startIndex + validLimit, allResults.length);

    return {
      escorts: applyCleanedImages(allResults.slice(startIndex, endIndex)),
      total: allResults.length,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(allResults.length / validLimit)),
      hasMore: endIndex < allResults.length || result.hasMore,
    };
  } catch (error) {
    console.error("Error fetching massage escorts with cleaned images:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

export const getMassageEscortsFromCleanedImages = cache(
  fetchMassageEscortsWithCleanedImagesInternal,
);

const BDSM_TYPE_TERMS = [
  "bdsm",
  "domination",
  "submission",
  "bondage",
  "discipline",
  "sadomasochism",
  "dominatrix",
  "mistress",
  "slave",
  "master",
  "kinky",
  "fetish",
  "spanking",
  "whipping",
  "role play",
  "roleplay",
  "leather",
  "latex",
  "pegging",
  "strap-on",
];

function isBDSMPractice(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return BDSM_TYPE_TERMS.some((term) => lower.includes(term));
}

interface GetBDSMEscortsParams
  extends Omit<GetEscortsParams, "practice" | "practices"> {
  practice?: string;
}

async function fetchBDSMEscortsWithCleanedImagesInternal(
  params: GetBDSMEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit: limitParam = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      practice,
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitParam));

    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);
    query = applySorting(query, sortBy, sortOrder);

    const batchSize = 1000;

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

      let docs = snapshot.docs.map(convertDocToEscortFast);
      let filtered = applyClientFilters(docs, params);

      filtered = filtered.filter((escort) => {
        const allServices: string[] = [
          ...(escort.practices || []),
          ...((escort as any).bdsm || []),
          ...((escort as any).massage || []),
          ...((escort as any).extraServices || []),
        ];

      const hasBDSMPractice = allServices.some(
        (p: string) => p && isBDSMPractice(p),
      );
      if (!hasBDSMPractice) return false;

      if (practice && practice !== "all") {
        const lowerPractice = normalizeSlug(practice);
        const matches = allServices.some(
          (p: string) => p && normalizeSlug(p).includes(lowerPractice),
        );
        if (!matches) return false;
      }

      return true;
    });

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

    const response = {
      escorts: applyCleanedImages(paginatedEscorts),
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: endIndex < total || hasMore,
    };

    // Phase 3: If 0 results and region/practice filter exists with county,
    // retry with county stripped from server-side (handles case mismatches)
    if (
      total === 0 &&
      (params.region || params.practice) &&
      params.county &&
      params.county !== "all"
    ) {
      try {
        const countyStrippedParams = { ...params, county: undefined };
        const fallbackQuery = buildBaseQuery();
        const fallbackQuery2 = applyServerSideFilters(fallbackQuery, countyStrippedParams);
        const fallbackQuery3 = applySorting(fallbackQuery2, sortBy, sortOrder);

        const fallbackAllFiltered: Escort[] = [];
        let fallbackLastDoc: any = null;
        let fallbackHasMore = false;

        while (true) {
          let pageQuery = fallbackQuery3;
          if (fallbackLastDoc) {
            pageQuery = pageQuery.startAfter(fallbackLastDoc);
          }

          const snapshot = await pageQuery.limit(batchSize).get();

          if (snapshot.empty) break;

          const docs = snapshot.docs.map(convertDocToEscortFast);
          const filtered = applyClientFilters(docs, params);

          const bdsmFiltered = filtered.filter((escort) => {
            const allServices: string[] = [
              ...(escort.practices || []),
              ...((escort as any).bdsm || []),
              ...((escort as any).massage || []),
              ...((escort as any).extraServices || []),
            ];

            const hasBDSMPractice = allServices.some(
              (p: string) => p && isBDSMPractice(p),
            );
            if (!hasBDSMPractice) return false;

            if (practice && practice !== "all") {
              const lowerPractice = normalizeSlug(practice);
              const matches = allServices.some(
                (p: string) => p && normalizeSlug(p).includes(lowerPractice),
              );
              if (!matches) return false;
            }

            return true;
          });

          fallbackAllFiltered.push(...bdsmFiltered);
          fallbackLastDoc = snapshot.docs[snapshot.docs.length - 1];
          fallbackHasMore = snapshot.size === batchSize;

          if (!fallbackHasMore) break;
        }

        const fallbackTotal = fallbackAllFiltered.length;
        const fallbackStartIndex = (validPage - 1) * validLimit;
        const fallbackEndIndex = Math.min(fallbackStartIndex + validLimit, fallbackTotal);

        return {
          escorts: applyCleanedImages(fallbackAllFiltered.slice(fallbackStartIndex, fallbackEndIndex)),
          total: fallbackTotal,
          page: validPage,
          totalPages: Math.max(1, Math.ceil(fallbackTotal / validLimit)),
          hasMore: fallbackEndIndex < fallbackTotal || fallbackHasMore,
        };
      } catch (fallbackError: any) {
        console.warn(
          "BDSM: Phase 3 county-stripped fallback failed:",
          fallbackError?.message || fallbackError,
        );
      }
    }

    return response;
  } catch (error) {
    console.error("Error fetching BDSM escorts with cleaned images:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

export const getBDSMEscortsWithCleanedImages = cache(
  fetchBDSMEscortsWithCleanedImagesInternal,
);

/**
 * Get all unique BDSM practices from cleaned escorts.
 *
 * BDSM practices are extracted from BOTH the `practices` and `bdsm` array
 * fields on escorts with cleaned images. Only values that match known BDSM
 * terms are included.
 */
async function fetchBDSMsFromCleanedEscortsInternal(
  params: Omit<
    GetEscortsParams,
    "practice" | "practices" | "page" | "limit"
  > = {},
): Promise<{ value: string; count: number }[]> {
  try {
    let query = buildBaseQuery();
    query = applyServerSideFilters(query, params);

    const batchSize = 1000;
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
      const serviceArrays = [
        escort.practices,
        (escort as any).bdsm,
        (escort as any).massage,
        (escort as any).extraServices,
      ].filter(Array.isArray);

      serviceArrays.forEach((arr: any[]) => {
        arr.forEach((item: string) => {
          if (item && isBDSMPractice(item) && !valueCounts[item]) {
            valueCounts[item] = (valueCounts[item] || 0) + 1;
          }
        });
      });
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
    console.error("Error fetching BDSM practices from cleaned escorts:", error);
    return [];
  }
}

export const getBDSMsFromCleanedEscorts = cache(
  fetchBDSMsFromCleanedEscortsInternal,
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

    const batchSize = 1000;
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
      const serviceArrays = [
        escort.practices,
        (escort as any).bdsm,
        (escort as any).massage,
        (escort as any).extraServices,
      ].filter(Array.isArray);

      serviceArrays.forEach((arr: any[]) => {
        arr.forEach((practice: string) => {
          if (practice) {
            practiceCounts[practice] = (practiceCounts[practice] || 0) + 1;
          }
        });
      });
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

    const batchSize = 1000;
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
      const serviceArrays = [
        escort.practices,
        (escort as any).bdsm,
        (escort as any).massage,
        (escort as any).extraServices,
      ].filter(Array.isArray);

      serviceArrays.forEach((arr: any[]) => {
        arr.forEach((item: string) => {
          if (item && isMassageType(item) && !valueCounts[item]) {
            valueCounts[item] = (valueCounts[item] || 0) + 1;
          }
        });
      });
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
