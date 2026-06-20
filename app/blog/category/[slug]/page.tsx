import { notFound } from "next/navigation";
import { Metadata } from "next";

// Sanity imports
import {
  getAllCategories,
  getCategoryBySlug,
  getPostsByCategory,
} from "@/lib/sanity/queries";

// Components
import TelegramCTA from "@/components/blog/TelegramCTA";

// Types
import BlogList from "../../BlogList";

interface CategoryPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
  };
}

// ============================================
// GENERATE STATIC PATHS
// ============================================
export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({
    slug: category.slug.current,
  }));
}

// ============================================
// GENERATE METADATA
// ============================================
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug);

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
      url: `https://kenyadivas.com/category/${params.slug}`,
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
  const { slug } = await params;
  const currentPage = parseInt((await searchParams).page || "1");

  // Get category and posts
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Get posts for this category with pagination
  const posts = await getPostsByCategory(slug);

  return (
    <main className="">
      <BlogList blogTitle={category.name} blogList={posts} />

      {/* Telegram CTA */}
      {/* <TelegramCTA variant="home" className="mt-12" /> */}
    </main>
  );
}
