import { Metadata, ResolvingMetadata } from "next";
import React from "react";
import { notFound } from "next/navigation";
import { getBlogBySlug, getAllPosts } from "@/lib/sanity/queries";
import { getCachedBlogPost, getCachedAllBlogPosts } from "@/lib/cache";
import BlogArticle from "./BlogArticle";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// ✅ ISR - 7 days (increased from 1 hour)
export const revalidate = 604800; // 7 days in seconds

// ============================================
// GENERATE METADATA FOR SEO
// ============================================
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  try {
    const { slug } = await params;

    // ✅ Use cached version
    const post = await getCachedBlogPost(slug);

    if (!post) {
      return {
        title: "Post Not Found",
        description: "The requested blog post could not be found.",
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yoursite.com";
    const postUrl = `${baseUrl}/blog/${slug}`;

    // Get image URL from Sanity
    const imageUrl = post.mainImage?.asset?.url
      ? post.mainImage.asset.url
      : `${baseUrl}/og-default.jpg`;

    // Get parent metadata
    const previousImages = (await parent).openGraph?.images || [];

    return {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on Kenyan Dating Blog`,
      alternates: {
        canonical: postUrl,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || post.title,
        url: postUrl,
        siteName: "Kenyan Dating Blog",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
          ...previousImages,
        ],
        locale: "en_KE",
        type: "article",
        publishedTime: post._createdAt,
        modifiedTime: post._updatedAt || post._createdAt,
        authors: post.author?.name ? [post.author.name] : undefined,
        tags: post.categories?.map((cat) => cat.name).join(", ") || "",
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt || post.title,
        images: [imageUrl],
        creator: "@yourtwitterhandle",
      },
      keywords: post.categories?.map((cat) => cat.name).join(", ") || "",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error",
      description: "An error occurred while loading the blog post.",
    };
  }
}

// ============================================
// GENERATE STATIC PATHS FOR ALL POSTS
// ============================================
export async function generateStaticParams() {
  try {
    // ✅ Use cached version
    const posts = await getCachedAllBlogPosts();

    return posts.map((post) => ({
      slug: post.slug.current,
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// ============================================
// PAGE COMPONENT
// ============================================
const Page = async ({ params }: Props) => {
  try {
    const { slug } = await params;

    // ✅ Use cached version
    const post = await getCachedBlogPost(slug);

    if (!post) {
      notFound();
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://kenyadivas.com";

    // Generate JSON-LD structured data
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt || post.title,
      image: post.mainImage?.asset?.url || `${baseUrl}/og-default.jpg`,
      datePublished: post._createdAt,
      dateModified: post._updatedAt || post._createdAt,
      author: {
        "@type": "Person",
        name: post.author?.name || "Kenyan Dating Blog",
      },
      url: `${baseUrl}/blog/${slug}`,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${baseUrl}/blog/${slug}`,
      },
      publisher: {
        "@type": "Organization",
        name: "Kenyan Dating Blog",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/logo.png`,
        },
      },
    };

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
