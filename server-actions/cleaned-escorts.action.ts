"use server";

import { executeQuery } from "@/lib/neon";
import { sql } from "@/app/lib/db";
import { Escort, GetEscortsParams, GetEscortsResponse, convertQueryDocToEscort } from "./escort.action";

const normalize = (val?: string) => (val || "").toLowerCase().trim();
const normalizeSlug = (val?: string) => normalize(val).replace(/[-_]/g, " ");

const LISTING_COLUMNS = [
  "id", "name", "username", "slug", "preview_photo", "images", "videos",
  "images_metadata", "age", "county", "county_code", "regions",
  "primary_region", "locations", "practices", "categories",
  "telephone", "whatsapp_phone", "is_active", "is_verified",
  "is_featured", "has_cleaned_images", "cleaned_images",
  "created_at", "updated_at", "total_views", "rating", "total_bookings",
  "bdsm", "massage", "extra_services", "work_type", "gender",
];

function getEscortListingSelect(): string {
  return LISTING_COLUMNS.map((c) => `escorts.${c}`).join(", ");
}

async function getCleanedEscortsBase(
  params: GetEscortsParams & { paginateInSql?: boolean },
): Promise<{ rows: any[]; total: number }> {
  const { page = 1, limit = 20, paginateInSql = true } = params;
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));

  const conditions: string[] = ["escorts.has_cleaned_images = TRUE"];
  const params_arr: any[] = [];
  let paramIndex = 1;

  if (params.isActive !== undefined) {
    conditions.push(`escorts.is_active = $${paramIndex}`);
    params_arr.push(params.isActive);
    paramIndex++;
  }
  if (params.isVerified !== undefined) {
    conditions.push(`escorts.is_verified = $${paramIndex}`);
    params_arr.push(params.isVerified);
    paramIndex++;
  }
  if (params.isFeatured !== undefined) {
    conditions.push(`escorts.is_featured = $${paramIndex}`);
    params_arr.push(params.isFeatured);
    paramIndex++;
  }
  if (params.county && params.county !== "all") {
    conditions.push(`escorts.county = $${paramIndex}`);
    params_arr.push(params.county);
    paramIndex++;
  }
  if (params.countyCode && params.countyCode !== "all") {
    conditions.push(`escorts.county_code = $${paramIndex}`);
    params_arr.push(params.countyCode);
    paramIndex++;
  }
  if (params.nationality && params.nationality !== "all") {
    conditions.push(`escorts.nationality = $${paramIndex}`);
    params_arr.push(params.nationality);
    paramIndex++;
  }
  if (params.minAge && params.minAge > 0) {
    conditions.push(`CAST(escorts.age AS INTEGER) >= $${paramIndex}`);
    params_arr.push(params.minAge);
    paramIndex++;
  }
  if (params.maxAge && params.maxAge > 0) {
    conditions.push(`CAST(escorts.age AS INTEGER) <= $${paramIndex}`);
    params_arr.push(params.maxAge);
    paramIndex++;
  }
  if (params.minRating && params.minRating > 0) {
    conditions.push(`escorts.rating >= $${paramIndex}`);
    params_arr.push(params.minRating);
    paramIndex++;
  }
  if (params.practice && params.practice !== "all") {
    conditions.push(`EXISTS (SELECT 1 FROM JSON_TABLE(escorts.practices, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.p) = LOWER($${paramIndex}))`);
    params_arr.push(params.practice);
    paramIndex++;
  }
  if (params.practices && params.practices.length > 0) {
    conditions.push(`JSON_OVERLAPS(escorts.practices, $${paramIndex})`);
    params_arr.push(JSON.stringify(params.practices));
    paramIndex++;
  }
  if (params.categories && params.categories.length > 0) {
    conditions.push(`JSON_OVERLAPS(escorts.categories, $${paramIndex})`);
    params_arr.push(JSON.stringify(params.categories));
    paramIndex++;
  }
  if (params.region && params.region !== "all") {
    conditions.push(`(EXISTS (SELECT 1 FROM JSON_TABLE(escorts.regions, '$[*]' COLUMNS (r VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.r) = LOWER($${paramIndex})) OR lower(escorts.primary_region) = lower($${paramIndex}))`);
    params_arr.push(params.region);
    paramIndex++;
  }
  if (params.search) {
    const searchTerm = `%${params.search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(escorts.name) LIKE $${paramIndex} OR LOWER(escorts.username) LIKE $${paramIndex} OR LOWER(escorts.about) LIKE $${paramIndex})`,
    );
    params_arr.push(searchTerm, searchTerm, searchTerm);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const totalQuery = `SELECT COUNT(*) as count FROM escorts ${where}`;
  const totalResult: any[] = await executeQuery(totalQuery, params_arr);
  const total = parseInt(totalResult[0]?.count || "0", 10);

  const sortField = params.sortBy
    ? params.sortBy.replace(/([A-Z])/g, "_$1").toLowerCase()
    : "created_at";
  const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";
  const validSortFields = ["created_at", "updated_at", "age", "total_views", "rating", "total_bookings"];
  const safeSort = validSortFields.includes(sortField) ? sortField : "created_at";

  let rows: any[] = [];
  if (paginateInSql) {
    const offset = (validPage - 1) * validLimit;
    const dataQuery = `SELECT ${getEscortListingSelect()} FROM escorts ${where} ORDER BY ${safeSort} ${sortOrder}, escorts.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params_arr, validLimit, offset];
    rows = await executeQuery(dataQuery, dataParams);
  } else {
    const dataQuery = `SELECT ${getEscortListingSelect()} FROM escorts ${where} ORDER BY ${safeSort} ${sortOrder}, escorts.created_at DESC`;
    rows = await executeQuery(dataQuery, params_arr);
  }

  return { rows, total };
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
      normalize(e.primaryRegion) === regionLower,
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
    filtered = filtered.filter((e) => parseInt(e.age || "0") >= params.minAge!);
  }

  if (params.maxAge) {
    filtered = filtered.filter((e) => parseInt(e.age || "0") <= params.maxAge!);
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

function applyPagination(
  escorts: Escort[],
  validPage: number,
  validLimit: number,
): Escort[] {
  const startIndex = (validPage - 1) * validLimit;
  return escorts.slice(startIndex, startIndex + validLimit);
}

export async function getEscortsWithCleanedImages(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const { page = 1, limit = 20 } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const { rows, total } = await getCleanedEscortsBase(params);
    const escorts = await Promise.all(rows.map(convertQueryDocToEscort));

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(total / validLimit)),
      hasMore: total > validPage * validLimit,
    };
  } catch (error) {
    console.error("Error fetching escorts with cleaned images:", error);
    return { escorts: [], total: 0, page: params.page || 1, totalPages: 0, hasMore: false };
  }
}

interface GetMassageEscortsParams extends Omit<GetEscortsParams, "practice" | "practices"> {
  massageType?: string;
}

const MASSAGE_TYPE_TERMS = [
  "massage", "tantric", "nuru", "lingam", "yoni", "body to body",
  "body-to-body", "b2b", "sensual", "erotic", "four hands", "4 hands",
  "couples", "therapeutic", "relaxation", "wellness", "deep tissue",
  "swedish", "hot stone", "aromatherapy", "sports massage",
];

function isMassageType(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return MASSAGE_TYPE_TERMS.some((term) => lower.includes(term));
}

function filterForMassage(escorts: Escort[], massageType?: string): Escort[] {
  return escorts.filter((escort) => {
    const practices = escort.practices || [];
    const bdsm = (escort as any).bdsm || [];
    const massages = (escort as any).massage || [];
    const extraServices = (escort as any).extraServices || [];
    const allServices: string[] = [...practices, ...bdsm, ...massages, ...extraServices];

    const hasMassage = allServices.some((p: string) => p && isMassageType(p));
    if (!hasMassage) return false;

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

export async function getMassageEscortsFromCleanedImages(
  params: GetMassageEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const { page = 1, limit: limitParam = 20, sortBy = "createdAt", sortOrder = "desc", massageType } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitParam));

    const { rows, total } = await getCleanedEscortsBase({
      ...params,
      paginateInSql: false,
    });
    let escorts = await Promise.all(rows.map(convertQueryDocToEscort));
    escorts = filterForMassage(escorts, massageType);
    const paginated = applyPagination(escorts, validPage, validLimit);

    return {
      escorts: paginated,
      total: escorts.length,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(escorts.length / validLimit)),
      hasMore: paginated.length < escorts.length,
    };
  } catch (error) {
    console.error("Error fetching massage escorts with cleaned images:", error);
    return { escorts: [], total: 0, page: params.page || 1, totalPages: 0, hasMore: false };
  }
}

export async function getBDSMEscortsWithCleanedImages(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const { page = 1, limit: limitParam = 20, sortBy = "createdAt", sortOrder = "desc" } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limitParam));

    const { rows, total } = await getCleanedEscortsBase({
      ...params,
      paginateInSql: false,
    });
    let escorts = await Promise.all(rows.map(convertQueryDocToEscort));

    const BDSM_TYPE_TERMS = [
      "bdsm", "domination", "submission", "bondage", "discipline",
      "sadomasochism", "dominatrix", "mistress", "slave", "master",
      "kinky", "fetish", "spanking", "whipping", "role play", "roleplay",
      "leather", "latex", "pegging", "strap-on",
    ];

    escorts = escorts.filter((escort) => {
      const allServices: string[] = [
        ...(escort.practices || []),
        ...((escort as any).bdsm || []),
        ...((escort as any).massage || []),
        ...((escort as any).extraServices || []),
      ];
      const hasBDSMPractice = allServices.some(
        (p: string) => p && BDSM_TYPE_TERMS.some((term) => p.toLowerCase().includes(term)),
      );
      if (!hasBDSMPractice) return false;
      return true;
    });

    const paginated = applyPagination(escorts, validPage, validLimit);

    return {
      escorts: paginated,
      total: escorts.length,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(escorts.length / validLimit)),
      hasMore: paginated.length < escorts.length,
    };
  } catch (error) {
    console.error("Error fetching BDSM escorts with cleaned images:", error);
    return { escorts: [], total: 0, page: params.page || 1, totalPages: 0, hasMore: false };
  }
}

async function fetchEscortsWithCleanedRows(params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {}): Promise<Escort[]> {
  const conditions: string[] = ["has_cleaned_images = TRUE"];
  const params_arr: any[] = [];
  let paramIndex = 1;

  if (params.isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex}`);
    params_arr.push(params.isActive);
    paramIndex++;
  }
  if (params.isVerified !== undefined) {
    conditions.push(`is_verified = $${paramIndex}`);
    params_arr.push(params.isVerified);
    paramIndex++;
  }
  if (params.isFeatured !== undefined) {
    conditions.push(`is_featured = $${paramIndex}`);
    params_arr.push(params.isFeatured);
    paramIndex++;
  }
  if (params.county && params.county !== "all") {
    conditions.push(`county = $${paramIndex}`);
    params_arr.push(params.county);
    paramIndex++;
  }
  if (params.region && params.region !== "all") {
    conditions.push(`(EXISTS (SELECT 1 FROM JSON_TABLE(regions, '$[*]' COLUMNS (r VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.r) = LOWER($${paramIndex})) OR lower(primary_region) = lower($${paramIndex}))`);
    params_arr.push(params.region);
    paramIndex++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const query = `SELECT * FROM escorts ${where}`;
  const rows: any[] = await executeQuery(query, params_arr);
  return Promise.all(rows.map(convertQueryDocToEscort));
}

