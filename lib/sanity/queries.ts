import { client } from './client'
import { CATEGORIES } from '@/types/sanity'
import type { Post, Category } from '@/types/sanity'

// Helper function to convert Prismic-like posts to Sanity format
function mapSanityPost(post: any): Post {
  return {
    _id: post._id,
    title: post.title,
    slug: {
      current: post.slug?.current || post.slug || '',
      _type: 'slug',
    },
    excerpt: post.excerpt,
    mainImage: post.mainImage,
    body: post.body,
    _createdAt: post._createdAt || post.publishedAt,
    _updatedAt: post._updatedAt,
    author: post.author,
    categories: post.categories || [],
    relatedPosts: post.relatedPosts,
    readingTime: post.readingTime,
  }
}

// Fetch all published posts
export async function getAllPosts(): Promise<Post[]> {
  const query = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    _createdAt,
    "author": author->{name, image, bio},
    categories[]->{name, slug, description},
    readingTime
  }`
  const posts = await client.fetch(query)
  return posts.map(mapSanityPost)
}

// Fetch a single post by slug
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    body,
    publishedAt,
    _createdAt,
    "author": author->{name, image, bio},
    categories[]->{name, slug, description},
    readingTime
  }`
  const post = await client.fetch(query, { slug })
  return post ? mapSanityPost(post) : null
}

// Fetch posts by category
export async function getPostsByCategory(categorySlug: string): Promise<Post[]> {
  const query = `*[_type == "post" && $categorySlug in categories[]->slug.current] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    _createdAt,
    "author": author->{name, image, bio},
    categories[]->{name, slug, description},
    readingTime
  }`
  const posts = await client.fetch(query, { categorySlug })
  return posts.map(mapSanityPost)
}

// Fetch all categories
export async function getCategories(): Promise<Category[]> {
  const query = `*[_type == "category" && defined(slug.current)] {
    _id,
    name,
    "slug": slug.current,
    description,
    _createdAt
  }`
  return client.fetch(query)
}

// Fetch related posts (excluding the current post)
export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const query = `*[_type == "post" && slug.current != $slug] | order(publishedAt desc) [0...$limit] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    "author": author->{name, image, bio},
    categories[]->{name, slug, description},
    readingTime
  }`
  const posts = await client.fetch(query, { slug, limit })
  return posts.map(mapSanityPost)
}

// Fetch static categories (from your hardcoded list)
export function getStaticCategories(): Category[] {
  return CATEGORIES
}

// Paginated posts query
export async function getPaginatedPosts(page = 1, pageSize = 12): Promise<{ posts: Post[]; total: number }> {
  const start = (page - 1) * pageSize
  const end = start + pageSize

  const countQuery = `count(*[_type == "post" && defined(slug.current)])`
  const total = await client.fetch(countQuery)

  const query = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) [${start}...${end}] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    mainImage,
    publishedAt,
    _createdAt,
    "author": author->{name, image, bio},
    categories[]->{name, slug, description},
    readingTime
  }`
  const posts = await client.fetch(query)

  return {
    posts: posts.map(mapSanityPost),
    total,
  }
}