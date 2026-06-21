// ✅ Lightweight metadata fetch - only gets what's needed
import { adminDb } from "@/lib/firebase-admin";
import { REVALIDATE_TIME } from "./cache-config";

export async function getEscortCountForMetadata(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<number> {
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(500).get();
    let count = snapshot.size;

    // Client-side filtering for metadata count
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

    if (params.practice && params.practice !== "all") {
      docs = docs.filter((d: any) => d.practices?.includes(params.practice));
    }

    return docs.length;
  } catch (error) {
    console.error("Error getting count for metadata:", error);
    return 0;
  }
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
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(20).get();
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

    if (params.practice && params.practice !== "all") {
      docs = docs.filter((d: any) => d.practices?.includes(params.practice));
    }

    if (docs.length === 0) return null;

    return {
      previewPhoto: docs[0].previewPhoto,
      name: docs[0].name,
      username: docs[0].username,
    };
  } catch (error) {
    console.error("Error getting first escort for metadata:", error);
    return null;
  }
}

// ============================================
// MASSAGE ESCORTS METADATA HELPERS
// ============================================

/**
 * Get count of massage escorts for metadata (lightweight)
 */
export async function getMassageEscortCount(params: {
  county?: string;
  region?: string;
  massageType?: string;
}): Promise<number> {
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(500).get();
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

    // Filter by erotic massage
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

    docs = docs.filter((d: any) => {
      if (!d.practices) return false;
      return d.practices.some((p: string) => {
        const lower = p.toLowerCase();
        return eroticMassageTerms.some((term) =>
          lower.includes(term.toLowerCase()),
        );
      });
    });

    return docs.length;
  } catch (error) {
    console.error("Error getting massage count:", error);
    return 0;
  }
}

/**
 * Get first massage escort for metadata (lightweight)
 */
export async function getFirstMassageEscort(params: {
  county?: string;
  region?: string;
  massageType?: string;
}): Promise<{
  previewPhoto?: string;
  name?: string;
  username?: string;
} | null> {
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(20).get();
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

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

    docs = docs.filter((d: any) => {
      if (!d.practices) return false;
      return d.practices.some((p: string) => {
        const lower = p.toLowerCase();
        return eroticMassageTerms.some((term) =>
          lower.includes(term.toLowerCase()),
        );
      });
    });

    if (docs.length === 0) return null;

    return {
      previewPhoto: docs[0].previewPhoto,
      name: docs[0].name,
      username: docs[0].username,
    };
  } catch (error) {
    console.error("Error getting first massage escort:", error);
    return null;
  }
}

// ============================================
// BDSM ESCORTS METADATA HELPERS
// ============================================

/**
 * Get count of BDSM escorts for metadata (lightweight)
 */
export async function getBDSMEscortCount(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<number> {
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(500).get();
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

    // Filter by BDSM practice
    const bdsmTerms = [
      "BDSM",
      "bdsm",
      "Domination",
      "domination",
      "Submission",
      "submission",
      "Bondage",
      "bondage",
      "Discipline",
      "discipline",
      "Sadomasochism",
      "sadomasochism",
      "Dominatrix",
      "dominatrix",
      "Mistress",
      "mistress",
      "Slave",
      "slave",
      "Master",
      "master",
      "Kinky",
      "kinky",
      "Fetish",
      "fetish",
      "Spanking",
      "spanking",
      "Whipping",
      "whipping",
      "Role play",
      "role play",
      "Roleplay",
      "roleplay",
      "Leather",
      "leather",
      "Latex",
      "latex",
      "Pegging",
      "pegging",
      "Strap-on",
      "strap-on",
    ];

    docs = docs.filter((d: any) => {
      if (!d.practices) return false;
      return d.practices.some((p: string) => {
        const lower = p.toLowerCase();
        return bdsmTerms.some((term) => lower.includes(term.toLowerCase()));
      });
    });

    return docs.length;
  } catch (error) {
    console.error("Error getting BDSM count:", error);
    return 0;
  }
}

/**
 * Get first BDSM escort for metadata (lightweight)
 */
export async function getFirstBDSMEscort(params: {
  county?: string;
  region?: string;
  practice?: string;
}): Promise<{
  previewPhoto?: string;
  name?: string;
  username?: string;
} | null> {
  try {
    let query: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (params.county && params.county !== "all") {
      query = query.where("county", "==", params.county);
    }

    const snapshot = await query.limit(20).get();
    let docs = snapshot.docs.map((doc: any) => doc.data());

    if (params.region && params.region !== "all") {
      docs = docs.filter((d: any) => d.regions?.includes(params.region));
    }

    const bdsmTerms = [
      "BDSM",
      "bdsm",
      "Domination",
      "domination",
      "Submission",
      "submission",
      "Bondage",
      "bondage",
      "Discipline",
      "discipline",
      "Sadomasochism",
      "sadomasochism",
      "Dominatrix",
      "dominatrix",
      "Mistress",
      "mistress",
      "Slave",
      "slave",
      "Master",
      "master",
      "Kinky",
      "kinky",
      "Fetish",
      "fetish",
      "Spanking",
      "spanking",
      "Whipping",
      "whipping",
      "Role play",
      "role play",
      "Roleplay",
      "roleplay",
      "Leather",
      "leather",
      "Latex",
      "latex",
      "Pegging",
      "pegging",
      "Strap-on",
      "strap-on",
    ];

    docs = docs.filter((d: any) => {
      if (!d.practices) return false;
      return d.practices.some((p: string) => {
        const lower = p.toLowerCase();
        return bdsmTerms.some((term) => lower.includes(term.toLowerCase()));
      });
    });

    if (docs.length === 0) return null;

    return {
      previewPhoto: docs[0].previewPhoto,
      name: docs[0].name,
      username: docs[0].username,
    };
  } catch (error) {
    console.error("Error getting first BDSM escort:", error);
    return null;
  }
}

// ============================================
// AGENCIES METADATA HELPERS
// ============================================

/**
 * Get agencies count for metadata (lightweight)
 */
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
      {
        next: {
          revalidate: REVALIDATE_TIME,
        },
      },
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

/**
 * Get first agency for metadata (lightweight)
 */
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
      {
        next: {
          revalidate: REVALIDATE_TIME,
        },
      },
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

// ============================================
// INDIVIDUAL AGENCY METADATA HELPERS
// ============================================

/**
 * Get agency by slug for metadata (lightweight)
 */
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
      {
        next: {
          revalidate: REVALIDATE_TIME,
        },
      },
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
