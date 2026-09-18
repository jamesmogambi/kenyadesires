"use server";

import { sql } from "@/app/lib/db";
import { executeQuery } from "@/lib/neon";

export interface Location {
  region: string;
  town: string;
  estate: string;
  address: string;
  street: string;
  postalCode: string;
  isActive: boolean;
  notes: string;
  _id?: string;
}

export interface Rate {
  duration: string;
  incall: string;
  outcall: string;
  _id?: string;
}

export interface OpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface Plan {
  type: string;
  isActive: boolean;
  features: string[];
}

export interface Escort {
  id: string;
  name: string;
  username: string;
  slug: string;
  previewPhoto: string;
  labels: string[];
  email: string;
  age: string;
  telephone: string;
  whatsappPhone: string;
  images: string[];
  videos: string[];
  about: string;
  availability: string[];
  ethnicity: string;
  nationality: string;
  bustSize: string;
  weight: string;
  zodiacSign: string;
  sexualOrientation: string;
  gender: string;
  languages: string[];
  categories: string[];
  country: string;
  county: string;
  countyCode: string;
  regions: string[];
  primaryRegion: string;
  locations: Location[];
  source: string;
  practices: string[];
  bdsm: string[];
  massage: string[];
  extraServices: string[];
  agencyId?: string;
  isAgencyOwned?: boolean;
  clerkUserId?: string;
  isAgencyFeatured: boolean;
  isActive: boolean;
  isVerified: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
  verificationDocuments?: {
    idProof?: string;
    idBack?: string;
    selfieWithId?: string;
    policeClearance?: string;
  };
  isFeatured: boolean;
  plan: Plan;
  totalBookings: number;
  totalReviews: number;
  rating: number;
  totalViews: number;
  credits?: number;
  cleanedImages?: string[];
  createdAt: Date;
  updatedAt: Date;
  watermarkStatus?: "pending" | "processing" | "completed" | "failed";
  watermarkError?: string;
  lastProcessedAt?: Date;
  imagesMetadata?: Record<string, any>;
  totalImagesProcessed?: number;
  totalImagesFailed?: number;
  hasCleanedImages?: boolean;
  street?: string;
  workType: string;
  breastSize?: string;
  ageCategory?: string;
  character?: string;
  hairColor?: string;
  experience?: string;
  openingHours?: OpeningHours;
  role?: string;
}

export interface GetEscortsParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  town?: string;
  estate?: string;
  practice?: string;
  practices?: string[];
  category?: string;
  categories?: string[];
  nationality?: string;
  countyCode?: string;
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  search?: string;
  minRating?: number;
  sortBy?:
    | "createdAt"
    | "updatedAt"
    | "age"
    | "totalViews"
    | "rating"
    | "totalBookings";
  sortOrder?: "asc" | "desc";
}

export interface GetEscortsResponse {
  escorts: Escort[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

function normalizeArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "object") {
    const keys = Object.keys(val).sort((a, b) => {
      const an = parseInt(a), bn = parseInt(b);
      if (isNaN(an) && isNaN(bn)) return 0;
      if (isNaN(an)) return 1;
      if (isNaN(bn)) return -1;
      return an - bn;
    });
    return keys.map((k) => String(val[k]));
  }
  return [String(val)];
}

