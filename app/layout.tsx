import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "quill/dist/quill.core.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getCachedLookupData,
  getCachedRegions,
  getCachedPopularCounties,
} from "@/lib/cache";
import LocationInitializer from "@/components/FileInputInitializer";

// ✅ ISR - Revalidate every 7 days (data doesn't change frequently)
export const revalidate = 604800; // 7 days in seconds

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Enhanced metadata with KENYADIVAS branding
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com",
  ),

  // Title configuration with brand name
  title: {
    default: "Nairobi Sex Girls  | Verified Companions",
    template: "%s | KENYADIVAS Kenya",
  },

  // Enhanced description
  description:
    "Over 900 girls for sex from all over KENYA  | Verified Companions",

  // Expanded keywords for better reach
  keywords: [
    "KENYADIVAS",
    "Kenya escorts",
    "Nairobi escorts",
    "Mombasa escorts",
    "Kisumu escorts",
    "Nakuru escorts",
    "premium escorts Kenya",
    "verified escorts Nairobi",
    "high class escorts Kenya",
    "Kiambu escorts",
    "Eldoret escorts",
    "Kakamega esorts",
    "Bungoma escorts",
    "premium companions Kenya",
    "verified escorts Nairobi",
    "high class escorts Kenya",
    "Kenya call girls",
    "Nairobi call girls",
    "escort services Nairobi",
    "Kenya adult entertainment",
    "discreet companions Kenya",
    "elite escorts Nairobi",
    "luxury escorts Kenya",
    "international escorts Kenya",
    "Kenya escort directory",
    "Nairobi nightlife",
    "Kenya companions",
    "VIP escorts Nairobi",
    "Kenya female escorts",
    "Nairobi model escorts",
    "Kenya escort reviews",
    "real escort photos Kenya",
  ].join(", "),

  // Authors
  authors: [{ name: "KENYADIVAS", url: "https://kenyadivas.com" }],

  // Open Graph with KENYADIVAS branding
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://kenyadivas.com",
    siteName: "KENYADIVAS Kenya",
    title: "Over 800 girls for sex from all over KENYA| Verified Companions",
    description:
      "Discover KENYADIVAS - Kenya's premier escort directory. Browse verified companions with real photos, authentic reviews, and transparent rates in Nairobi, Mombasa, and across Kenya.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KENYADIVAS - Premium Escorts in Kenya",
      },
    ],
    emails: ["contact@kenyadivas.com"],
    phoneNumbers: ["+254701694004"],
    countryName: "Kenya",
  },

  // Twitter card
  twitter: {
    card: "summary_large_image",
    site: "@kenyadivas",
    creator: "@kenyadivas",
    title: "KENYADIVAS - Premium Escorts in Kenya",
    description:
      "Kenya's most trusted escort directory. Verified companions, real photos, authentic reviews.",
    images: ["/twitter-image.jpg"],
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Manifest and PWA
  manifest: "/manifest.json",

  // Canonical and alternates
  alternates: {
    canonical: "https://kenyadivas.com",
    languages: {
      "en-KE": "https://kenyadivas.com",
      "en-US": "https://kenyadivas.com/en",
    },
  },

  // Apple web app
  appleWebApp: {
    capable: true,
    title: "KENYADIVAS",
    statusBarStyle: "black-translucent",
  },

  // Format detection
  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: true,
    url: true,
  },

  // Other metadata
  other: {
    rating: "RTA-5042-1996-1400-1577-RTA",
    distribution: "global",
    language: "English",
    "revisit-after": "7 days",
    author: "KENYADIVAS",
    copyright: `© ${new Date().getFullYear()} KENYADIVAS. All rights reserved.`,
    "geo.region": "KE-30", // Nairobi region code
    "geo.placename": "Nairobi, Kenya",
    "geo.position": "-1.286389;36.817223",
    ICBM: "-1.286389, 36.817223",
    "og:price:currency": "KES",
    "fb:app_id":
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "your-facebook-app-id",
    "twitter:app:country": "KE",
    "business:contact_data:country": "Kenya",
    "business:contact_data:region": "Nairobi",
    "business:contact_data:email": "support@cabsandmore.com",
    "business:contact_data:phone_number": "+254743129621",
    "pinterest-rich-pin": "enabled",
  },
};