export async function getBDSMsFromCleanedEscorts(
  params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {},
): Promise<{ value: string; count: number }[]> {
  try {
    const escorts = await fetchEscortsWithCleanedRows(params);

    const BDSM_TYPE_TERMS = [
      "bdsm", "domination", "submission", "bondage", "discipline",
      "sadomasochism", "dominatrix", "mistress", "slave", "master",
      "kinky", "fetish", "spanking", "whipping", "role play", "roleplay",
      "leather", "latex", "pegging", "strap-on",
    ];

    const valueCounts: Record<string, number> = {};

    escorts.forEach((escort) => {
      const serviceArrays = [
        escort.practices,
        (escort as any).bdsm,
        (escort as any).massage,
        (escort as any).extraServices,
      ].filter(Array.isArray);

      serviceArrays.forEach((arr: any[]) => {
        arr.forEach((item: string) => {
          if (item && BDSM_TYPE_TERMS.some((term) => item.toLowerCase().includes(term)) && !valueCounts[item]) {
            valueCounts[item] = (valueCounts[item] || 0) + 1;
          }
        });
      });
    });

    return Object.entries(valueCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error("Error fetching BDSM practices from cleaned escorts:", error);
    return [];
  }
}

export async function getPracticesFromCleanedEscorts(
  params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {},
): Promise<{ practice: string; count: number }[]> {
  try {
    const escorts = await fetchEscortsWithCleanedRows(params);

    const practiceCounts: Record<string, number> = {};

    escorts.forEach((escort) => {
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
        if (b.count !== a.count) return b.count - a.count;
        return a.practice.localeCompare(b.practice);
      });
  } catch (error) {
    console.error("Error fetching practices from cleaned escorts:", error);
    return [];
  }
}

async function fetchUniqueFieldFromCleanedEscorts(
  params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {},
  field: "practices" | "massage" | "categories" | "bdsm",
): Promise<{ value: string; count: number }[]> {
  try {
    const escorts = await fetchEscortsWithCleanedRows(params);

    const valueCounts: Record<string, number> = {};

    escorts.forEach((escort) => {
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
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error(`Error fetching ${field} from cleaned escorts:`, error);
    return [];
  }
}

export async function getMassagesFromCleanedEscorts(
  params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {},
): Promise<{ value: string; count: number }[]> {
  try {
    const escorts = await fetchEscortsWithCleanedRows(params);

    const valueCounts: Record<string, number> = {};

    escorts.forEach((escort) => {
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
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error("Error fetching massages from cleaned escorts:", error);
    return [];
  }
}

export async function getCategoriesFromCleanedEscorts(
  params: Omit<GetEscortsParams, "practice" | "practices" | "page" | "limit"> = {},
): Promise<{ value: string; count: number }[]> {
  try {
    const escorts = await fetchEscortsWithCleanedRows(params);

    const valueCounts: Record<string, number> = {};

    escorts.forEach((escort) => {
      const values = escort.categories;
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
        if (b.count !== a.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      });
  } catch (error) {
    console.error("Error fetching categories from cleaned escorts:", error);
    return [];
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

export async function getCleanedImagesStats() {
  try {
    const rows: any[] = await sql`
      SELECT cleaned_images, images_metadata, categories, county
      FROM escorts
      WHERE has_cleaned_images = TRUE
    `;

    const stats = {
      totalEscorts: 0,
      escortsWithCleanedImages: 0,
      totalCleanedImages: 0,
      byCategory: {} as Record<string, number>,
      byCounty: {} as Record<string, number>,
    };

    stats.totalEscorts = rows.length;

    rows.forEach((row) => {
      const cleanedCount = row.cleaned_images?.length || 0;
      const metadata = row.images_metadata || {};
      let metadataCleanedCount = 0;
      for (const key of Object.keys(metadata)) {
        const m = metadata[key];
        if (m?.status === "completed" && m?.cleanedUrl) {
          metadataCleanedCount++;
        }
      }

      const totalCount = cleanedCount > 0 ? cleanedCount : metadataCleanedCount;

      if (totalCount > 0) {
        stats.escortsWithCleanedImages++;
        stats.totalCleanedImages += totalCount;

        (row.categories || []).forEach((category: string) => {
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });

        if (row.county) {
          stats.byCounty[row.county] = (stats.byCounty[row.county] || 0) + 1;
        }
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching cleaned images stats:", error);
    return null;
  }
}