function convertRowToEscort(row: any): Escort {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    slug: row.slug,
    previewPhoto: row.preview_photo,
    labels: normalizeArray(row.labels),
    email: row.email,
    age: row.age,
    telephone: row.telephone,
    whatsappPhone: row.whatsapp_phone,
    images: normalizeArray(row.images),
    videos: normalizeArray(row.videos),
    about: row.about,
    availability: normalizeArray(row.availability),
    ethnicity: row.ethnicity,
    nationality: row.nationality,
    bustSize: row.bust_size,
    breastSize: row.bust_size,
    weight: row.weight,
    zodiacSign: row.zodiac_sign,
    sexualOrientation: row.sexual_orientation,
    gender: row.gender,
    languages: normalizeArray(row.languages),
    categories: normalizeArray(row.categories),
    country: row.country,
    county: row.county,
    countyCode: row.county_code,
    regions: normalizeArray(row.regions),
    primaryRegion: row.primary_region,
    locations: row.locations || [],
    source: row.source,
    practices: normalizeArray(row.practices),
    bdsm: normalizeArray(row.bdsm),
    massage: normalizeArray(row.massage),
    extraServices: normalizeArray(row.extra_services),
    role: row.role,
    openingHours: row.opening_hours,
    ageCategory: row.age_category,
    character: row.character,
    hairColor: row.hair_color,
    experience: row.experience,
    agencyId: row.agency_id,
    isAgencyOwned: row.is_agency_owned,
    clerkUserId: row.clerk_user_id,
    isAgencyFeatured: row.is_agency_featured,
    isActive: row.is_active,
    isVerified: row.is_verified,
    verificationStatus: row.verification_status,
    verificationDocuments: row.verification_documents,
    isFeatured: row.is_featured,
    plan: row.plan,
    totalBookings: row.total_bookings,
    totalReviews: row.total_reviews,
    rating: row.rating,
    totalViews: row.total_views,
    credits: row.credits,
    cleanedImages: normalizeArray(row.cleaned_images),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    watermarkStatus: row.watermark_status,
    watermarkError: row.watermark_error,
    lastProcessedAt: row.last_processed_at,
    imagesMetadata: row.images_metadata,
    totalImagesProcessed: row.total_images_processed,
    totalImagesFailed: row.total_images_failed,
    hasCleanedImages: row.has_cleaned_images,
    street: row.street,
    workType: row.work_type,
  };
}

function buildWhereClause(
  params: GetEscortsParams,
  paramIndex: number,
): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params_arr: any[] = [];

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
  if (params.countyCode && params.countyCode !== "all") {
    conditions.push(`county_code = $${paramIndex}`);
    params_arr.push(params.countyCode);
    paramIndex++;
  }
  if (params.nationality && params.nationality !== "all") {
    conditions.push(`nationality = $${paramIndex}`);
    params_arr.push(params.nationality);
    paramIndex++;
  }
  if (params.minAge && params.minAge > 0) {
    conditions.push(`CAST(age AS INTEGER) >= $${paramIndex}`);
    params_arr.push(params.minAge);
    paramIndex++;
  }
  if (params.maxAge && params.maxAge > 0) {
    conditions.push(`CAST(age AS INTEGER) <= $${paramIndex}`);
    params_arr.push(params.maxAge);
    paramIndex++;
  }
  if (params.minRating && params.minRating > 0) {
    conditions.push(`rating >= $${paramIndex}`);
    params_arr.push(params.minRating);
    paramIndex++;
  }
  if (params.practice && params.practice !== "all") {
    conditions.push(`EXISTS (SELECT 1 FROM unnest(practices) p WHERE lower(p) = lower($${paramIndex}))`);
    params_arr.push(params.practice);
    paramIndex++;
  }
  if (params.practices && params.practices.length > 0) {
    conditions.push(`practices && $${paramIndex}::text[]`);
    params_arr.push(params.practices);
    paramIndex++;
  }
  if (params.categories && params.categories.length > 0) {
    conditions.push(`categories && $${paramIndex}::text[]`);
    params_arr.push(params.categories);
    paramIndex++;
  }
  if (params.search) {
    const searchTerm = `%${params.search.toLowerCase()}%`;
    conditions.push(
      `(LOWER(name) LIKE $${paramIndex} OR LOWER(username) LIKE $${paramIndex} OR LOWER(about) LIKE $${paramIndex})`,
    );
    params_arr.push(searchTerm, searchTerm, searchTerm);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params: params_arr,
  };
}

function getValidSortField(sortBy?: string): string {
  const validFields = [
    "created_at",
    "updated_at",
    "age",
    "total_views",
    "rating",
    "total_bookings",
  ];
  if (!sortBy) return "created_at";
  const field = sortBy
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase();
  return validFields.includes(field) ? field : "created_at";
}

