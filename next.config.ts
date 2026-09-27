/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ CRITICAL: Add standalone output for cPanel deployment
  output: "standalone",

  // ✅ Turbopack resolve alias for Clerk ESM modules
  turbopack: {
    resolveAlias: {
      "@clerk/shared": require.resolve("@clerk/shared"),
    },
  },

  images: {
    // 90 is requested by app/contact/BottomSection.tsx,
    // app/blog/[slug]/AuthorSection.tsx and components/blog/WhyProfile.tsx.
    // Next 16 only serves qualities listed here, so omitting it makes those
    // images fall back to the default and log an unconfigured-quality warning.
    qualities: [50, 75, 90],
    remotePatterns: [
      // Adult content
      {
        protocol: "https",
        hostname: "static-eu-cdn.eporner.com",
        pathname: "/thumbs/static/**",
      },
      {
        protocol: "https",
        hostname: "iptn.m3pd.com",
        pathname: "/media/tn/**",
      },
      {
        protocol: "https",
        hostname: "www.rahaporn.com",
      },
      {
        protocol: "https",
        hostname: "in-porn.s3.us-east-1.amazonaws.com",
      },

      // CMS & CDN
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },

      // Authentication
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },

      // Media
      {
        protocol: "https",
        hostname: "image.mux.com",
      },
      {
        protocol: "https",
        hostname: "stream.mux.com",
        pathname: "/**",
      },

      // Escort directories
      {
        protocol: "https",
        hostname: "dobryprivat.cz",
      },
      {
        protocol: "https",
        hostname: "www.kenyahotgirls.com",
      },
      {
        protocol: "https",
        hostname: "escort254.com",
      },
      {
        protocol: "https",
        hostname: "rahaescorts.com",
      },

       // Backblaze storage
      {
        protocol: "https",
        hostname: "mombasahot.s3.us-east-005.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "afrohot.s3.us-east-005.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "thikaescorts.s3.us-east-005.backblazeb2.com",
      },

      // Firebase Storage
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },
      {
        // Firebase Storage *download* host. The entry above only covers the
        // `storage.googleapis.com` API path, but image URLs stored in
        // `escorts.images` / `escorts.cleaned_images` are served from
        // firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media&token=…
        // which is the most common host in the data (3,812 references).
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/v0/b/**",
      },

      // Local development
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],

  // Enable compression
  compress: true,

cacheComponents: true,
  cacheLife: {
    daily: {
      stale: 3600, // 1 hour — client cache duration
      revalidate: 3600, // 1 hour — server refresh interval
      expire: 86400, // 1 day — max cache lifetime
    },
  },
};

module.exports = nextConfig;
