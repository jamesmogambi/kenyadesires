import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlogList from "../../BlogList";
import TelegramCTA from "@/components/blog/TelegramCTA";
import {
  getCachedCategoryBySlug,
  getCachedPostsByCategory,
  getCachedBlogCategories,
} from "@/lib/cache";

// ✅ ISR - 7 days
export const revalidate = 604800; // 7 days in seconds

interface CategoryPageProps {
  params: Promise<{ slug: string }>; // ✅ Now a Promise
  searchParams: Promise<{ page?: string }>; // ✅ Now a Promise
}

// ============================================
// GENERATE STATIC PATHS
// ============================================
export async function generateStaticParams() {
  const categories = await getCachedBlogCategories();
  const allCategories = [...categories.featured, ...categories.nonFeatured];

  return allCategories.map((category: { slug: { current: string } }) => ({
    slug: category.slug.current,
  }));
}

// ============================================
// GENERATE METADATA - AWAIT params
// ============================================
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  // ✅ Await params before using
  const { slug } = await params;

  // ✅ Use cached version
  const category = await getCachedCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} - Kenyan Dating Blog`,
    description:
      category.description || `Articles about ${category.name} in Kenya`,
    openGraph: {
      title: `${category.name} - Kenyan Dating Blog`,
      description:
        category.description || `Articles about ${category.name} in Kenya`,
      type: "website",
      url: `https://kenyadivas.com/category/${slug}`, // ✅ Use slug from awaited params
    },
  };
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  // ✅ Await both params and searchParams
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");

  // ✅ Use cached versions
  const [category, posts] = await Promise.all([
    getCachedCategoryBySlug(slug),
    getCachedPostsByCategory(slug),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <main className="">
      <BlogList blogTitle={category.name} blogList={posts} />

      {/* Telegram CTA */}
      {/* <TelegramCTA variant="home" className="mt-12" /> */}
    </main>
  );
}
