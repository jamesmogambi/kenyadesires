import { client } from "./client";
import type { Category, Post } from "@/types/sanity";

/**
 * Ceiling for a single Sanity read.
 *
 * This has to cover the whole cost of the round trip, not just the query: a
 * cold TLS handshake to `*.api.sanity.io` regularly takes 15s+ on this host's
 * route to Google Cloud. The old 5s ceiling expired inside that window, so a
 * perfectly healthy dataset returned `null` and the blog rendered as an empty
 * page — that was the visible "blogs don't render" failure, not a GROQ bug.
 *
 * Kept slightly under the Sanity client's own 15s so this wrapper reports the
 * timeout with a useful label instead of letting a raw client error escape.
 */
const SANITY_FETCH_TIMEOUT_MS = Number(
  process.env.SANITY_FETCH_TIMEOUT_MS ?? 15000,
);

/**
 * Bound a Sanity read so one slow query cannot hang a page render.
 *
 * Resolves to `null` on timeout or error, which callers translate into an empty
 * result — callers must pair this with a cache that can serve a previous good
 * value, otherwise a transient network fault shows up as missing content.
 */
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  label: string,
): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => {
          console.warn(
            `[Sanity] Timeout fetching ${label} after ${SANITY_FETCH_TIMEOUT_MS}ms`,
          );
          resolve(null);
        }, SANITY_FETCH_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error(`[Sanity] Error fetching ${label}:`, error);
    return null;
  } finally {
    // Without this the timer outlives the race and holds the event loop open
    // for the full window on every cached call.
    if (timer) clearTimeout(timer);
  }
}

// ==================== CATEGORY QUERIES ====================

export const FEATURED_CATEGORIES_QUERY = `*[_type == "category" && featured == true] | order(order asc, name asc) {
  _id,
  name,
  slug,
  description,
  icon,
  color,
  order,
  "count": count(*[_type == "post" && references(^._id)])
}`;

export const CATEGORY_BY_SLUG_QUERY = `*[_type == "category" && slug.current == $slug][0] {
  _id,
  name,
  slug,
  description,
  icon,
  color,
  order,
  "count": count(*[_type == "post" && references(^._id)])
}`;

// ==================== FEATURED POSTS QUERIES ====================

/**
 * Get featured posts - returns up to 6 posts marked as featured
 * Use this for homepage, hero sections, and featured content areas
 */
export const FEATURED_POSTS_QUERY = `*[_type == "post" && featured == true] | order(_createdAt desc)[0...6] {
  _id,
  title,
  slug,
  excerpt,
  mainImage {
    asset-> {
      _id,
      url
    },
    alt
  },
  _createdAt,
  author-> {
    name,
    image {
      asset-> {
        _id,
        url
      }
    }
  },
  categories[]-> {
    _id,
    name,
    slug,
    color,
    icon
  }
}`;

/**
 * Get featured posts with a specific limit
 * Example: getFeaturedPostsWithLimit(3) - returns 3 featured posts
 */
export const FEATURED_POSTS_WITH_LIMIT_QUERY = (limit: number = 6) =>
  `*[_type == "post" && featured == true] | order(_createdAt desc)[0...${limit}] {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    _createdAt,
    author-> {
      name,
      image {
        asset-> {
          _id,
          url
        }
      }
    },
    categories[]-> {
      _id,
      name,
      slug,
      color,
      icon
    }
  }`;

/**
 * Get featured posts with full content (for single post page)
 */
export const FEATURED_POSTS_FULL_QUERY = `*[_type == "post" && featured == true] | order(_createdAt desc)[0...6] {
  _id,
  title,
  slug,
  excerpt,
  mainImage {
    asset-> {
      _id,
      url
    },
    alt
  },
  body,
  _createdAt,
  author-> {
    name,
    image {
      asset-> {
        _id,
        url
      }
    },
    bio
  },
  categories[]-> {
    _id,
    name,
    slug,
    color,
    icon
  }
}`;

/**
 * Get featured posts by category
 */
export const FEATURED_POSTS_BY_CATEGORY_QUERY = (categorySlug: string) =>
  `*[_type == "post" && featured == true && $categorySlug in categories[]->slug.current] | order(_createdAt desc)[0...3] {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    _createdAt,
    author-> {
      name
    },
    categories[]-> {
      _id,
      name,
      slug,
      color,
      icon
    }
  }`;

// ==================== POST QUERIES ====================

export const POSTS_WITH_PAGINATION_QUERY = `*[_type == "post" && featured != true] | order(_createdAt desc) {
  _id,
  title,
  slug,
  excerpt,
  mainImage {
    asset-> {
      _id,
      url
    },
    alt
  },
  _createdAt,
  author-> {
    name,
    image {
      asset-> {
        _id,
        url
      }
    }
  },
  categories[]-> {
    _id,
    name,
    slug,
    color,
    icon
  }
}[$start...$end]`;

export const POSTS_COUNT_QUERY = `count(*[_type == "post" && featured != true])`;

