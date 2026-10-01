"use server";

import { executeQuery } from "@/lib/neon";
import { sql } from "@/app/lib/db";
import {
  REGION_COLUMNS,
  SEARCHABLE_COLUMNS,
  SERVICE_COLUMNS,
  buildAnyColumnCondition,
  likeTerm,
  normalizedEquals,
  normalizedJsonLike,
} from "@/lib/escort-filters";
import { Escort, GetEscortsParams, GetEscortsResponse, convertQueryDocToEscort } from "./escort.action";
import { boostOrderBy } from "@/lib/boost";

const normalize = (val?: string) => (val || "").toLowerCase().trim();
const normalizeSlug = (val?: string) => normalize(val).replace(/[-_]/g, " ");

/**
 * Matches `normalizedEquals`/`likeTerm` on the SQL side: lowercased, with every
 * run of non-alphanumerics reduced to a single space, so a slugified URL compares
 * equal to the stored display name.
 */
const normalizeFilter = (val?: string) => normalize(val).replace(/[^a-z0-9]+/g, " ").trim();

const LISTING_COLUMNS = [
  "id", "name", "username", "slug", "preview_photo", "images", "videos",
  "images_metadata", "age", "county", "county_code", "regions",
  "primary_region", "locations", "practices", "categories",
  "telephone", "whatsapp_phone", "is_active", "is_verified",
  "is_featured", "has_cleaned_images", "cleaned_images",
  "created_at", "updated_at", "total_views", "rating", "total_bookings",
  "bdsm", "massage", "extra_services", "work_type", "gender",
  // Boost state (migration 008) — read for the badge and the boosted sort.
  "boost_until", "boost_priority", "active_boost_package_id",
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
    // Folded both sides: the URL carries a slug (`taita-taveta`) but rows store
    // the display name, which is `Taita Taveta` on this table.
    conditions.push(normalizedEquals("county", paramIndex, "escorts."));
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
    conditions.push(`CAST(escorts.age AS UNSIGNED) >= $${paramIndex}`);
    params_arr.push(params.minAge);
    paramIndex++;
  }
  if (params.maxAge && params.maxAge > 0) {
    conditions.push(`CAST(escorts.age AS UNSIGNED) <= $${paramIndex}`);
    params_arr.push(params.maxAge);
    paramIndex++;
  }
  if (params.minRating && params.minRating > 0) {
    conditions.push(`escorts.rating >= $${paramIndex}`);
    params_arr.push(params.minRating);
    paramIndex++;
  }
  if (params.practice && params.practice !== "all") {
    // See lib/escort-filters.ts: the previous JSON_TABLE-in-EXISTS form never
    // correlated on MySQL, so this filter silently matched nothing.
    const built = buildAnyColumnCondition(
      SERVICE_COLUMNS,
      params.practice,
      paramIndex,
      "escorts.",
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
    paramIndex = built.nextIndex;
  }
  if (params.practices && params.practices.length > 0) {
    for (const practice of params.practices) {
      if (!practice || practice === "all") continue;
      const built = buildAnyColumnCondition(
        SERVICE_COLUMNS,
        practice,
        paramIndex,
        "escorts.",
      );
      conditions.push(built.clause);
      params_arr.push(...built.params);
      paramIndex = built.nextIndex;
    }
  }
  if (params.category && params.category !== "all") {
    conditions.push(normalizedJsonLike("categories", paramIndex, "escorts."));
    params_arr.push(likeTerm(params.category));
    paramIndex++;
  }
  if (params.categories && params.categories.length > 0) {
    for (const category of params.categories) {
      if (!category || category === "all") continue;
      conditions.push(normalizedJsonLike("categories", paramIndex, "escorts."));
      params_arr.push(likeTerm(category));
      paramIndex++;
    }
  }
  if (params.gender && params.gender !== "all") {
    conditions.push(`LOWER(escorts.gender) = $${paramIndex}`);
    params_arr.push(params.gender.toLowerCase().trim());
    paramIndex++;
  }
  if (params.region && params.region !== "all") {
    // `regions` stores slugs ("nairobi_kilimani") while `primary_region` stores the
    // display name, and `locations` carries per-place town/estate.
    const built = buildAnyColumnCondition(
      REGION_COLUMNS,
      params.region,
      paramIndex,
      "escorts.",
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
    paramIndex = built.nextIndex;
  }
  if (params.town && params.town !== "all") {
    conditions.push(normalizedJsonLike("locations", paramIndex, "escorts."));
    params_arr.push(likeTerm(params.town));
    paramIndex++;
  }
  if (params.search) {
    const built = buildAnyColumnCondition(
      SEARCHABLE_COLUMNS,
      params.search,
      paramIndex,
      "escorts.",
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
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

  // Live boosts rank first; the caller's sort decides the rest. Expired boosts
  // fall back to priority 0 inside the CASE, so ranking is always correct
  // without a cleanup job having run.
  const orderBy = boostOrderBy("escorts", `escorts.${safeSort}`, sortOrder);

  let rows: any[] = [];
  if (paginateInSql) {
    const offset = (validPage - 1) * validLimit;
    const dataQuery = `SELECT ${getEscortListingSelect()} FROM escorts ${where} ORDER BY ${orderBy}, escorts.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataParams = [...params_arr, validLimit, offset];
    rows = await executeQuery(dataQuery, dataParams);
  } else {
    const dataQuery = `SELECT ${getEscortListingSelect()} FROM escorts ${where} ORDER BY ${orderBy}, escorts.created_at DESC`;
    rows = await executeQuery(dataQuery, params_arr);
  }

  return { rows, total };
}

function applyClientFilters(escorts: Escort[], params: GetEscortsParams): Escort[] {
  let filtered = escorts;

  if (params.county && params.county !== "all") {
    const countyLower = normalizeFilter(params.county);
    filtered = filtered.filter((e) => normalizeFilter(e.county) === countyLower);
  }

  if (params.region && params.region !== "all") {
    const regionLower = normalizeFilter(params.region);
    filtered = filtered.filter((e) =>
      (e.regions || []).some((r) => normalizeFilter(r) === regionLower) ||
      normalizeFilter(e.primaryRegion) === regionLower,
    );
  }

  if (params.town && params.town !== "all") {
    const townLower = normalizeFilter(params.town);
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => normalizeFilter(loc.town) === townLower),
    );
  }

  if (params.estate && params.estate !== "all") {
    const estateLower = normalizeFilter(params.estate);
    filtered = filtered.filter((e) =>
      e.locations?.some((loc) => normalizeFilter(loc.estate) === estateLower),
    );
  }

  if (params.practice && params.practice !== "all") {
    const practiceLower = normalizeFilter(params.practice);
    filtered = filtered.filter((e) =>
      (e.practices || []).some((p) => normalizeFilter(p) === practiceLower) ||
      (e.bdsm || []).some((p) => normalizeFilter(p) === practiceLower) ||
      (e.massage || []).some((p) => normalizeFilter(p) === practiceLower) ||
      (e.extraServices || []).some((p) => normalizeFilter(p) === practiceLower)
    );
  }

  if (params.practices && params.practices.length > 0) {
    const practicesLower = params.practices.map(normalizeFilter);
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
    conditions.push(`(EXISTS (SELECT 1 FROM JSON_TABLE(regions, '$[*]' COLUMNS (r VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.r) = LOWER($${paramIndex})) OR lower(primary_region) = lower($${paramIndex + 1}))`);
    params_arr.push(params.region, params.region);
    paramIndex += 2;
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
