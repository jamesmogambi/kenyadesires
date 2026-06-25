import { client } from "./client";
import type { Category, Post } from "@/types/sanity";

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
  return await client.fetch(ALL_CATEGORIES_QUERY);
}

export async function getCategoryBySlug(
  slug: string,
): Promise<Category | null> {
  return await client.fetch(CATEGORY_BY_SLUG_QUERY, { slug });
}

// Featured Posts Functions
export async function getFeaturedPosts(): Promise<Post[]> {
  return await client.fetch(FEATURED_POSTS_QUERY);
}

export async function getFeaturedPostsWithLimit(
  limit: number = 6,
): Promise<Post[]> {
  return await client.fetch(FEATURED_POSTS_WITH_LIMIT_QUERY(limit));
}

export async function getFeaturedPostsWithContent(): Promise<Post[]> {
  return await client.fetch(FEATURED_POSTS_FULL_QUERY);
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

  const [posts, total] = await Promise.all([
    client.fetch(POSTS_WITH_PAGINATION_QUERY, { start, end }),
    client.fetch(POSTS_COUNT_QUERY),
  ]);

  return {
    posts,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// All posts
export async function getAllPosts(): Promise<Post[]> {
  return await client.fetch(ALL_POSTS_QUERY);
}

// Posts by category
export async function getPostsByCategory(
  categorySlug: string,
): Promise<Post[]> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) return [];

  return await client.fetch(
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
  );
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
  return await client.fetch(SINGLE_POST_QUERY, { slug });
}
