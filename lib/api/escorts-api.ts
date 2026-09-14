import { cacheLife } from "next/cache";

export interface EscortSummary {
  id: string;
  name: string;
  username: string;
  previewPhoto: string;
  regions: string[];
  primaryRegion: string;
  county: string;
  age: string;
  rating: number;
  totalViews: number;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: string;
  slug: string;
}

export interface EscortsApiResponse {
  escorts: EscortSummary[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GetEscortsApiParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  practice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ---------------------------------------------------------------
// Approach 1: Next.js 16.3 'use cache' + cacheLife('daily')
// — Requires cacheComponents: true in next.config.ts
// — Remove `export const dynamic = "force-dynamic"` from route files
//   and use noStore() for pages that need request-time data
// ---------------------------------------------------------------
async function getCachedEscortsDaily(
  params: GetEscortsApiParams = {},
): Promise<EscortsApiResponse> {
  "use cache";
  cacheLife("daily");

  const url = new URL(
    "/api/escorts",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );

  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.county) url.searchParams.set("county", params.county);
  if (params.region) url.searchParams.set("region", params.region);
  if (params.practice) url.searchParams.set("practice", params.practice);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);

  const res = await fetch(url.toString(), {
    next: {
      // Revalidation interval handled by cacheLife("daily") profile:
      //   stale: 3600s, revalidate: 3600s, expire: 86400s
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch escorts: ${res.status}`);
  }

  return (await res.json()) as EscortsApiResponse;
}

// ---------------------------------------------------------------
// Approach 2: fetch() with next.revalidate (works without
// cacheComponents — uses Next.js standard data-fetching cache)
// ---------------------------------------------------------------
async function getCachedEscortsFetch(
  params: GetEscortsApiParams = {},
): Promise<EscortsApiResponse> {
  const url = new URL(
    "/api/escorts",
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  );

  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.county) url.searchParams.set("county", params.county);
  if (params.region) url.searchParams.set("region", params.region);
  if (params.practice) url.searchParams.set("practice", params.practice);
  if (params.sortBy) url.searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) url.searchParams.set("sortOrder", params.sortOrder);

  const res = await fetch(url.toString(), {
    next: {
      revalidate: 86400, // 24 hours — cache for 1 day
      tags: ["escorts-daily"],
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch escorts: ${res.status}`);
  }

  return (await res.json()) as EscortsApiResponse;
}

export { getCachedEscortsDaily, getCachedEscortsFetch };
