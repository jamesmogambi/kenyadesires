import { unstable_cache } from "next/cache";
import {
  getBDSMEscortsOptimized,
  getEroticMassageEscortsOptimized,
  getEscortById,
  getEscorts,
} from "@/server-actions/escort.action";
import { REVALIDATE_TIME } from "./cache-config";
import { AgenciesResponse, IAgency } from "@/types/agency.types";

export const getCachedEscorts = unstable_cache(
  async (params: any) => {
    console.log("🔄 Fetching fresh escort data...");
    return await getEscorts(params);
  },
  ["escorts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["escorts"],
  },
);

// ✅ Cache individual escort - 7 days
export const getCachedEscortById = unstable_cache(
  async (id: string) => {
    console.log(`🔄 Fetching fresh escort data for ID: ${id}...`);
    return await getEscortById(id);
  },
  ["escort-detail"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["escort"],
  },
);

// ✅ Cache massage escorts using OPTIMIZED version
export const getCachedMassageEscorts = unstable_cache(
  async (params: any) => {
    console.log("🔄 Fetching fresh massage escort data (optimized)...");
    return await getEroticMassageEscortsOptimized(params); // ← OPTIMIZED
  },
  ["massage-escorts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["massage-escorts"],
  },
);

// ✅ NEW: Cache BDSM escorts - 7 days
export const getCachedBDSMEscorts = unstable_cache(
  async (params: any) => {
    console.log("🔄 Fetching fresh BDSM escort data...");
    return await getBDSMEscortsOptimized(params);
  },
  ["bdsm-escorts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["bdsm-escorts"],
  },
);

// ✅ NEW: Cache agencies - 7 days
export const getCachedAgencies = unstable_cache(
  async (page: number, limit: number) => {
    console.log(`🔄 Fetching fresh agencies data (page ${page})...`);
    return await getAgenciesFromAPI(page, limit);
  },
  ["agencies"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["agencies"],
  },
);

// ============================================
// AGENCIES API FETCH FUNCTION
// ============================================
async function getAgenciesFromAPI(
  page: number = 1,
  limit: number = 12,
): Promise<AgenciesResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
  const res = await fetch(
    `${baseUrl}/api/agencies?page=${page}&limit=${limit}&status=active`,
    {
      next: {
        revalidate: REVALIDATE_TIME, // 7 days
      },
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch agencies");
  }

  return res.json();
}

// ✅ NEW: Cache individual agency - 7 days
export const getCachedAgencyBySlug = unstable_cache(
  async (slug: string) => {
    console.log(`🔄 Fetching fresh agency data for slug: ${slug}...`);
    return await getAgencyFromAPI(slug);
  },
  ["agency-detail"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["agency"],
  },
);

async function getAgencyFromAPI(
  slug: string,
): Promise<{ success: boolean; data: IAgency }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4000";
  const res = await fetch(`${baseUrl}/api/agencies/${slug}`, {
    next: {
      revalidate: REVALIDATE_TIME,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch agency");
  }

  return res.json();
}