async function getEscortsBase(
  params: GetEscortsParams = {},
): Promise<{ rows: any[]; total: number }> {
  const { page = 1, limit = 20 } = params;
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));

  const sortField = getValidSortField(params.sortBy);
  const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";

  const where = buildWhereClause(params, 1);

  const totalQuery = `SELECT COUNT(*) as count FROM escorts ${where.clause}`;
  const totalResult: any[] = await executeQuery(totalQuery, where.params);
  const total = parseInt(totalResult[0]?.count || "0", 10);

  const offset = (validPage - 1) * validLimit;
  const dataQuery = `SELECT * FROM escorts ${where.clause} ORDER BY ${sortField} ${sortOrder}, created_at DESC LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`;
  const dataParams = [...where.params, validLimit, offset];
  const rows: any[] = await executeQuery(dataQuery, dataParams);

  return { rows, total };
}

async function getEscorts(params: GetEscortsParams = {}): Promise<GetEscortsResponse> {
  const { rows, total } = await getEscortsBase(params);
  const { page = 1, limit = 20 } = params;
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const startIndex = (validPage - 1) * validLimit;
  const endIndex = Math.min(startIndex + validLimit, total);
  const paginated = rows.slice(startIndex, endIndex);

  return {
    escorts: paginated.map(convertRowToEscort),
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: endIndex < total,
  };
}

export { getEscorts };

export async function getEscortById(id: string): Promise<Escort | null> {
  try {
    const rows: any[] = await sql`
      SELECT * FROM escorts WHERE id = ${id}
    `;
    if (!rows || rows.length === 0) return null;
    return convertRowToEscort(rows[0]);
  } catch (error) {
    console.error("Error fetching escort by ID:", error);
    return null;
  }
}

export async function getEscortsSafe(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  const result = await getEscorts(params);
  if (!result.escorts) {
    return { ...result, escorts: [] };
  }
  return result;
}

export async function hasEscorts(
  params: GetEscortsParams = {},
): Promise<boolean> {
  const result = await getEscorts({ ...params, limit: 1 });
  return result.total > 0;
}

export async function getEscortsByCounty(
  countyCode: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    county: countyCode,
    isActive: true,
    limit,
    page,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
}

export async function getEscortsByRegion(
  regionId: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    region: regionId,
    isActive: true,
    limit,
    page,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
}

