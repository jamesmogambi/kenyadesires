// ✅ Lightweight metadata fetch - only gets what's needed (no caching for girls page)
import { executeQuery } from "@/lib/neon";

const normalize = (val?: string) => (val || "").toLowerCase().trim();
const normalizeSlug = (val?: string) => normalize(val).replace(/[-_]/g, " ");

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MASSAGE_TYPE_TERMS = [
  "erotic massage", "erotic", "massage", "body to body",
  "sensual massage", "nuru massage", "tantric massage",
  "lingam massage", "yoni massage", "b2b", "body-to-body",
  "sensual", "tantric", "nuru", "lingam", "yoni",
  "four hands", "4 hands",
];

const BDSM_TERMS = [
  "bdsm", "domination", "submission", "bondage", "discipline",
  "sadomasochism", "dominatrix", "mistress", "slave", "master",
  "kinky", "fetish", "spanking", "whipping", "role play", "roleplay",
  "leather", "latex", "pegging", "strap-on",
];

type FilterType = "none" | "massage" | "bdsm";

const SERVICE_ARRAYS_SQL_MYSQL = "(JSON_MERGE_PRESERVE(practices, bdsm, massage, extra_services))";

function buildCategoryCondition(filterType: FilterType): string | null {
  if (filterType === "none") return null;
  const terms = filterType === "massage" ? MASSAGE_TYPE_TERMS : BDSM_TERMS;
  const escapedTerms = terms.map(escapeRegex).join("|");
  return `EXISTS (SELECT 1 FROM JSON_TABLE(${SERVICE_ARRAYS_SQL_MYSQL}, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE jt.p REGEXP '${escapedTerms}')`;
}

function buildTypeCondition(
  practiceOrMassageType: string,
  paramIndex: number,
): { clause: string; param: string } {
  const keyword = normalizeSlug(practiceOrMassageType);
  const clause = `EXISTS (SELECT 1 FROM JSON_TABLE(${SERVICE_ARRAYS_SQL_MYSQL}, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(REPLACE(REPLACE(jt.p, '-', ' '), '_', ' ')) LIKE CONCAT('%', $${paramIndex}, '%'))`;
  return { clause, param: keyword };
}

function buildRegionCondition(paramIndex: number, paramIndex2: number): string {
  return `(EXISTS (SELECT 1 FROM JSON_TABLE(regions, '$[*]' COLUMNS (r VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.r) = LOWER($${paramIndex})) OR LOWER(primary_region) = LOWER($${paramIndex2}))`;
}

function buildPracticeCondition(paramIndex1: number, paramIndex2: number, paramIndex3: number, paramIndex4: number): string {
  return `(
    EXISTS (SELECT 1 FROM JSON_TABLE(practices, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.p) = LOWER($${paramIndex1}))
    OR EXISTS (SELECT 1 FROM JSON_TABLE(bdsm, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.p) = LOWER($${paramIndex2}))
    OR EXISTS (SELECT 1 FROM JSON_TABLE(massage, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.p) = LOWER($${paramIndex3}))
    OR EXISTS (SELECT 1 FROM JSON_TABLE(extra_services, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt WHERE LOWER(jt.p) = LOWER($${paramIndex4}))
  )`;
}

function buildBaseConditions(
  params: { county?: string; region?: string; practice?: string; massageType?: string },
  filterType: FilterType,
  practiceOrMassageType?: string,
): { conditions: string[]; params: any[] } {
  const { county, region, practice } = params;
  const hasRegionFilter = !!(region && region !== "all");
  const hasPracticeFilter = !!(practice && practice !== "all");
  const hasTypeFilter = filterType !== "none" && !!practiceOrMassageType && practiceOrMassageType !== "all";
  const hasCategoryFilter = filterType !== "none" && !hasTypeFilter;

  const conditions: string[] = ["is_active = true"];
  const queryParams: any[] = [];
  let paramIndex = 1;

  if (county && county !== "all") {
    conditions.push(`county = $${paramIndex}`);
    queryParams.push(county);
    paramIndex++;
  }

  if (hasRegionFilter) {
    conditions.push(buildRegionCondition(paramIndex, paramIndex + 1));
    queryParams.push(region, region);
    paramIndex += 2;
  }

  if (hasPracticeFilter) {
    conditions.push(buildPracticeCondition(paramIndex, paramIndex + 1, paramIndex + 2, paramIndex + 3));
    queryParams.push(practice, practice, practice, practice);
    paramIndex += 4;
  }

  if (hasCategoryFilter) {
    const categoryCondition = buildCategoryCondition(filterType);
    if (categoryCondition) {
      conditions.push(categoryCondition);
    }
  }

  if (hasTypeFilter) {
    const { clause, param } = buildTypeCondition(practiceOrMassageType!, paramIndex);
    conditions.push(clause);
    queryParams.push(param);
    paramIndex++;
  }

  return { conditions, params: queryParams };
}

// ============================================
// GIRLS ESCORTS METADATA HELPERS
// ============================================

