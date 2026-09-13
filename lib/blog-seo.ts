import { Metadata } from "next";
import { Post, Category } from "@/types/sanity";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
const SITE_NAME = "KenyaDesires";
const BLOG_NAME = "Kenyan Dating Blog";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;
const LOGO_URL = `${SITE_URL}/logo.png`;

const GEO = {
  country: "KE",
  region: "Nairobi",
  placename: "Kenya",
  position: "-1.286389;36.817223",
  lat: "-1.286389",
  lng: "36.817223",
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildKeywords(categories: Category[]): string {
  const catNames = categories.map((c) => c.name).join(", ");
  return [
    "Kenya dating blog",
    "dating advice Kenya",
    "relationships Kenya",
    "Nairobi dating",
    "Mombasa dating",
    "Kisumu dating",
    "Kenyan dating tips",
    "dating site Kenya",
    catNames,
  ]
    .filter(Boolean)
    .join(", ");
}

export function generateBlogPostMetadata(
  post: Post,
  slug: string,
): Metadata {
  const postUrl = `${SITE_URL}/blog/${slug}`;
  const imageUrl = post.mainImage?.asset?.url || DEFAULT_OG_IMAGE;
  const keywords = buildKeywords(post.categories || []);

  return {
    metadataBase: new URL(SITE_URL),
    title: post.title,
    description:
      post.excerpt ||
      `Read "${post.title}" on ${BLOG_NAME} - Kenya's premier dating and lifestyle blog.`,
    keywords,
    authors: [
      {
        name: post.author?.name || "KenyaDesires Editor",
        url: SITE_URL,
      },
    ],
    alternates: {
      canonical: postUrl,
      languages: {
        "en-KE": postUrl,
      },
    },
    openGraph: {
      title: post.title,
      description:
        post.excerpt || `Read "${post.title}" on ${BLOG_NAME}.`,
      url: postUrl,
      siteName: BLOG_NAME,
      locale: "en_KE",
      type: "article",
      publishedTime: post._createdAt,
      modifiedTime: post._updatedAt || post._createdAt,
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.categories?.map((cat) => cat.name).join(", ") || "",
      section: post.categories?.[0]?.name || "Dating",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: post.mainImage?.alt || `${post.title} - ${BLOG_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@kenyadesires",
      creator: "@kenyadesires",
      title: post.title,
      description:
        post.excerpt || `Read "${post.title}" on ${BLOG_NAME}.`,
      images: [imageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.country": GEO.country,
      "geo.region": `${GEO.country}-${GEO.region}`,
      "geo.placename": GEO.placename,
      "geo.position": GEO.position,
      ICBM: `${GEO.lat}, ${GEO.lng}`,
      "twitter:app:country": "KE",
      "article:tag": post.categories?.map((c) => c.name).join(", ") || "",
      "article:section": post.categories?.[0]?.name || "Dating",
    },
  };
}

export function generateBlogListMetadata(
  page?: number,
  totalPages?: number,
): Metadata {
  const baseUrl = SITE_URL;
  const url = page && page > 1 ? `${baseUrl}/blog?page=${page}` : `${baseUrl}/blog`;

  const keywords = [
    "Kenya dating blog",
    "dating advice Kenya",
    "relationships Kenya",
    "Nairobi dating",
    "Mombasa dating",
    "Kisumu dating",
    "Kenyan dating tips",
    "online dating Kenya",
  ].join(", ");

  return {
    metadataBase: new URL(baseUrl),
    title: "Blog | Latest Dating Articles & Insights | KenyaDesires",
    description:
      "Discover the latest blog posts about dating, relationships, and social connections in Kenya. Expert advice, trending topics, and insights from Kenya's premier dating blog.",
    keywords,
    authors: [{ name: "KenyaDesires Editors", url: baseUrl }],
    alternates: {
      canonical: url,
      languages: {
        "en-KE": url,
      },
    },
    openGraph: {
      title: "Latest Dating Blog Posts & Articles | KenyaDesires",
      description:
        "Explore our collection of blog posts and articles about dating, relationships, and lifestyle in Kenya.",
      url,
      siteName: BLOG_NAME,
      locale: "en_KE",
      type: "website",
      images: [
        {
          url: `${baseUrl}/og-blog-list.jpg`,
          width: 1200,
          height: 630,
          alt: "KenyaDesires Blog - Dating Advice & Insights",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@kenyadesires",
      creator: "@kenyadesires",
      title: "Latest Dating Blog Posts & Articles | KenyaDesires",
      description:
        "Explore our collection of blog posts about dating, relationships, and lifestyle in Kenya.",
      images: [`${baseUrl}/og-blog-list.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.country": GEO.country,
      "geo.region": `${GEO.country}-${GEO.region}`,
      "geo.placename": GEO.placename,
      "geo.position": GEO.position,
      ICBM: `${GEO.lat}, ${GEO.lng}`,
      "twitter:app:country": "KE",
    },
  };
}

export function generateBlogCategoryMetadata(
  category: Category,
  slug: string,
  page?: number,
): Metadata {
  const baseUrl = SITE_URL;
  const url =
    page && page > 1
      ? `${baseUrl}/blog/category/${slug}?page=${page}`
      : `${baseUrl}/blog/category/${slug}`;

  const keywords = [
    `${category.name} Kenya`,
    `${category.name} dating`,
    "Kenya dating blog",
    "dating advice Kenya",
    category.name,
  ].join(", ");

  return {
    metadataBase: new URL(baseUrl),
    title: `${category.name} - Articles & Posts | ${BLOG_NAME}`,
    description:
      category.description ||
      `Articles about ${category.name} in Kenya. Read the latest posts and insights on ${BLOG_NAME}.`,
    keywords,
    authors: [{ name: "KenyaDesires Editors", url: baseUrl }],
    alternates: {
      canonical: url,
      languages: {
        "en-KE": url,
      },
    },
    openGraph: {
      title: `${category.name} - KenyaDesires Blog`,
      description:
        category.description ||
        `Articles about ${category.name} in Kenya.`,
      url,
      siteName: BLOG_NAME,
      locale: "en_KE",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${category.name} - ${BLOG_NAME}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@kenyadesires",
      creator: "@kenyadesires",
      title: `${category.name} - KenyaDesires Blog`,
      description:
        category.description || `Articles about ${category.name} in Kenya.`,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "geo.country": GEO.country,
      "geo.region": `${GEO.country}-${GEO.region}`,
      "geo.placename": GEO.placename,
      "geo.position": GEO.position,
      ICBM: `${GEO.lat}, ${GEO.lng}`,
      "twitter:app:country": "KE",
    },
  };
}

export function generateBlogPostJsonLd(post: Post, slug: string): string {
  const baseUrl = SITE_URL;
  const postUrl = `${baseUrl}/blog/${slug}`;
  const imageUrl = post.mainImage?.asset?.url || DEFAULT_OG_IMAGE;
  const imageAlt = post.mainImage?.alt || post.title;

  const authorName = post.author?.name || "KenyaDesires Editor";
  const authorId = post.author?._id ? `${baseUrl}/blog/author/${post.author._id}` : `${baseUrl}/#author`;

  const authorSchema = {
    "@type": "Person",
    "@id": authorId,
    name: authorName,
    url: authorId,
    worksFor: {
      "@id": `${baseUrl}/#organization`,
    },
    sameAs: post.author?.socialLinks?.length
      ? post.author.socialLinks
      : [
          "https://twitter.com/kenyadesires",
          "https://www.instagram.com/kenyadesires",
        ],
    knowsAbout: post.categories?.map((c) => c.name) || ["Dating", "Relationships", "Kenya"],
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    image: imageUrl,
    datePublished: post._createdAt,
    dateModified: post._updatedAt || post._createdAt,
    author: authorSchema,
    publisher: {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      name: BLOG_NAME,
      logo: {
        "@type": "ImageObject",
        url: LOGO_URL,
        width: 600,
        height: 60,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    keywords: post.categories?.map((c) => c.name).join(", ") || "",
    articleSection: post.categories?.[0]?.name || "Dating",
    inLanguage: "en-KE",
    thumbnailUrl: imageUrl,
    thumbnail: [
      {
        "@type": "ImageObject",
        url: imageUrl,
        caption: imageAlt,
      },
    ],
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: postUrl,
      },
    ],
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: BLOG_NAME,
    description:
      "Kenya's premier dating and lifestyle blog featuring expert advice, relationship tips, and insights for singles across Kenya.",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/blog/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: "en-KE",
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: SITE_NAME,
    alternateName: "Kenya Desires",
    url: baseUrl,
    logo: LOGO_URL,
    sameAs: [
      "https://twitter.com/kenyadesires",
      "https://www.instagram.com/kenyadesires",
      "https://www.facebook.com/kenyadesires",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254701694004",
      contactType: "customer service",
      email: "support@kenyadesires.com",
      availableLanguage: ["English", "Swahili"],
      areaServed: "KE",
    },
  };

  const faqData = post.faq && post.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${postUrl}/#faq`,
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  const allData = [
    structuredData,
    breadcrumbData,
    websiteData,
    organizationData,
    ...(faqData ? [faqData] : []),
  ];

  return `<script type="application/ld+json">${JSON.stringify(
    allData,
  )}</script>`;
}

export function generateBlogListJsonLd(): string {
  const baseUrl = SITE_URL;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog - KenyaDesires",
    description:
      "Latest blog posts about dating, relationships, and lifestyle in Kenya.",
    url: `${baseUrl}/blog`,
    isPartOf: {
      "@type": "WebSite",
      name: BLOG_NAME,
      url: baseUrl,
    },
    about: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    inLanguage: "en-KE",
    keywords:
      "Kenya dating blog, dating advice Kenya, relationships Kenya, Nairobi dating",
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
    ],
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BLOG_NAME,
    description:
      "Kenya's premier dating and lifestyle blog featuring expert advice, relationship tips, and insights for singles across Kenya.",
    url: baseUrl,
    inLanguage: "en-KE",
  };

  const allData = [collectionPage, breadcrumbData, websiteData];

  return `<script type="application/ld+json">${JSON.stringify(
    allData,
  )}</script>`;
}

export function generateBlogCategoryJsonLd(
  category: Category,
  slug: string,
): string {
  const baseUrl = SITE_URL;
  const categoryUrl = `${baseUrl}/blog/category/${slug}`;

  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} - ${BLOG_NAME}`,
    description:
      category.description ||
      `Articles about ${category.name} in Kenya.`,
    url: categoryUrl,
    isPartOf: {
      "@type": "WebSite",
      name: BLOG_NAME,
      url: baseUrl,
    },
    about: {
      "@type": "Organization",
      name: SITE_NAME,
      url: baseUrl,
    },
    inLanguage: "en-KE",
    keywords: `${category.name} Kenya, ${category.name} dating, Kenya dating blog`,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${baseUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: categoryUrl,
      },
    ],
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BLOG_NAME,
    description:
      "Kenya's premier dating and lifestyle blog featuring expert advice, relationship tips, and insights for singles across Kenya.",
    url: baseUrl,
    inLanguage: "en-KE",
  };

  const allData = [collectionPage, breadcrumbData, websiteData];

  return `<script type="application/ld+json">${JSON.stringify(
    allData,
  )}</script>`;
}
