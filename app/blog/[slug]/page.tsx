import { Metadata, ResolvingMetadata } from "next";
import React from "react";
import { notFound } from "next/navigation";
import { getCachedBlogPost, getCachedAllBlogPosts } from "@/lib/cache";
import BlogArticle from "./BlogArticle";
import {
  generateBlogPostMetadata,
  generateBlogPostJsonLd,
} from "@/lib/blog-seo";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};


// ============================================
// GENERATE METADATA FOR SEO & GEO
// ============================================
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    const { slug } = await params;

    const post = await getCachedBlogPost(slug);

    if (!post) {
      return {
        title: "Post Not Found",
        description: "The requested blog post could not be found.",
      };
    }

    return generateBlogPostMetadata(post, slug);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error",
      description: "An error occurred while loading the blog post.",
    };
  }
}

// ============================================
// PAGE COMPONENT
// ============================================
const Page = async ({ params }: Props) => {
  try {
    const { slug } = await params;

    const post = await getCachedBlogPost(slug);

    if (!post) {
      notFound();
    }

    const jsonLdScript = generateBlogPostJsonLd(post, slug);

    return (
      <>
        {/* JSON-LD Structured Data for SEO & GEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript }}
        />

        {/* Blog Article Component */}
        <BlogArticle blog={post} />
      </>
    );
  } catch (error) {
    console.error("Error loading blog post:", error);
    notFound();
  }
};

export default Page;