export async function getEscortCountForMetadata(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<number> {
  return countEscorts(params, "none");
}

export async function getFirstEscortForMetadata(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<{
  previewPhoto?: string;
  name?: string;
  username?: string;
} | null> {
  return findFirstEscort(params, "none");
}

// ============================================
// MASSAGE ESCORTS METADATA HELPERS
// ============================================

export async function getMassageEscortCount(params: {
  county?: string;
  region?: string;
  massageType?: string;
}): Promise<number> {
  return countEscorts(params, "massage", params.massageType);
}

export async function getFirstMassageEscort(params: {
  county?: string;
  region?: string;
  massageType?: string;
}): Promise<{ previewPhoto?: string; name?: string; username?: string } | null> {
  return findFirstEscort(params, "massage", params.massageType);
}

// ============================================
// BDSM ESCORTS METADATA HELPERS
// ============================================

export async function getBDSMEscortCount(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<number> {
  return countEscorts(params, "bdsm", params.practice);
}

export async function getFirstBDSMEscort(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<{ previewPhoto?: string; name?: string; username?: string } | null> {
  return findFirstEscort(params, "bdsm", params.practice);
}

// ============================================
// SHARED INTERNAL HELPERS
// ============================================

async function countEscorts(
  params: { county?: string; region?: string; practice?: string; massageType?: string },
  filterType: FilterType,
  practiceOrMassageType?: string,
): Promise<number> {
  try {
    const { conditions, params: queryParams } = buildBaseConditions(
      params,
      filterType,
      practiceOrMassageType,
    );

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const query = `SELECT COUNT(*) as count FROM escorts ${whereClause}`;
    const rows = await executeQuery(query, queryParams);
    return parseInt(rows[0]?.count || "0", 10);
  } catch (error) {
    console.error("Error getting escort count:", error);
    return 0;
  }
}

async function findFirstEscort(
  params: { county?: string; region?: string; practice?: string; massageType?: string },
  filterType: FilterType,
  practiceOrMassageType?: string,
): Promise<{ previewPhoto?: string; name?: string; username?: string } | null> {
  try {
    const { conditions, params: queryParams } = buildBaseConditions(
      params,
      filterType,
      practiceOrMassageType,
    );

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const query = `SELECT preview_photo, name, username FROM escorts ${whereClause} ORDER BY created_at DESC LIMIT 1`;
    const rows = await executeQuery(query, queryParams);

    if (rows.length === 0) return null;

    return {
      previewPhoto: rows[0].preview_photo,
      name: rows[0].name,
      username: rows[0].username,
    };
  } catch (error) {
    console.error("Error getting first escort for metadata:", error);
    return null;
  }
}

// ============================================
// AGENCIES METADATA HELPERS
// ============================================

export async function getAgenciesCount(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<number> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
    const queryParams = new URLSearchParams();
    queryParams.append("status", "active");
    queryParams.append("limit", "1");

    if (params.county && params.county !== "all") {
      queryParams.append("county", params.county);
    }
    if (params.region && params.region !== "all") {
      queryParams.append("region", params.region);
    }
    if (params.business && params.business !== "all") {
      queryParams.append("business", params.business);
    }

    const res = await fetch(
      `${baseUrl}/api/agencies?${queryParams.toString()}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return 0;
    }

    const data = await res.json();
    return data.total || 0;
  } catch (error) {
    console.error("Error getting agencies count:", error);
    return 0;
  }
}

export async function getFirstAgency(params: {
  county?: string;
  region?: string;
  business?: string;
}): Promise<{ previewPhoto?: string; name?: string; slug?: string } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
    const queryParams = new URLSearchParams();
    queryParams.append("status", "active");
    queryParams.append("limit", "1");

    if (params.county && params.county !== "all") {
      queryParams.append("county", params.county);
    }
    if (params.region && params.region !== "all") {
      queryParams.append("region", params.region);
    }
    if (params.business && params.business !== "all") {
      queryParams.append("business", params.business);
    }

    const res = await fetch(
      `${baseUrl}/api/agencies?${queryParams.toString()}`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const agencies = data.agencies || [];

    if (agencies.length === 0) return null;

    return {
      previewPhoto: agencies[0].previewPhoto || agencies[0].logo,
      name: agencies[0].name,
      slug: agencies[0].slug,
    };
  } catch (error) {
    console.error("Error getting first agency:", error);
    return null;
  }
}

export async function getAgencyForMetadata(slug: string): Promise<{
  name: string;
  county: string;
  region: string;
  description?: string;
  previewPhoto?: string;
  logo?: string;
} | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
    const res = await fetch(
      `${baseUrl}/api/agencies/${slug}?fields=name,county,region,description,previewPhoto,logo`,
      { cache: "no-store" },
    );

    if (!res.ok) {
      return null;
    }

    const result = await res.json();
    if (!result.success) {
      return null;
    }

    const agency = result.data;
    return {
      name: agency.name,
      county: agency.county,
      region: agency.region,
      description: agency.description,
      previewPhoto: agency.previewPhoto || agency.logo,
      logo: agency.logo,
    };
  } catch (error) {
    console.error("Error getting agency for metadata:", error);
    return null;
  }
}