/**
 * Page slice and total for the non-featured feed in a single request.
 *
 * These were two parallel `client.fetch` calls. They were issued together, but
 * every one of them pays the full DNS + TLS cost to `*.api.sanity.io`, so the
 * page render was bounded by two handshakes instead of one. GROQ can return
 * both values in a single document, so the count is folded in here and the
 * second round trip disappears.
 */
export const POSTS_PAGINATED_WITH_COUNT_QUERY = `{
  "posts": *[_type == "post" && featured != true] | order(_createdAt desc) {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    _createdAt,
    author-> {
      name,
      image {
        asset-> {
          _id,
          url
        }
      }
    },
    categories[]-> {
      _id,
      name,
      slug,
      color,
      icon
    }
  }[$start...$end],
  "total": count(*[_type == "post" && featured != true])
}`;

export const ALL_POSTS_QUERY = `*[_type == "post"] | order(featured desc, _createdAt desc) {
  _id,
  title,
  slug,
  excerpt,
  mainImage {
    asset-> {
      _id,
      url
    },
    alt
  },
  _createdAt,
  featured,
  author-> {
    name,
    image {
      asset-> {
        _id,
        url
      }
    }
  },
  categories[]-> {
    _id,
    name,
    slug,
    color,
    icon
  }
}`;

// ==================== FETCH FUNCTIONS ====================

// Combined query for both featured and non-featured (optional)
export const ALL_CATEGORIES_QUERY = `
  {
    "featured": *[_type == "category" && featured == true] | order(order asc) {
      _id,
      name,
      slug,
      description,
      icon,
      color,
      order,
      featured,
      count
    },
    "nonFeatured": *[_type == "category" && featured != true] | order(order asc) {
      _id,
      name,
      slug,
      description,
      icon,
      color,
      order,
      featured,
      count
    }
  }
`;
// Get both featured and non-featured categories in one query
export async function getAllCategories(): Promise<{
  featured: Category[];
  nonFeatured: Category[];
}> {
  const result = await fetchWithTimeout(client.fetch(ALL_CATEGORIES_QUERY), "getAllCategories");
  if (!result) return { featured: [], nonFeatured: [] };
  const categories = result as { featured: Category[]; nonFeatured: Category[] };
  return categories;
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return (await fetchWithTimeout(
    client.fetch(CATEGORY_BY_SLUG_QUERY, { slug }),
    `getCategoryBySlug(${slug})`,
  )) as Category | null;
}

// Featured Posts Functions
export async function getFeaturedPosts(): Promise<Post[]> {
  const result = await fetchWithTimeout(client.fetch(FEATURED_POSTS_QUERY), "getFeaturedPosts");
  return (result || []) as Post[];
}

export async function getFeaturedPostsWithLimit(
  limit: number = 6,
): Promise<Post[]> {
  const result = await fetchWithTimeout(
    client.fetch(FEATURED_POSTS_WITH_LIMIT_QUERY(limit)),
    `getFeaturedPostsWithLimit(${limit})`,
  );
  return (result || []) as Post[];
}

export async function getFeaturedPostsWithContent(): Promise<Post[]> {
  const result = await fetchWithTimeout(client.fetch(FEATURED_POSTS_FULL_QUERY), "getFeaturedPostsWithContent");
  return (result || []) as Post[];
}

export async function getFeaturedPostsByCategory(
  categorySlug: string,
): Promise<Post[]> {
  return await client.fetch(FEATURED_POSTS_BY_CATEGORY_QUERY(categorySlug), {
    categorySlug,
  });
}

// Regular Posts with Pagination
export async function getPostsWithPagination(
  page: number = 1,
  limit: number = 20,
): Promise<{
  posts: Post[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const start = (page - 1) * limit;
  const end = start + limit;

  // One request instead of two, and bounded by the same timeout guard as the
  // other reads — an unguarded `client.fetch` here would have hung the render
  // rather than degrading to an empty page.
  const result = await fetchWithTimeout(
    client.fetch(POSTS_PAGINATED_WITH_COUNT_QUERY, { start, end }),
    `getPostsWithPagination(page=${page}, limit=${limit})`,
  );

  if (!result) {
    return { posts: [], total: 0, totalPages: 0, currentPage: page };
  }

  const { posts, total } = result as { posts: Post[]; total: number };

  return {
    posts: posts || [],
    total: total ?? 0,
    totalPages: total ? Math.ceil(total / limit) : 0,
    currentPage: page,
  };
}

// All posts
export async function getAllPosts(): Promise<Post[]> {
  const result = await fetchWithTimeout(client.fetch(ALL_POSTS_QUERY), "getAllPosts");
  return (result || []) as Post[];
}

// Posts by category
export async function getPostsByCategory(
  categorySlug: string,
): Promise<Post[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];

  const posts = await fetchWithTimeout(
    client.fetch(
      `*[_type == "post" && references($categoryId)] | order(featured desc, _createdAt desc) {
      _id,
      title,
      slug,
      excerpt,
      mainImage {
        asset-> {
          _id,
          url
        },
        alt
      },
      _createdAt,
      featured,
      author-> {
        name,
        image {
          asset-> {
            _id,
            url
          }
        }
      },
      categories[]-> {
        _id,
        name,
        slug,
        color,
        icon
      }
    }`,
      { categoryId: category._id },
    ),
    `getPostsByCategory(${categorySlug})`,
  );
  return (posts || []) as Post[];
}

