"use server";

import { sql } from "@/app/lib/db";
import { executeQuery, encodeJsonColumn } from "@/lib/neon";
import {
  REGION_COLUMNS,
  SEARCHABLE_COLUMNS,
  SERVICE_COLUMNS,
  buildAnyColumnCondition,
  likeTerm,
  normalizedJsonLike,
} from "@/lib/escort-filters";

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
  totalBookings: number;  totalReviews: number;
  rating: number;
  totalViews: number;
  credits?: number;
  /** Boost state (migration 008). `boostUntil` past now = boost expired. */
  boostUntil?: string | Date | null;
  boostPriority?: number;
  boostPackageId?: string | null;
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
  height?: string;
  breasts?: string;
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
  gender?: string;
  countyCode?: string;
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  search?: string;
  minRating?: number;
  hasCleanedImages?: boolean;
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

/**
 * `escorts.verification_documents` exists in two shapes in the wild:
 * `submitEscortVerification` writes snake_case (`id_proof`), while older rows
 * carry camelCase (`idProof`). Consumers such as EscortVerificationForm read the
 * camelCase form declared on `Escort`, so normalise here rather than letting the
 * raw column leak through and silently fail to prepopulate.
 *
 * A JSON column can also arrive as a string depending on driver settings, so
 * parse defensively.
 */
