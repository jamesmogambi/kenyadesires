import { MetadataRoute } from "next";
import {
  firebaseTimestampToDate,
  sanitizeUrl,
  logSitemapStats,
  validateSitemapEntries,
  getPriorityForContentType,
  getChangeFrequencyForContentType,
  createSitemapEntry,
} from "@/lib/sanity/sitemap-helper";
import {
  getBlogPostsCountForSitemap,
  getBlogPostsForSitemap,
  getFeaturedBlogPostsForSitemap,
} from "@/lib/sanity/queries";

export const dynamic = "force-dynamic";

// Optional: Use edge runtime for better performance
// export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com";
  const startTime = Date.now();

  console.log(`🔄 Generating sitemap for KenyaDesires...`);

  try {
    // ==================== 1. STATIC ROUTES ====================
    const staticRoutes = [
      { path: "", priority: 1.0, changefreq: "daily" as const },
      { path: "/girls", priority: 0.9, changefreq: "daily" as const },
      { path: "/agencies", priority: 0.8, changefreq: "daily" as const },
      { path: "/blog", priority: 0.9, changefreq: "daily" as const },
      { path: "/contact", priority: 0.7, changefreq: "monthly" as const },
      {
        path: "/frequent-questions",
        priority: 0.6,
        changefreq: "monthly" as const,
      },
      { path: "/terms-of-use", priority: 0.5, changefreq: "yearly" as const },
      { path: "/privacy-policy", priority: 0.5, changefreq: "yearly" as const },
      { path: "/bdsm", priority: 0.6, changefreq: "monthly" as const },
      {
        path: "/erotic-massages",
        priority: 0.6,
        changefreq: "monthly" as const,
      },
      {
        path: "/join-provider",
        priority: 0.9,
        changefreq: "weekly" as const,
      },
      {
        path: "/join-agency",
        priority: 0.9,
        changefreq: "weekly" as const,
      },
    ];

    const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
      url: sanitizeUrl(baseUrl, route.path),
      lastModified: new Date(),
      changeFrequency: route.changefreq,
      priority: route.priority,
    }));

    console.log(`✅ Added ${staticEntries.length} static routes`);

    // ==================== 2. BLOG POSTS - Sanity ====================
    let blogEntries: MetadataRoute.Sitemap = [];
    let blogCount = 0;

    try {
      // Get blog posts count for logging
      blogCount = await getBlogPostsCountForSitemap();
      console.log(`📝 Found ${blogCount} blog posts in Sanity`);

      // Fetch featured posts (higher priority)
      const featuredPosts = await getFeaturedBlogPostsForSitemap();
      console.log(`⭐ Found ${featuredPosts.length} featured blog posts`);

      // Fetch all blog posts
      const posts = await getBlogPostsForSitemap();

      if (posts && posts.length > 0) {
        blogEntries = posts
          .filter((post: any) => post.slug?.current)
          .map((post: any) => {
            // Check if post is featured for higher priority
            const isFeatured = featuredPosts.some((fp) => fp._id === post._id);

            return {
              url: sanitizeUrl(baseUrl, `blog/${post.slug.current}`),
              lastModified: post._updatedAt
                ? new Date(post._updatedAt)
                : new Date(),
              changeFrequency: isFeatured
                ? ("weekly" as const)
                : ("monthly" as const),
              priority: isFeatured ? 0.9 : 0.7,
            };
          });

        console.log(`✅ Added ${blogEntries.length} blog posts to sitemap`);
      } else {
        console.warn(`⚠️ No blog posts found in Sanity`);
      }
    } catch (error) {
      console.error(`❌ Error fetching blog posts from Sanity:`, error);

      // Fallback: Try direct GROQ query
      try {
        const { client } = await import("@/lib/sanity/client");
        const fallbackQuery = `*[_type == "post"] {
          _id,
          slug,
          _updatedAt,
          publishedAt,
          featured
        }`;

        const fallbackPosts = await client.fetch(fallbackQuery);
        blogEntries = fallbackPosts
          .filter((post: any) => post.slug?.current)
          .map((post: any) => ({
            url: sanitizeUrl(baseUrl, `blog/${post.slug.current}`),
            lastModified: post._updatedAt
              ? new Date(post._updatedAt)
              : new Date(),
            changeFrequency: post.featured
              ? ("weekly" as const)
              : ("monthly" as const),
            priority: post.featured ? 0.9 : 0.7,
          }));

        console.log(`✅ Fallback: Added ${blogEntries.length} blog posts`);
      } catch (fallbackError) {
        console.error(`❌ Fallback query failed:`, fallbackError);
        // Continue with other content types
      }
    }

    // ==================== 3. ESCORTS - Firebase ====================
    let escortEntries: MetadataRoute.Sitemap = [];

    try {
      // Dynamic import to avoid Firebase issues if not available
      const { db } = await import("@/lib/firebase");
      const { collection, getDocs } = await import("firebase/firestore");

      const escortsRef = collection(db, "escorts");
      const escortsSnapshot = await getDocs(escortsRef);

      escortEntries = escortsSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const id = data.id || doc.id;
          const slug = data.slug || id;

          if (!slug) return null;

          const lastModified = firebaseTimestampToDate(data.updatedAt);

          // Higher priority for verified escorts
          const priority = data.isVerified ? 0.95 : 0.8;

          return {
            url: sanitizeUrl(baseUrl, `girl/${slug}`),
            lastModified,
            changeFrequency: "daily" as const,
            priority,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      console.log(`✅ Added ${escortEntries.length} escorts to sitemap`);
    } catch (error) {
      console.error(`❌ Error fetching escorts for sitemap:`, error);
      // Continue with other content types
    }

    // ==================== 4. AGENCIES - Firebase ====================
    let agencyEntries: MetadataRoute.Sitemap = [];

    try {
      const { db } = await import("@/lib/firebase");
      const { collection, getDocs } = await import("firebase/firestore");

      const agenciesRef = collection(db, "agencies");
      const agenciesSnapshot = await getDocs(agenciesRef);

      agencyEntries = agenciesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          const slug = data.slug || doc.id;

          if (!slug) return null;

          const lastModified = firebaseTimestampToDate(data.updatedAt);

          return {
            url: sanitizeUrl(baseUrl, `agencies/${slug}`),
            lastModified,
            changeFrequency: "weekly" as const,
            priority: 0.6,
          };
        })
        .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

      console.log(`✅ Added ${agencyEntries.length} agencies to sitemap`);
    } catch (error) {
      console.error(`❌ Error fetching agencies for sitemap:`, error);
    }

    // ==================== 5. COUNTY-FILTERED GIRLS PAGES ====================
    let countyEntries: MetadataRoute.Sitemap = [];

    try {
      const { getAllCounties } = await import("@/server-actions/county.action");
      const res = await getAllCounties();
      const counties = res?.data || [];

      countyEntries = (counties || [])
        .filter((county: any) => county?.name)
        .map((county: any) => ({
          url: sanitizeUrl(
            baseUrl,
            `girls?county=${encodeURIComponent(county.name)}`,
          ),
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.7,
        }));

      console.log(
        `✅ Added ${countyEntries.length} county-filtered girls pages to sitemap`,
      );
    } catch (error) {
      console.error(`❌ Error fetching counties for sitemap:`, error);
    }

    // ==================== 6. PRACTICE-FILTERED GIRLS PAGES ====================
    let practiceEntries: MetadataRoute.Sitemap = [];

    try {
      const { getPracticesFromCleanedEscorts } = await import(
        "@/server-actions/cleaned-escorts.action",
      );
      const practices = await getPracticesFromCleanedEscorts();

      practiceEntries = (practices || [])
        .filter((p: any) => p?.practice)
        .map((p: any) => ({
          url: sanitizeUrl(
            baseUrl,
            `girls?practice=${encodeURIComponent(p.practice)}&page=1`,
          ),
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.6,
        }));

      console.log(
        `✅ Added ${practiceEntries.length} practice-filtered girls pages to sitemap`,
      );
    } catch (error) {
      console.error(`❌ Error fetching practices for sitemap:`, error);
    }

    // ==================== 7. COUNTY + REGION COMBO GIRLS PAGES ====================
    let comboEntries: MetadataRoute.Sitemap = [];

    try {
      const { getAllRegions } = await import("@/server-actions/region.action");
      const res = await getAllRegions();
      const regions = res?.data || [];

      comboEntries = (regions || [])
        .filter((r: any) => r?.county && r?.name)
        .map((r: any) => ({
          url: sanitizeUrl(
            baseUrl,
            `girls?county=${encodeURIComponent(r.county)}&region=${encodeURIComponent(r.name)}`,
          ),
          lastModified: new Date(),
          changeFrequency: "daily" as const,
          priority: 0.5,
        }));

      console.log(
        `✅ Added ${comboEntries.length} county+region combo girls pages to sitemap`,
      );
    } catch (error) {
      console.error(`❌ Error fetching regions for sitemap:`, error);
    }

    // ==================== 5. COMBINE AND VALIDATE ====================
    const allEntries = [
      ...staticEntries,
      ...blogEntries,
      ...escortEntries,
      ...agencyEntries,
      ...countyEntries,
      ...practiceEntries,
      ...comboEntries,
    ];

    // Validate entries
    const { valid, invalid } = validateSitemapEntries(allEntries);

    if (invalid.length > 0) {
      console.warn(`⚠️ Found ${invalid.length} invalid sitemap entries`);
    }

    // Log statistics
    const categories = {
      static: staticEntries.length,
      blog: blogEntries.length,
      escorts: escortEntries.length,
      agencies: agencyEntries.length,
      counties: countyEntries.length,
      practices: practiceEntries.length,
      combos: comboEntries.length,
    };

    logSitemapStats(valid, categories);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Sitemap generated in ${duration}s`);

    return valid;
  } catch (error) {
    console.error(`💥 Fatal error generating sitemap:`, error);

    // Return minimal sitemap with just static routes
    return [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${baseUrl}/girls`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.8,
      },
    ];
  }
}