export const RELATED_POSTS_QUERY = (categoryId: string, currentPostId: string, limit: number = 3) =>
  `*[_type == "post" && references($categoryId) && _id != $currentPostId] | order(_createdAt desc)[0...${limit}] {
    _id,
    title,
    slug,
    excerpt,
    mainImage {
      asset-> {
        _id,
        url
      },
      alt
    },
    _createdAt,
    author-> {
      name,
      image {
        asset-> {
          _id,
          url
        }
      }
    },
    categories[]-> {
      _id,
      name,
      slug,
      color,
      icon
    }
  }`;

export async function getRelatedPosts(categoryId: string, currentPostId: string, limit: number = 3): Promise<Post[]> {
  return await client.fetch(RELATED_POSTS_QUERY(categoryId, currentPostId, limit), {
    categoryId,
    currentPostId,
  });
}

// Get a single post by slug
export const SINGLE_POST_QUERY = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  excerpt,
  mainImage {
    asset-> {
      _id,
      url
    },
    alt,
    caption
  },
  body,
  _createdAt,
  _updatedAt,
  featured,
  author-> {
    _id,
    name,
    image {
      asset-> {
        _id,
        url
      },
      alt
    },
    bio,
    email,
    socialLinks
  },
  categories[]-> {
    _id,
    name,
    slug,
    description,
    icon,
    color
  },
  "estimatedReadingTime": round(length(pt::text(body)) / 200)
}`;

export async function getBlogBySlug(slug: string): Promise<Post | null> {
  return (await fetchWithTimeout(
    client.fetch(SINGLE_POST_QUERY, { slug }),
    `getBlogBySlug(${slug})`,
  )) as Post | null;
}

// ==================== SITEMAP QUERIES ====================

/**
 * Get all blog posts with minimal data for sitemap
 * Optimized for performance - only fetches what's needed
 */
export const SITEMAP_BLOG_QUERY = `*[_type == "post"] | order(_updatedAt desc) {
  _id,
  slug,
  _updatedAt,
  publishedAt,
  "isPublished": defined(publishedAt)
}`;

/**
 * Get blog posts with pagination for large sites
 * Use this if you have more than 1000 posts
 */
export const SITEMAP_BLOG_PAGINATED_QUERY = (start: number, end: number) =>
  `*[_type == "post"] | order(_updatedAt desc)[${start}...${end}] {
    _id,
    slug,
    _updatedAt,
    publishedAt,
    "isPublished": defined(publishedAt)
  }`;

/**
 * Count total blog posts for sitemap statistics
 */
export const SITEMAP_BLOG_COUNT_QUERY = `count(*[_type == "post"])`;

/**
 * Get featured blog posts (higher priority in sitemap)
 */
export const SITEMAP_FEATURED_BLOG_QUERY = `*[_type == "post" && featured == true] {
  _id,
  slug,
  _updatedAt,
  publishedAt
}`;

/**
 * Get recent blog posts (for news sitemap)
 */
export const SITEMAP_RECENT_BLOG_QUERY = `*[_type == "post"] | order(_createdAt desc)[0...50] {
  _id,
  slug,
  _createdAt,
  _updatedAt,
  title
}`;

// ==================== SITEMAP FUNCTIONS ====================

export async function getBlogPostsForSitemap(): Promise<any[]> {
  try {
    return await client.fetch(SITEMAP_BLOG_QUERY);
  } catch (error) {
    console.error("Error fetching blog posts for sitemap:", error);
    return [];
  }
}

export async function getBlogPostsForSitemapPaginated(
  start: number,
  end: number,
): Promise<any[]> {
  try {
    return await client.fetch(SITEMAP_BLOG_PAGINATED_QUERY(start, end));
  } catch (error) {
    console.error("Error fetching paginated blog posts for sitemap:", error);
    return [];
  }
}

export async function getBlogPostsCountForSitemap(): Promise<number> {
  try {
    const count = await fetchWithTimeout(client.fetch(SITEMAP_BLOG_COUNT_QUERY), "getBlogPostsCountForSitemap");
    return (count || 0) as number;
  } catch (error) {
    console.error("Error counting blog posts for sitemap:", error);
    return 0;
  }
}

export async function getFeaturedBlogPostsForSitemap(): Promise<any[]> {
  try {
    const result = await fetchWithTimeout(client.fetch(SITEMAP_FEATURED_BLOG_QUERY), "getFeaturedBlogPostsForSitemap");
    return (result || []) as any[];
  } catch (error) {
    console.error("Error fetching featured blog posts for sitemap:", error);
    return [];
  }
}