function normalizeVerificationDocuments(raw: any): Escort["verificationDocuments"] {
  if (!raw) return undefined;

  let docs: any = raw;
  if (typeof raw === "string") {
    try {
      docs = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (typeof docs !== "object" || docs === null) return undefined;

  const str = (v: any) => (typeof v === "string" && v.trim() ? v : undefined);

  return {
    idProof: str(docs.idProof) ?? str(docs.id_proof),
    idBack: str(docs.idBack) ?? str(docs.id_back),
    selfieWithId: str(docs.selfieWithId) ?? str(docs.selfie_with_id),
    policeClearance: str(docs.policeClearance) ?? str(docs.police_clearance),
  };
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
    height: row.height,
    breasts: row.breasts,
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
    // Boolean(): MySQL tinyint(1) arrives as 0/1, not a boolean. Without
    // this the value contradicts the `isVerified: boolean` contract, and
    // `0 && <X/>` in a render tree emits a literal "0" into the HTML.
    isVerified: Boolean(row.is_verified),
    verificationStatus: row.verification_status,
    verificationDocuments: normalizeVerificationDocuments(
      row.verification_documents,
    ),
    isFeatured: row.is_featured,
    plan: row.plan,
    totalBookings: row.total_bookings,
    totalReviews: row.total_reviews,
    rating: row.rating,
    totalViews: row.total_views,
    credits: row.credits,
    boostUntil: row.boost_until || null,
    boostPriority: Number(row.boost_priority) || 0,
    boostPackageId: row.active_boost_package_id || null,
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

/**
 * JSON columns are matched with LIKE against their lowercased text rather than with
 * `JSON_TABLE`; the rationale and the MySQL correlation bug behind that choice live
 * in `lib/escort-filters.ts`, which is shared with the cleaned-image listing path so
 * /search and /girls filter identically.
 */
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
    conditions.push(`CAST(age AS UNSIGNED) >= $${paramIndex}`);
    params_arr.push(params.minAge);
    paramIndex++;
  }
  if (params.maxAge && params.maxAge > 0) {
    conditions.push(`CAST(age AS UNSIGNED) <= $${paramIndex}`);
    params_arr.push(params.maxAge);
    paramIndex++;
  }
  if (params.minRating && params.minRating > 0) {
    conditions.push(`rating >= $${paramIndex}`);
    params_arr.push(params.minRating);
    paramIndex++;
  }
  if (params.gender && params.gender !== "all") {
    conditions.push(`LOWER(gender) = $${paramIndex}`);
    params_arr.push(params.gender.toLowerCase().trim());
    paramIndex++;
  }
  if (params.hasCleanedImages !== undefined) {
    conditions.push(`has_cleaned_images = $${paramIndex}`);
    params_arr.push(params.hasCleanedImages);
    paramIndex++;
  }
  // `regions` holds slugs ("nairobi_kilimani") while `primary_region` holds the
  // display name ("Kilimani") and `locations` holds per-place town/estate, so all
  // three are searched for a region or town term.
  if (params.region && params.region !== "all") {
    const built = buildAnyColumnCondition(
      REGION_COLUMNS,
      params.region,
      paramIndex,
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
    paramIndex = built.nextIndex;
  }
  if (params.town && params.town !== "all") {
    conditions.push(normalizedJsonLike("locations", paramIndex));
    params_arr.push(likeTerm(params.town));
    paramIndex++;
  }
  if (params.estate && params.estate !== "all") {
    conditions.push(normalizedJsonLike("locations", paramIndex));
    params_arr.push(likeTerm(params.estate));
    paramIndex++;
  }
  if (params.practice && params.practice !== "all") {
    const built = buildAnyColumnCondition(
      SERVICE_COLUMNS,
      params.practice,
      paramIndex,
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
    paramIndex = built.nextIndex;
  }
  if (params.practices && params.practices.length > 0) {
    // Every requested service must be present, in any of the service columns
    for (const practice of params.practices) {
      if (!practice || practice === "all") continue;
      const built = buildAnyColumnCondition(
        SERVICE_COLUMNS,
        practice,
        paramIndex,
      );
      conditions.push(built.clause);
      params_arr.push(...built.params);
      paramIndex = built.nextIndex;
    }
  }
  if (params.category && params.category !== "all") {
    conditions.push(normalizedJsonLike("categories", paramIndex));
    params_arr.push(likeTerm(params.category));
    paramIndex++;
  }
  if (params.categories && params.categories.length > 0) {
    for (const category of params.categories) {
      if (!category || category === "all") continue;
      conditions.push(normalizedJsonLike("categories", paramIndex));
      params_arr.push(likeTerm(category));
      paramIndex++;
    }
  }
  if (params.search) {
    // Free text spans the profile copy *and* the location columns, so searching
    // "nairobi" returns the escorts in Nairobi rather than only the handful whose
    // name or about happens to contain the word.
    const built = buildAnyColumnCondition(
      SEARCHABLE_COLUMNS,
      params.search,
      paramIndex,
    );
    conditions.push(built.clause);
    params_arr.push(...built.params);
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

  // `getEscortsBase` already applied LIMIT/OFFSET for this page. Slicing `rows`
  // again with the same offset dropped every row from page 2 onwards: page 2
  // received 20 rows and then took rows.slice(20, 40), which is empty.
  return {
    escorts: rows.map(convertRowToEscort),
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: validPage * validLimit < total,
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

    // Values are JSON-encoded per column so array/object values cannot break the
    // generated statement; see JSON_COLUMNS/encodeJsonColumn in lib/neon.ts.
    const setField = (column: string, value: any) => {
      setClauses.push(`\`${column}\` = $${paramIndex}`);
      params.push(encodeJsonColumn(column, value));
      paramIndex++;
    };

    if (updates.name !== undefined) setField("name", updates.name);
    if (updates.email !== undefined) setField("email", updates.email);
    if (updates.street !== undefined) setField("street", updates.street);
    if (updates.telephone !== undefined)
      setField("telephone", updates.telephone);
    if (updates.whatsappPhone !== undefined)
      setField("whatsapp_phone", updates.whatsappPhone);
    if (updates.previewPhoto !== undefined)
      setField("preview_photo", updates.previewPhoto);
    if (updates.images !== undefined) setField("images", updates.images);
    if (updates.videos !== undefined) setField("videos", updates.videos);
    if (updates.about !== undefined) setField("about", updates.about);
    if (updates.age !== undefined) setField("age", updates.age);
    if (updates.bustSize !== undefined)
      setField("bust_size", updates.bustSize);
    if (updates.breastSize !== undefined)
      setField("breast_size", updates.breastSize);
    if (updates.weight !== undefined) setField("weight", updates.weight);
    if (updates.height !== undefined) setField("height", updates.height);
    if (updates.breasts !== undefined) setField("breasts", updates.breasts);
    if (updates.nationality !== undefined)
      setField("nationality", updates.nationality);
    if (updates.practices !== undefined)
      setField("practices", updates.practices);
    if (updates.bdsm !== undefined) setField("bdsm", updates.bdsm);
    if (updates.massage !== undefined) setField("massage", updates.massage);
    if (updates.extraServices !== undefined)
      setField("extra_services", updates.extraServices);
    if (updates.categories !== undefined)
      setField("categories", updates.categories);
    if (updates.languages !== undefined)
      setField("languages", updates.languages);
    if (updates.availability !== undefined)
      setField("availability", updates.availability);
    if (updates.openingHours !== undefined)
      setField("opening_hours", updates.openingHours);
    if (updates.ageCategory !== undefined)
      setField("age_category", updates.ageCategory);
    if (updates.character !== undefined)
      setField("character", updates.character);
    if (updates.hairColor !== undefined)
      setField("hair_color", updates.hairColor);
    if (updates.experience !== undefined)
      setField("experience", updates.experience);
    if (updates.regions !== undefined) setField("regions", updates.regions);
    if (updates.primaryRegion !== undefined)
      setField("primary_region", updates.primaryRegion);
    if (updates.county !== undefined) setField("county", updates.county);
    if (updates.countyCode !== undefined)
      setField("county_code", updates.countyCode);
    if (updates.isActive !== undefined)
      setField("is_active", updates.isActive);
    if (updates.isVerified !== undefined)
      setField("is_verified", updates.isVerified);
    if (updates.isFeatured !== undefined)
      setField("is_featured", updates.isFeatured);

    setClauses.push(`updated_at = NOW()`);

    if (setClauses.length === 1) return;

    params.push(id);
    const query = `UPDATE escorts SET ${setClauses.join(", ")} WHERE id = $${params.length}`;
    await executeQuery(query, params);
  } catch (error: any) {
    console.error("Error updating escort:", error);
    throw new Error(`Failed to update escort: ${error?.message || "Unknown error"}`);
  }
}
