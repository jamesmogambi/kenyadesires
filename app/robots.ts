// app/robots.ts
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
          "/_next/",
          "/static/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/login",
          "/signup",
          "/profile/",
          "/*?*",
        ],
        // Googlebot specific crawl delay (optional)
        crawlDelay: 2, // 2 seconds between requests
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/*?*"],
        crawlDelay: 2,
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/*?*"],
        crawlDelay: 2,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
