import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlogList from "../../BlogList";
import {
  getCachedCategoryBySlug,
  getCachedPostsByCategory,
  getCachedBlogCategories,
} from "@/lib/cache";
import {
  generateBlogCategoryMetadata,
  generateBlogCategoryJsonLd,
} from "@/lib/blog-seo";

// ✅ ISR - 7 days
export const revalidate = 604800; // 7 days in seconds

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
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
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");

  const category = await getCachedCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    };
  }

  return generateBlogCategoryMetadata(category, slug, page);
}

// ============================================
// PAGE COMPONENT
// ============================================
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");

  const [category, posts] = await Promise.all([
    getCachedCategoryBySlug(slug),
    getCachedPostsByCategory(slug),
  ]);

  if (!category) {
    notFound();
  }

  const jsonLdScript = generateBlogCategoryJsonLd(category, slug);

  return (
    <>
      {/* JSON-LD Structured Data for SEO & GEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript }}
      />

      <main className="">
        <BlogList blogTitle={category.name} blogList={posts} />
      </main>
    </>
  );
}
