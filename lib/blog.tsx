import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { mdxComponents } from "./mdx-components";

/**
 * Blog post interface
 * Customize this to add more fields to your blog posts
 */
export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  author?: string;
  tags?: string[];
  readingTime?: number;
  content?: React.ReactElement;
  image?: string;
  imageAlt?: string;
}

/**
 * Content directory - customize this path if needed
 * Default: content/blog
 */
const contentDirectory = path.join(process.cwd(), "content", "blog");

/**
 * Ensure the content directory exists
 */
function ensureContentDirectory() {
  if (!fs.existsSync(contentDirectory)) {
    return false;
  }
  return true;
}

/**
 * Get all blog posts
 * Returns an array of posts sorted by date (newest first)
 *
 * @returns Promise<BlogPost[]>
 */
export async function getAllPosts(): Promise<BlogPost[]> {
  if (!ensureContentDirectory()) {
    return [];
  }

  const files = fs.readdirSync(contentDirectory);
  const mdxFiles = files.filter(
    (file) => file.endsWith(".mdx") || file.endsWith(".md")
  );

  const posts = await Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx?$/, "");
      const post = await getPostBySlug(slug);
      return post;
    })
  );

  // Filter out any null posts and sort by date (newest first)
  return posts
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Get a single blog post by slug
 *
 * @param slug - The post slug (filename without extension)
 * @returns Promise<BlogPost | null>
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!ensureContentDirectory()) {
    return null;
  }

  try {
    // Try both .mdx and .md extensions
    let filePath = path.join(contentDirectory, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(contentDirectory, `${slug}.md`);
      if (!fs.existsSync(filePath)) {
        return null;
      }
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    // Calculate reading time
    const stats = readingTime(content);

    // Compile MDX to React component
    const { content: mdxContent } = await compileMDX({
      source: content,
      components: mdxComponents,
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm], // Enables tables, strikethrough, task lists, etc.
          rehypePlugins: [rehypeSlug], // Adds IDs to headings for Table of Contents
        },
      },
    });

    return {
      slug,
      title: data.title || "Untitled",
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || data.description || "",
      author: data.author,
      tags: data.tags || [],
      readingTime: Math.ceil(stats.minutes),
      content: mdxContent,
      image: data.image,
      imageAlt: data.imageAlt || data.title || "Blog post image",
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}

/**
 * Get posts filtered by tag
 *
 * @param tag - The tag to filter by
 * @returns Promise<BlogPost[]>
 */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.tags && post.tags.includes(tag));
}

/**
 * Get all unique tags from all posts
 * Returns sorted alphabetically
 *
 * @returns Promise<string[]>
 */
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const tags = new Set<string>();

  allPosts.forEach((post) => {
    if (post.tags) {
      post.tags.forEach((tag) => tags.add(tag));
    }
  });

  return Array.from(tags).sort();
}
