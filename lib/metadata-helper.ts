// ✅ Lightweight metadata fetch - only gets what's needed (no caching for girls page)
import { adminDb } from "@/lib/firebase-admin";

const normalize = (val?: string) => (val || "").toLowerCase().trim();
const normalizeSlug = (val?: string) => normalize(val).replace(/[-_]/g, " ");

function normalizeArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object" && typeof val.map === "function") return val;
  if (val && typeof val === "object") return Object.values(val);
  return [];
}

const SERVICE_ARRAYS = ["practices", "bdsm", "massage", "extraServices"] as const;

function docMatchesRegion(d: any, region?: string): boolean {
  if (!region || region === "all") return true;
  const regionLower = normalize(region);
  return (
    normalizeArray(d.regions).some((r: string) => normalize(r) === regionLower) ||
    normalize(d.primaryRegion) === regionLower
  );
}

function docHasPractice(d: any, practice: string): boolean {
  const practiceLower = normalize(practice);
  return SERVICE_ARRAYS.some((field) => {
    const arr = normalizeArray(d[field]);
    return arr.some((p: string) => normalize(p) === practiceLower);
  });
}

const MASSAGE_TYPE_TERMS = [
  "erotic massage", "erotic", "massage", "body to body",
  "sensual massage", "nuru massage", "tantric massage",
  "lingam massage", "yoni massage", "b2b", "body-to-body",
  "sensual", "tantric", "nuru", "lingam", "yoni",
  "four hands", "4 hands",
];

function isMassageTerm(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return MASSAGE_TYPE_TERMS.some((term) => lower.includes(term));
}

function docIsMassageEscort(d: any): boolean {
  return SERVICE_ARRAYS.some((field) => {
    const arr = normalizeArray(d[field]);
    return arr.some((p: string) => p && isMassageTerm(p));
  });
}

function docMatchesMassageType(d: any, massageType: string): boolean {
  const keyword = normalizeSlug(massageType);
  return SERVICE_ARRAYS.some((field) => {
    const arr = normalizeArray(d[field]);
    return arr.some((p: string) => p && normalizeSlug(p).includes(keyword));
  });
}

const BDSM_TERMS = [
  "bdsm", "domination", "submission", "bondage", "discipline",
  "sadomasochism", "dominatrix", "mistress", "slave", "master",
  "kinky", "fetish", "spanking", "whipping", "role play", "roleplay",
  "leather", "latex", "pegging", "strap-on",
];

function docIsBDSMescort(d: any): boolean {
  return SERVICE_ARRAYS.some((field) => {
    const arr = normalizeArray(d[field]);
    return arr.some((p: string) => p && BDSM_TERMS.some((term) => p.toLowerCase().includes(term)));
  });
}

function docMatchesBDSMPractice(d: any, practice: string): boolean {
  const keyword = normalizeSlug(practice);
  return SERVICE_ARRAYS.some((field) => {
    const arr = normalizeArray(d[field]);
    return arr.some((p: string) => p && normalizeSlug(p).includes(keyword));
  });
}

const METADATA_FIELDS = [
  "previewPhoto", "name", "username", "county", "regions", "primaryRegion",
  "practices", "bdsm", "massage", "extraServices", "isActive",
];

const BATCH_SIZE = 1000;
const MAX_COUNT = 10000;
const MAX_BATCHES = 10;

type FilterType = "none" | "massage" | "bdsm";

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
  skipArrayContains?: boolean,
): Promise<number> {
  try {
    const { county, region, practice } = params;
    const hasRegionFilter = !!(region && region !== "all");
    const hasPracticeFilter = !!(practice && practice !== "all");
    const hasTypeFilter = filterType !== "none" && practiceOrMassageType && practiceOrMassageType !== "all";
    const hasCategoryFilter = filterType !== "none" && !hasTypeFilter;

    let query: any = adminDb
      .collection("escorts")
      .select(...METADATA_FIELDS)
      .where("isActive", "==", true);

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    let useArrayContains = !skipArrayContains;
    if (hasRegionFilter && useArrayContains) {
      query = query.where("regions", "array-contains", region!);
    }

    let count = 0;
    let lastDoc: any = null;
    let batchesRead = 0;

    while (batchesRead < MAX_BATCHES) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(BATCH_SIZE).get();
      batchesRead++;

      if (snapshot.empty) break;

      const docs = snapshot.docs.map((doc: any) => doc.data());

      if (hasRegionFilter || hasPracticeFilter || hasCategoryFilter || hasTypeFilter) {
        const filtered = docs.filter((d: any) => {
          if (hasRegionFilter && !docMatchesRegion(d, region!)) return false;
          if (hasPracticeFilter && !docHasPractice(d, practice!)) return false;
          if (hasCategoryFilter) {
            if (filterType === "massage" && !docIsMassageEscort(d)) return false;
            if (filterType === "bdsm" && !docIsBDSMescort(d)) return false;
          }
          if (hasTypeFilter) {
            if (filterType === "massage" && !docMatchesMassageType(d, practiceOrMassageType!)) return false;
            if (filterType === "bdsm" && !docMatchesBDSMPractice(d, practiceOrMassageType!)) return false;
          }
          return true;
        });
        count += filtered.length;
      } else {
        count += docs.length;
      }

      if (count >= MAX_COUNT) {
        count = MAX_COUNT;
        break;
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < BATCH_SIZE) break;
    }

    // Fallback: if array-contains returned 0 and we have region filter, retry without it
    if (count === 0 && hasRegionFilter && useArrayContains) {
      return countEscorts(
        { county, region, practice, massageType: params.massageType },
        filterType,
        practiceOrMassageType,
        true, // skipArrayContains
      );
    }

    return count;
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
    const { county, region, practice } = params;
    const hasRegionFilter = !!(region && region !== "all");
    const hasPracticeFilter = !!(practice && practice !== "all");
    const hasTypeFilter = filterType !== "none" && practiceOrMassageType && practiceOrMassageType !== "all";
    const hasCategoryFilter = filterType !== "none" && !hasTypeFilter;

    let query: any = adminDb
      .collection("escorts")
      .select(...METADATA_FIELDS)
      .where("isActive", "==", true);

    if (county && county !== "all") {
      query = query.where("county", "==", county);
    }

    let lastDoc: any = null;
    let batchesRead = 0;

    while (batchesRead < MAX_BATCHES) {
      let pageQuery = query;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(BATCH_SIZE).get();
      batchesRead++;

      if (snapshot.empty) break;

      const docs = snapshot.docs.map((doc: any) => doc.data());

      const filtered = docs.filter((d: any) => {
        if (hasRegionFilter && !docMatchesRegion(d, region!)) return false;
        if (hasPracticeFilter && !docHasPractice(d, practice!)) return false;
        if (hasCategoryFilter) {
          if (filterType === "massage" && !docIsMassageEscort(d)) return false;
          if (filterType === "bdsm" && !docIsBDSMescort(d)) return false;
        }
        if (hasTypeFilter) {
          if (filterType === "massage" && !docMatchesMassageType(d, practiceOrMassageType!)) return false;
          if (filterType === "bdsm" && !docMatchesBDSMPractice(d, practiceOrMassageType!)) return false;
        }
        return true;
      });

      if (filtered.length > 0) {
        return {
          previewPhoto: filtered[0].previewPhoto,
          name: filtered[0].name,
          username: filtered[0].username,
        };
      }

      lastDoc = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < BATCH_SIZE) break;
    }

    return null;
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
