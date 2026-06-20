import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    /* config options here */
    images: {
        // Allow WebP format
        formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "static-eu-cdn.eporner.com",
                port: "",
                pathname: "/thumbs/static/**",
                search: "",
            },
             {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/images/**',
      },
            {
                protocol: "https",
                hostname: "iptn.m3pd.com",
                port: "",
                pathname: "/media/tn/**",
                search: "",
            },
            {
                protocol: "https",
                hostname: "www.rahaporn.com",
                // port: "",
                // pathname: "",
                // search: "",
            },

            {
                protocol: "https",
                hostname: "images.unsplash.com",
                pathname: "/**",
            },

            {
                protocol: "https",
                hostname: "img.clerk.com",
            },
            {
                protocol: "https",
                hostname: "images.clerk.dev",
            },
            {
                protocol: "https",
                hostname: "in-porn.s3.us-east-1.amazonaws.com",
            },
            {
                protocol: "https",
                hostname: "image.mux.com",
            },
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
                hostname: "res.cloudinary.com",
            },
            {
                protocol: "https",
                hostname: "mombasahot.s3.us-east-005.backblazeb2.com",
            },

            {
                protocol: "https",
                hostname: "escort254.com",
            },
            {
                protocol: "https",
                hostname: "afrohot.s3.us-east-005.backblazeb2.com",
            },
            {
                protocol: "https",
                hostname: "thikaescorts.s3.us-east-005.backblazeb2.com",
            },

            {
                protocol: "https",
                hostname: "rahaescorts.com",
            },
            {
                protocol: "https",
                hostname: "i0.wp.com",
            },
            {
                protocol: "http",
                hostname: "localhost",
            },

            {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
            },
        ],
        qualities: [25, 50, 75, 90, 100],
    },
    eslint: {
        // Only disable for production builds, keep during development
        ignoreDuringBuilds: process.env.NODE_ENV === "production",
    },
    typescript: {
        // Only disable for production builds, keep during development
        ignoreBuildErrors: true,
    },
    allowedDevOrigins: ["local-origin.dev", "*.local-origin.dev"],

    // Add headers for better image caching
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    {key: "Access-Control-Allow-Credentials", value: "true"},
                    {key: "Access-Control-Allow-Origin", value: "*"},
                    {
                        key: "Access-Control-Allow-Methods",
                        value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                    },
                    {
                        key: "Access-Control-Allow-Headers",
                        value:
                            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
                    },
                ],
            },
            {
                source: "/_next/image",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
