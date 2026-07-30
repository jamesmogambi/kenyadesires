/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ CRITICAL: Add standalone output for cPanel deployment
  output: "standalone",

  images: {
    // formats: ["image/avif", "image/webp"],
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

      // ✅ Firebase Storage (consolidated)
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/**",
      },

      // Local development
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
    qualities: [50, 75, 60, 90],
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],

  // Enable compression
  compress: true,
};

module.exports = nextConfig;