// JSON-LD Structured Data for homepage with KENYADIVAS branding
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://kenyadivas.com/#website",
      name: "KENYADIVAS",
      description: "Premium Escort Directory in Kenya",
      url: "https://kenyadivas.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://kenyadivas.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        "@type": "Organization",
        "@id": "https://kenyadivas.com/#organization",
        name: "KENYADIVAS",
        url: "https://kenyadivas.com",
        logo: {
          "@type": "ImageObject",
          url: "https://kenyadivas.com/logo.png",
          width: 600,
          height: 60,
        },
        sameAs: [
          "https://twitter.com/kenyadivas",
          "https://www.instagram.com/kenyadivas",
          "https://www.facebook.com/kenyadivas",
        ],
        email: "contact@kenyadivas.com",
        telephone: "+254700000000",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Nairobi",
          addressRegion: "Nairobi",
          addressCountry: "KE",
        },
      },
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://kenyadivas.com/#business",
      name: "KENYADIVAS Escort Directory",
      description:
        "Premium escort directory connecting clients with verified companions across Kenya",
      url: "https://kenyadivas.com",
      telephone: "+254700000000",
      email: "contact@kenyadivas.com",
      areaServed: [
        {
          "@type": "City",
          name: "Nairobi",
          sameAs: "https://www.wikidata.org/wiki/Q3870",
        },
        {
          "@type": "City",
          name: "Mombasa",
          sameAs: "https://www.wikidata.org/wiki/Q225641",
        },
        {
          "@type": "City",
          name: "Kisumu",
          sameAs: "https://www.wikidata.org/wiki/Q220624",
        },
        {
          "@type": "Country",
          name: "Kenya",
          sameAs: "https://www.wikidata.org/wiki/Q114",
        },
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "KE",
        addressRegion: "Nairobi",
        addressLocality: "Nairobi",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: -1.286389,
        longitude: 36.817223,
      },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
          opens: "00:00",
          closes: "23:59",
        },
      ],
      priceRange: "$$$",
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://kenyadivas.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://kenyadivas.com",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://kenyadivas.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KENYADIVAS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KENYADIVAS is Kenya's premier escort directory connecting clients with verified, high-quality companions in Nairobi, Mombasa, and across Kenya.",
          },
        },
        {
          "@type": "Question",
          name: "Are the escorts on KENYADIVAS verified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all escorts featured on KENYADIVAS go through a strict verification process to ensure authenticity and quality service.",
          },
        },
        {
          "@type": "Question",
          name: "How do I book an escort on KENYADIVAS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Browse our verified listings, view real photos and reviews, and contact escorts directly through their preferred contact method listed on their profile.",
          },
        },
        {
          "@type": "Question",
          name: "Is KENYADIVAS discreet?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we prioritize client and escort privacy with discreet booking processes and secure communication channels.",
          },
        },
      ],
    },
  ],
};

// Organization schema for better local SEO
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KENYADIVAS",
  url: "https://kenyadivas.com",
  logo: "https://kenyadivas.com/logo.png",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254700000000",
      contactType: "customer service",
      email: "support@kenyadivas.com",
      availableLanguage: ["English", "Swahili"],
      areaServed: "KE",
    },
  ],
  sameAs: [
    "https://twitter.com/kenyadivas",
    "https://www.instagram.com/kenyadivas",
    "https://www.facebook.com/kenyadivas",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Pre-fetch on server
  const [counties, regions, lookup] = await Promise.all([
    getCachedPopularCounties(),
    getCachedRegions(),
    getCachedLookupData(),
  ]);

  return (
    <ClerkProvider>
      <html lang="en-KE">
        <head>
          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />

          {/* Preconnect to important domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link rel="preconnect" href="https://images.unsplash.com" />
          <link rel="preconnect" href="https://client.crisp.chat" />

          {/* Preload critical assets */}
          <link rel="preload" href="/background.jpg" as="image" />
          <link rel="preload" href="/logo.png" as="image" />

          {/* Apple Touch Icon */}
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="apple-mobile-web-app-title" content="KENYADIVAS" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          {/* // zoom in on  mount to fit browser */}
          {/* <meta
            name="viewport"
            content="width=device-width, initial-scale=0.75, minimum-scale=0.75, maximum-scale=1"
          /> */}

          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
          <meta name="msapplication-config" content="/browserconfig.xml" />

          {/* Additional meta tags */}
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="KENYADIVAS" />

          {/* Language and region */}
          <meta name="language" content="English" />
          <meta name="geo.country" content="KE" />
          <meta name="geo.region" content="KE-30" />

          {/* PWA Configuration */}
          <link rel="manifest" href="/manifest.json" />

          {/* RSS Feed */}
          <link
            rel="alternate"
            type="application/rss+xml"
            title="KENYADIVAS - Latest Escorts"
            href="/rss.xml"
          />

          {/* Sitemap */}
          <link
            rel="sitemap"
            type="application/xml"
            title="Sitemap"
            href="/sitemap.xml"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased  text-white bg-dark-slate min-h-screen flex flex-col`}
        >
          {/* Fixed Grayscale Background */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: -1,
              overflow: "hidden",
            }}
          >
            <Image
              src="/background.jpg"
              alt="KENYADIVAS Background"
              fill
              priority
              quality={50}
              style={{
                objectFit: "cover",
                filter: "grayscale(100%)",
              }}
            />
          </div>

          <header>
            <Header initialCounties={counties.data} />
            {/* <PopularCountiesInitializer counties={counties.data} /> */}
          </header>

          {/* Main Content */}
          <main className="bg-black/80  flex-1 py-4 w-full">
            <TooltipProvider>{children}</TooltipProvider>
            <LocationInitializer
              initialCounties={counties.data}
              initialRegions={regions.data}
              initialLookup={lookup.data}
            />
          </main>

          <div>
            <Footer />
          </div>

          <Toaster position="bottom-left" />
        </body>
      </html>
    </ClerkProvider>
  );
}