export async function getEscortsByPractice(
  practice: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    practice,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

export async function getEscortsByPractices(
  practices: string[],
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  if (practices.length === 0) return getEscorts({ isActive: true, limit, page });
  return getEscorts({
    practices,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

export async function getEscortsByCategory(
  category: string,
  limit: number = 20,
  page: number = 1,
): Promise<GetEscortsResponse> {
  return getEscorts({
    category,
    isActive: true,
    limit,
    page,
    sortBy: "rating",
    sortOrder: "desc",
  });
}

export async function getEscortsWithClientFiltering(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  const { page = 1, limit = 20 } = params;
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));

  const { rows, total } = await getEscortsBase(params);
  const escorts = rows.map(convertRowToEscort);

  const startIndex = (validPage - 1) * validLimit;
  const endIndex = Math.min(startIndex + validLimit, total);
  const paginatedEscorts = escorts.slice(startIndex, endIndex);

  return {
    escorts: paginatedEscorts,
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: endIndex < total,
  };
}

export const convertQueryDocToEscort = async (row: any): Promise<Escort> => {
  return convertRowToEscort(row);
};

const BDSM_TERMS = [
  "BDSM", "bdsm", "Domination", "domination", "Submission", "submission",
  "Bondage", "bondage", "Discipline", "discipline", "Sadomasochism", "sadomasochism",
  "Dominatrix", "dominatrix", "Mistress", "mistress", "Slave", "slave", "Master", "master",
  "Kinky", "kinky", "Fetish", "fetish", "Spanking", "spanking", "Whipping", "whipping",
  "Role play", "role play", "Roleplay", "roleplay", "Leather", "leather", "Latex", "latex",
  "Pegging", "pegging", "Strap-on", "strap-on",
];

const EROTIC_MASSAGE_TERMS = [
  "erotic massage", "erotic", "massage", "body to body", "sensual massage",
  "nuru massage", "tantric massage", "lingam massage", "yoni massage", "b2b", "body-to-body",
];

function isBDSMPractice(practice: string): boolean {
  const lower = practice.toLowerCase();
  return BDSM_TERMS.some((term) => lower.includes(term));
}

function isEroticMassagePractice(practice: string): boolean {
  const lower = practice.toLowerCase();
  return EROTIC_MASSAGE_TERMS.some((term) => lower.includes(term));
}

export async function getBDSMEscortsOptimized(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const { page = 1, limit = 20 } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const where = buildWhereClause(
      { ...params, practice: undefined, practices: undefined },
      1,
    );

    const sortField = getValidSortField(params.sortBy);
    const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";

    const totalQuery = `SELECT COUNT(*) as count FROM escorts ${where.clause}`;
    const totalResult: any[] = await executeQuery(totalQuery, where.params);
    const total = parseInt(totalResult[0]?.count || "0", 10);

    const offset = (validPage - 1) * validLimit;
    const dataQuery = `SELECT * FROM escorts ${where.clause} ORDER BY ${sortField} ${sortOrder}, created_at DESC LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`;
    const dataParams = [...where.params, validLimit, offset];
    const rows: any[] = await executeQuery(dataQuery, dataParams);

    const escorts = rows
      .map(convertRowToEscort)
      .filter((escort) => {
        if (!escort.practices || escort.practices.length === 0) return false;
        return escort.practices.some((p) => isBDSMPractice(p));
      });

    const startIndex = (validPage - 1) * validLimit;
    const endIndex = Math.min(startIndex + validLimit, escorts.length);
    const paginated = escorts.slice(startIndex, endIndex);

    return {
      escorts: paginated,
      total: escorts.length,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(escorts.length / validLimit)),
      hasMore: endIndex < escorts.length,
    };
  } catch (error) {
    console.error("Error fetching BDSM escorts:", error);
    return { escorts: [], total: 0, page: params.page || 1, totalPages: 0, hasMore: false };
  }
}

export async function getEroticMassageEscortsOptimized(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    const { page = 1, limit = 20 } = params;
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    const where = buildWhereClause(
      { ...params, practice: undefined, practices: undefined },
      1,
    );

    const sortField = getValidSortField(params.sortBy);
    const sortOrder = params.sortOrder === "asc" ? "ASC" : "DESC";

    const totalQuery = `SELECT COUNT(*) as count FROM escorts ${where.clause}`;
    const totalResult: any[] = await executeQuery(totalQuery, where.params);
    const total = parseInt(totalResult[0]?.count || "0", 10);

    const offset = (validPage - 1) * validLimit;
    const dataQuery = `SELECT * FROM escorts ${where.clause} ORDER BY ${sortField} ${sortOrder}, created_at DESC LIMIT $${where.params.length + 1} OFFSET $${where.params.length + 2}`;
    const dataParams = [...where.params, validLimit, offset];
    const rows: any[] = await executeQuery(dataQuery, dataParams);

    const escorts = rows
      .map(convertRowToEscort)
      .filter((escort) => {
        if (!escort.practices || escort.practices.length === 0) return false;
        return escort.practices.some((p) => isEroticMassagePractice(p));
      });

    const startIndex = (validPage - 1) * validLimit;
    const endIndex = Math.min(startIndex + validLimit, escorts.length);
    const paginated = escorts.slice(startIndex, endIndex);

    return {
      escorts: paginated,
      total: escorts.length,
      page: validPage,
      totalPages: Math.max(1, Math.ceil(escorts.length / validLimit)),
      hasMore: endIndex < escorts.length,
    };
  } catch (error) {
    console.error("Error fetching erotic massage escorts:", error);
    return { escorts: [], total: 0, page: params.page || 1, totalPages: 0, hasMore: false };
  }
}

