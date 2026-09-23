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
    qualities: [50, 75],
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
