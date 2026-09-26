// app/robots.ts
import { MetadataRoute } from "next";

/**
 * Private areas that must never be crawled or indexed by any engine,
 * including AI crawlers. Kept in one place so every rule below stays in sync.
 */
const PRIVATE_PATHS = [
  "/admin/",
  "/dashboard/",
  "/api/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/profile/",
  "/my-account/",
  "/bookings/",
  "/messages/",
  "/favorites/",
  "/invoices/",
  "/administration/",
  "/spaceship-test/",
  "/playground/",
];

/**
 * AI / answer-engine crawlers we explicitly welcome.
 *
 * These are declared BEFORE the `*` rule because robots.txt picks the
 * most specific matching group, and we want these crawlers to get a
 * clean allow over public content instead of inheriting the `*` blocklist.
 *
 * Note: GPTBot (OpenAI model training) and Google-Extended (Gemini /
 * AI Overviews training) are allowed deliberately — being the "named
 * brand" in model answers requires being in the retrieval corpus.
 * If that is ever unwanted, remove the single entry, do not add a Disallow.
 */
const AI_CRAWLERS = [
  // OpenAI
  "OAI-SearchBot", // ChatGPT search results / citations
  "ChatGPT-User", // user-triggered fetch when a ChatGPT user opens a link
  "GPTBot", // OpenAI crawler for model training
  // Anthropic
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google (Gemini + AI Overviews grounding)
  "Google-Extended",
  "GoogleOther", // Google's general AI/vertex dataset crawler
  // Meta AI
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  // Mistral
  "MistralAI-User",
  // Apple Intelligence
  "Applebot-Extended",
  // Common Crawl — upstream corpus for many third-party AI systems
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";

  return {
    rules: [
      // ---- AI / answer-engine crawlers: full access to public content ----
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE_PATHS,
      })),

      // ---- Classic search engines ----
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: PRIVATE_PATHS,
        crawlDelay: 2,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: PRIVATE_PATHS,
        crawlDelay: 2,
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: PRIVATE_PATHS,
        crawlDelay: 2,
      },

      // ---- Catch-all. Must be LAST so it never shadows a group above. ----
      {
        userAgent: "*",
        allow: "/",
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