export async function updateEscort(
  id: string,
  updates: Record<string, any>,
): Promise<void> {
  try {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex}`);
      params.push(updates.name);
      paramIndex++;
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${paramIndex}`);
      params.push(updates.email);
      paramIndex++;
    }
    if (updates.street !== undefined) {
      setClauses.push(`street = $${paramIndex}`);
      params.push(updates.street);
      paramIndex++;
    }
    if (updates.telephone !== undefined) {
      setClauses.push(`telephone = $${paramIndex}`);
      params.push(updates.telephone);
      paramIndex++;
    }
    if (updates.whatsappPhone !== undefined) {
      setClauses.push(`whatsapp_phone = $${paramIndex}`);
      params.push(updates.whatsappPhone);
      paramIndex++;
    }
    if (updates.about !== undefined) {
      setClauses.push(`about = $${paramIndex}`);
      params.push(updates.about);
      paramIndex++;
    }
    if (updates.age !== undefined) {
      setClauses.push(`age = $${paramIndex}`);
      params.push(updates.age);
      paramIndex++;
    }
    if (updates.nationality !== undefined) {
      setClauses.push(`nationality = $${paramIndex}`);
      params.push(updates.nationality);
      paramIndex++;
    }
    if (updates.practices !== undefined) {
      setClauses.push(`practices = $${paramIndex}`);
      params.push(updates.practices);
      paramIndex++;
    }
    if (updates.bdsm !== undefined) {
      setClauses.push(`bdsm = $${paramIndex}`);
      params.push(updates.bdsm);
      paramIndex++;
    }
    if (updates.massage !== undefined) {
      setClauses.push(`massage = $${paramIndex}`);
      params.push(updates.massage);
      paramIndex++;
    }
    if (updates.extraServices !== undefined) {
      setClauses.push(`extra_services = $${paramIndex}`);
      params.push(updates.extraServices);
      paramIndex++;
    }
    if (updates.categories !== undefined) {
      setClauses.push(`categories = $${paramIndex}`);
      params.push(updates.categories);
      paramIndex++;
    }
    if (updates.languages !== undefined) {
      setClauses.push(`languages = $${paramIndex}`);
      params.push(updates.languages);
      paramIndex++;
    }
    if (updates.regions !== undefined) {
      setClauses.push(`regions = $${paramIndex}`);
      params.push(updates.regions);
      paramIndex++;
    }
    if (updates.primaryRegion !== undefined) {
      setClauses.push(`primary_region = $${paramIndex}`);
      params.push(updates.primaryRegion);
      paramIndex++;
    }
    if (updates.county !== undefined) {
      setClauses.push(`county = $${paramIndex}`);
      params.push(updates.county);
      paramIndex++;
    }
    if (updates.countyCode !== undefined) {
      setClauses.push(`county_code = $${paramIndex}`);
      params.push(updates.countyCode);
      paramIndex++;
    }
    if (updates.isActive !== undefined) {
      setClauses.push(`is_active = $${paramIndex}`);
      params.push(updates.isActive);
      paramIndex++;
    }
    if (updates.isVerified !== undefined) {
      setClauses.push(`is_verified = $${paramIndex}`);
      params.push(updates.isVerified);
      paramIndex++;
    }
    if (updates.isFeatured !== undefined) {
      setClauses.push(`is_featured = $${paramIndex}`);
      params.push(updates.isFeatured);
      paramIndex++;
    }

    setClauses.push(`updated_at = NOW()`);

    if (setClauses.length === 0) return;

    params.push(id);
    const query = `UPDATE escorts SET ${setClauses.join(", ")} WHERE id = $${params.length}`;
    await executeQuery(query, params);
  } catch (error) {
    console.error("Error updating escort:", error);
    throw new Error("Failed to update escort");
  }
}
