import { Metadata } from "next";
import { Post, Category } from "@/types/sanity";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
const SITE_NAME = "KenyaDesires";
const BLOG_NAME = "Kenyan Dating Blog";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

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

/**
 * Escape a JSON-LD document so it is safe as the text content of a
 * `<script type="application/ld+json">` element. Post copy (headlines,
 * excerpts, author bios) is stored verbatim in Sanity and may contain
 * `<` or `</script>`; an unescaped `<` lets the HTML parser close the
 * script element early and makes the graph unparseable. Mirrors the policy
 * in `components/seo/JsonLd.tsx`.
 */
function escapeJsonLdForScript(json: string): string {
  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Wrap nodes in a single `@graph` document.
 *
 * Page-level graphs MUST NOT redefine `Organization` or `WebSite` — those are
 * defined once in the root layout's site-wide graph (`lib/aeo/schema.ts` →
 * `siteWideGraph()`) and are referenced here by `@id`. Redefining them emits a
 * duplicate `@id` on one URL (a malformed graph) and previously shipped stale
 * contact data (phone `+254701694004` / `support@kenyadesires.com`) that
 * conflicted with the canonical facts in `lib/aeo/entity.ts`.
 *
 * The page components render the result through their own
 * `<script type="application/ld+json" dangerouslySetInnerHTML>` tag, so this
 * function returns the JSON string ONLY (no wrapping `<script>` tags of its
 * own) — emitting a second wrapper produced nested `<script>` elements that the
 * browser could not parse, silently voiding the schema on every blog page.
 */
function serializeGraph(nodes: object[]): string {
  const doc = {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
  return escapeJsonLdForScript(JSON.stringify(doc));
}

export function generateBlogPostJsonLd(post: Post, slug: string): string {
  const baseUrl = SITE_URL;
  const postUrl = `${baseUrl}/blog/${slug}`;
  const imageUrl = post.mainImage?.asset?.url || DEFAULT_OG_IMAGE;

  const authorName = post.author?.name || "KenyaDesires Editor";
  const authorId = post.author?._id
    ? `${baseUrl}/blog/author/${post.author._id}`
    : `${baseUrl}/#author`;

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

  const blogPosting = {
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: post.title,
    description: post.excerpt || post.title,
    image: imageUrl,
    datePublished: post._createdAt,
    dateModified: post._updatedAt || post._createdAt,
    author: authorSchema,
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    inLanguage: "en-KE",
    isAccessibleForFree: true,
    thumbnailUrl: imageUrl,
    keywords: post.categories?.map((c) => c.name).join(", ") || "",
    articleSection: post.categories?.[0]?.name || "Dating",
  };

  const breadcrumbList = {
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

  // FAQPage only when the post carries FAQ data AND renders it visibly
  // (BlogArticle renders <FaqSection faq={faq || []} />). The `faq` field is
  // not selected in SINGLE_POST_QUERY today, so this stays inert — it is
  // never invented. When wired up, the visible Q&As and this schema share one
  // source of truth.
  const faq = post.faq && post.faq.length > 0
    ? {
        "@type": "FAQPage",
        "@id": `${postUrl}#faq`,
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

  return serializeGraph([blogPosting, breadcrumbList, ...(faq ? [faq] : [])]);
}

export function generateBlogListJsonLd(): string {
  const baseUrl = SITE_URL;

  const collectionPage = {
    "@type": "CollectionPage",
    "@id": `${baseUrl}/blog#collection`,
    name: "Blog - KenyaDesires",
    description:
      "Latest blog posts about dating, relationships, and lifestyle in Kenya.",
    url: `${baseUrl}/blog`,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    about: {
      "@id": `${baseUrl}/#organization`,
    },
    inLanguage: "en-KE",
    keywords:
      "Kenya dating blog, dating advice Kenya, relationships Kenya, Nairobi dating",
  };

  const breadcrumbList = {
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

  return serializeGraph([collectionPage, breadcrumbList]);
}

export function generateBlogCategoryJsonLd(
  category: Category,
  slug: string,
): string {
  const baseUrl = SITE_URL;
  const categoryUrl = `${baseUrl}/blog/category/${slug}`;

  const collectionPage = {
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    name: `${category.name} - ${BLOG_NAME}`,
    description:
      category.description ||
      `Articles about ${category.name} in Kenya.`,
    url: categoryUrl,
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    about: {
      "@id": `${baseUrl}/#organization`,
    },
    inLanguage: "en-KE",
    keywords: `${category.name} Kenya, ${category.name} dating, Kenya dating blog`,
  };

  const breadcrumbList = {
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

  return serializeGraph([collectionPage, breadcrumbList]);
}
