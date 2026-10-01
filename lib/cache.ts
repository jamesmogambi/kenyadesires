import {
  getBDSMEscortsOptimized,
  getEroticMassageEscortsOptimized,
  getEscortById,
  getEscorts,
} from "@/server-actions/escort.action";
import { AgenciesResponse, IAgency } from "@/types/agency.types";
import {
  getAllCategories,
  getAllPosts,
  getBlogBySlug,
  getCategoryBySlug,
  getFeaturedPostsWithLimit,
  getPostsByCategory,
  getPostsWithPagination,
  getRelatedPosts,
} from "./sanity/queries";
import { getAllRegions, getPopularCounties } from "@/server-actions/region.action";
import { getAllLookupData } from "@/server-actions/lookup.action";
import { getCommentsByPostSlug } from "@/server-actions/blog-comments.action";
import type { Category, Post } from "@/types/sanity";
import { StaleWhileRevalidateCache } from "@/lib/stale-while-revalidate-cache";
import type { CacheEntry } from "@/lib/stale-while-revalidate-cache";

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;

  constructor(ttlSeconds: number) {
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expires) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expires: Date.now() + this.ttl });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const escortCache = new TTLCache<any>(60);

// Blog content is editorial: it changes when someone publishes in the Studio,
// not on a user-facing timer. A 60s fresh window keeps repeat traffic free of
// network calls while still picking up new posts within a minute; the 10 minute
// stale window means a Sanity outage degrades to slightly old posts rather than
// to an empty page.
const blogCache = new StaleWhileRevalidateCache(60_000, 10 * 60_000);

function cacheKey(params: any): string {
  return JSON.stringify(params || {});
}

export async function getCachedEscorts(params: any) {
  const key = `escorts:${cacheKey(params)}`;
  const cached = escortCache.get(key);
  if (cached) return cached;

  const result = await getEscorts(params);
  escortCache.set(key, result);
  return result;
}

export async function getCachedEscortById(id: string) {
  const key = `escort-by-id:${id}`;
  const cached = escortCache.get(key);
  if (cached) return cached;

  const result = await getEscortById(id);
  escortCache.set(key, result);
  return result;
}

export async function getCachedMassageEscorts(params: any) {
  return getEroticMassageEscortsOptimized(params);
}

export async function getCachedBDSMEscorts(params: any) {
  return getBDSMEscortsOptimized(params);
}

export async function getCachedBlogCategories() {
  return blogCache.resolve(
    "blog:categories",
    () => getAllCategories(),
    { featured: [], nonFeatured: [] },
  );
}

export async function getCachedFeaturedPosts(limit: number = 20) {
  return blogCache.resolve(
    `blog:featured:${limit}`,
    () => getFeaturedPostsWithLimit(limit),
    [] as Post[],
  );
}

export async function getCachedBlogPosts(page: number, limit: number) {
  return blogCache.resolve(
    `blog:posts:${page}:${limit}`,
    () => getPostsWithPagination(page, limit),
    { posts: [] as Post[], total: 0, totalPages: 0, currentPage: page },
  );
}

export async function getCachedBlogPost(slug: string) {
  return blogCache.resolve(
    `blog:post:${slug}`,
    () => getBlogBySlug(slug),
    null as Post | null,
  );
}

export async function getCachedAllBlogPosts() {
  return blogCache.resolve(
    "blog:posts:all",
    () => getAllPosts(),
    [] as Post[],
  );
}

export async function getCachedPopularCounties(limit?: number) {
  console.log(
    `🔄 Fetching fresh popular counties (limit: ${limit || "all"})...`,
  );
  const result = await getPopularCounties({ limit });
  return result;
}

export async function getCachedRegions() {
  console.log("🔄 Fetching fresh regions...");
  return await getAllRegions();
}

export async function getCachedLookupData() {
  console.log("🔄 Fetching fresh lookup data...");
  return await getAllLookupData();
}

export async function getCachedCategoryBySlug(slug: string) {
  return blogCache.resolve(
    `blog:category:${slug}`,
    () => getCategoryBySlug(slug),
    null as Category | null,
  );
}

export async function getCachedPostsByCategory(slug: string) {
  return blogCache.resolve(
    `blog:category-posts:${slug}`,
    () => getPostsByCategory(slug),
    [] as Post[],
  );
}

export async function getCachedRelatedPosts(categoryId: string, currentPostId: string, limit: number = 3) {
  return blogCache.resolve(
    `blog:related:${categoryId}:${currentPostId}:${limit}`,
    () => getRelatedPosts(categoryId, currentPostId, limit),
    [] as Post[],
  );
}

export async function getCachedCommentsByPostSlug(postSlug: string) {
  console.log(`🔄 Fetching fresh comments for post: ${postSlug}...`);
  return await getCommentsByPostSlug(postSlug);
}
