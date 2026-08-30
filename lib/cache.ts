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

export async function getCachedEscorts(params: any) {
  console.log("🔄 Fetching fresh escort data...");
  return await getEscorts(params);
}

export async function getCachedEscortById(id: string) {
  console.log(`🔄 Fetching fresh escort data for ID: ${id}...`);
  return await getEscortById(id);
}

export async function getCachedMassageEscorts(params: any) {
  console.log("🔄 Fetching fresh massage escort data (optimized)...");
  return await getEroticMassageEscortsOptimized(params);
}

export async function getCachedBDSMEscorts(params: any) {
  console.log("🔄 Fetching fresh BDSM escort data...");
  return await getBDSMEscortsOptimized(params);
}

export async function getCachedBlogCategories() {
  console.log("🔄 Fetching fresh blog categories...");
  return await getAllCategories();
}

export async function getCachedFeaturedPosts(limit: number = 20) {
  console.log(`🔄 Fetching fresh featured posts (limit: ${limit})...`);
  return await getFeaturedPostsWithLimit(limit);
}

export async function getCachedBlogPosts(page: number, limit: number) {
  console.log(`🔄 Fetching fresh blog posts (page: ${page})...`);
  return await getPostsWithPagination(page, limit);
}

export async function getCachedBlogPost(slug: string) {
  console.log(`🔄 Fetching fresh blog post: ${slug}...`);
  return await getBlogBySlug(slug);
}

export async function getCachedAllBlogPosts() {
  console.log("🔄 Fetching all blog posts for static params...");
  return await getAllPosts();
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
  console.log(`🔄 Fetching fresh category: ${slug}...`);
  return await getCategoryBySlug(slug);
}

export async function getCachedPostsByCategory(slug: string) {
  console.log(`🔄 Fetching fresh posts for category: ${slug}...`);
  return await getPostsByCategory(slug);
}

export async function getCachedRelatedPosts(categoryId: string, currentPostId: string, limit: number = 3) {
  console.log(`🔄 Fetching fresh related posts for category: ${categoryId}...`);
  return await getRelatedPosts(categoryId, currentPostId, limit);
}

export async function getCachedCommentsByPostSlug(postSlug: string) {
  console.log(`🔄 Fetching fresh comments for post: ${postSlug}...`);
  return await getCommentsByPostSlug(postSlug);
}
