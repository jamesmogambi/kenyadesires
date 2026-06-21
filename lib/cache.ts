import { unstable_cache } from "next/cache";
import {
  getBDSMEscortsOptimized,
  getEroticMassageEscortsOptimized,
  getEscortById,
  getEscorts,
} from "@/server-actions/escort.action";
import { REVALIDATE_TIME } from "./cache-config";
import { AgenciesResponse, IAgency } from "@/types/agency.types";
import {
  getAllCategories,
  getAllPosts,
  getBlogBySlug,
  getCategoryBySlug,
  getFeaturedPostsWithLimit,
  getPostsByCategory,
  getPostsWithPagination,
} from "./sanity/queries";
import {
  getAllRegions,
  getPopularCounties,
} from "@/server-actions/region.action";
import { getAllLookupData } from "@/server-actions/lookup.action";

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

// ✅ NEW: Cache blog categories - 7 days
export const getCachedBlogCategories = unstable_cache(
  async () => {
    console.log("🔄 Fetching fresh blog categories...");
    return await getAllCategories();
  },
  ["blog-categories"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["blog-categories"],
  },
);

// ✅ NEW: Cache featured blog posts - 7 days
export const getCachedFeaturedPosts = unstable_cache(
  async (limit: number = 20) => {
    console.log(`🔄 Fetching fresh featured posts (limit: ${limit})...`);
    return await getFeaturedPostsWithLimit(limit);
  },
  ["blog-featured-posts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["blog-featured-posts"],
  },
);

// ✅ NEW: Cache all blog posts with pagination - 7 days
export const getCachedBlogPosts = unstable_cache(
  async (page: number, limit: number) => {
    console.log(`🔄 Fetching fresh blog posts (page: ${page})...`);
    return await getPostsWithPagination(page, limit);
  },
  ["blog-posts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["blog-posts"],
  },
);

// ✅ NEW: Cache single blog post - 7 days
export const getCachedBlogPost = unstable_cache(
  async (slug: string) => {
    console.log(`🔄 Fetching fresh blog post: ${slug}...`);
    return await getBlogBySlug(slug);
  },
  ["blog-post"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["blog-post"],
  },
);

// ✅ Cache all blog posts for static params - 7 days
export const getCachedAllBlogPosts = unstable_cache(
  async () => {
    console.log("🔄 Fetching all blog posts for static params...");
    return await getAllPosts();
  },
  ["blog-all-posts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["blog-all-posts"],
  },
);

// ✅ Cache popular counties - 7 days
export const getCachedPopularCounties = unstable_cache(
  async (limit?: number) => {
    console.log(
      `🔄 Fetching fresh popular counties (limit: ${limit || "all"})...`,
    );
    const result = await getPopularCounties({ limit, forceRefresh: true });
    return result;
  },
  ["popular-counties"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["popular-counties"],
  },
);

// ✅ Cache regions - 7 days
export const getCachedRegions = unstable_cache(
  async () => {
    console.log("🔄 Fetching fresh regions...");
    return await getAllRegions();
  },
  ["regions"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["regions"],
  },
);

// ✅ Cache all lookup data - 7 days
export const getCachedLookupData = unstable_cache(
  async () => {
    console.log("🔄 Fetching fresh lookup data...");
    return await getAllLookupData();
  },
  ["lookup-data"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["lookup-data"],
  },
);

// ✅ Cache single category by slug - 7 days
export const getCachedCategoryBySlug = unstable_cache(
  async (slug: string) => {
    console.log(`🔄 Fetching fresh category: ${slug}...`);
    return await getCategoryBySlug(slug);
  },
  ["category-detail"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["category"],
  },
);

// ✅ Cache posts by category - 7 days
export const getCachedPostsByCategory = unstable_cache(
  async (slug: string) => {
    console.log(`🔄 Fetching fresh posts for category: ${slug}...`);
    return await getPostsByCategory(slug);
  },
  ["category-posts"],
  {
    revalidate: REVALIDATE_TIME,
    tags: ["category-posts"],
  },
);
