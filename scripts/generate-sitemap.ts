import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

async function generateSitemap() {
  console.log("🔄 Generating sitemap via CLI...");

  try {
    // Import the sitemap function
    const { default: sitemap } = await import("../app/sitemap");

    // Generate sitemap entries
    const entries = await sitemap();

    // Create XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("")}
</urlset>`;

    // Write to public directory
    const publicDir = join(process.cwd(), "public");
    mkdirSync(publicDir, { recursive: true });

    const filePath = join(publicDir, "sitemap.xml");
    writeFileSync(filePath, xml);

    console.log(`✅ Sitemap generated successfully at ${filePath}`);
    console.log(`📊 Total URLs: ${entries.length}`);
  } catch (error) {
    console.error("❌ Failed to generate sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();
