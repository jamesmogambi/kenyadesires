import { Metadata } from "next";
import BlogList from "../../BlogList";
import EmptyState from "@/components/blog/EmptyState";
import {
  getCachedCategoryBySlug,
  getCachedPostsByCategory,
  getCachedBlogCategories,
} from "@/lib/cache";
import {
  generateBlogCategoryMetadata,
  generateBlogCategoryJsonLd,
} from "@/lib/blog-seo";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;


interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

// ============================================
// GENERATE STATIC PATHS
// ============================================
export async function generateStaticParams() {
  try {
    const categories = await getCachedBlogCategories();
    const allCategories = [...categories.featured, ...categories.nonFeatured];

    return allCategories.map((category: { slug: { current: string } }) => ({
      slug: category.slug.current,
    }));
  } catch (error) {
    console.error("Error generating static params for categories:", error);
    return [{ slug: "placeholder" }];
  }
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
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Category Not Found",
              description: "The requested category could not be found.",
              url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"}/blog/category/${slug}`,
            }),
          }}
        />
        <main className="">
          <EmptyState
            title="Category not found"
            description="The category you are looking for does not exist or has been removed. Explore our latest posts below."
          />
        </main>
      </>
    );
  }

  const jsonLdScript = generateBlogCategoryJsonLd(category, slug);

  if (posts.length === 0) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
        />
        <main className="">
          <EmptyState
            title={`No posts in ${category.name} yet`}
            description="This category doesn't have any articles right now. Check back soon or browse other topics on the blog."
          />
        </main>
      </>
    );
  }

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
