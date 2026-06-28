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
import Head from "next/head";

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

// Enhanced metadata with KENYADESIRES branding - Kenya-wide focus
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com",
  ),

  // Title configuration with Kenya-wide reach
  title: {
    default: "Kenya Escorts | Verified Companions Across Kenya",
    template: "%s | KenyaDesires - Premium Escorts Kenya",
  },

  // Enhanced description with Kenya-wide focus
  description:
    "Discover 900+ verified escorts across Kenya. Find premium companions in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret & all major cities. Real photos, authentic reviews.",

  // Expanded keywords with Kenya-wide coverage
  keywords: [
    // Brand
    "KenyaDesires",

    // National coverage
    "Kenya escorts",
    "escorts in Kenya",
    "Kenya call girls",
    "verified escorts Kenya",
    "premium escorts Kenya",
    "high class escorts Kenya",
    "Kenya companion services",
    "Kenya adult entertainment",
    "Kenya escort directory",

    // Major cities
    "Nairobi escorts",
    "Mombasa escorts",
    "Kisumu escorts",
    "Nakuru escorts",
    "Eldoret escorts",
    "Kiambu escorts",
    "Thika escorts",
    "Malindi escorts",
    "Kitale escorts",
    "Kakamega escorts",
    "Bungoma escorts",
    "Meru escorts",
    "Nyeri escorts",
    "Embu escorts",
    "Machakos escorts",
    "Kisii escorts",
    "Vihiga escorts",
    "Busia escorts",
    "Homa Bay escorts",
    "Migori escorts",
    "Siaya escorts",
    "Turkana escorts",
    "Garissa escorts",
    "Wajir escorts",
    "Mandera escorts",

    // Service types
    "premium companions Kenya",
    "elite escorts Kenya",
    "luxury escorts Kenya",
    "international escorts Kenya",
    "VIP escorts Kenya",
    "Kenya female escorts",
    "Kenya model escorts",
    "discreet companions Kenya",

    // Additional keywords
    "Nairobi call girls",
    "escort services Nairobi",
    "Kenya nightlife",
    "Kenya companions",
    "Kenya escort reviews",
    "real escort photos Kenya",
    "verified companion directory",
    "trusted escorts Kenya",
  ].join(", "),

  // Authors
  authors: [{ name: "KenyaDesires", url: "https://kenyadesires.com" }],

  // Open Graph with Kenya-wide branding
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: "https://kenyadesires.com",
    siteName: "KenyaDesires - Premium Escorts Kenya",
    title: "Kenya Escorts | 900+ Verified Companions Across Kenya",
    description:
      "Find premium verified escorts across Kenya. Browse 900+ companions with real photos, authentic reviews, and transparent rates in Nairobi, Mombasa, Kisumu, and all major cities.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KenyaDesires - Premium Escorts Directory Kenya",
      },
    ],
    emails: ["contact@kenyadesires.com"],
    phoneNumbers: ["+254701694004"],
    countryName: "Kenya",
  },

  // Twitter card
  twitter: {
    card: "summary_large_image",
    site: "@kenyadesires",
    creator: "@kenyadesires",
    title: "KenyaDesires - Premium Escorts Across Kenya",
    description:
      "Kenya's most trusted escort directory. 900+ verified companions across Nairobi, Mombasa, Kisumu & all major cities. Real photos, authentic reviews.",
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
    canonical: "https://kenyadesires.com",
    languages: {
      "en-KE": "https://kenyadesires.com",
      "en-US": "https://kenyadesires.com/en",
    },
  },

  // Apple web app
  appleWebApp: {
    capable: true,
    title: "KenyaDesires",
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
    author: "KenyaDesires",
    copyright: `© ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
    "geo.region": "KE", // National level
    "geo.placename": "Kenya",
    "geo.position": "-1.286389;36.817223",
    ICBM: "-1.286389, 36.817223",
    "og:price:currency": "KES",
    "fb:app_id":
      process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "your-facebook-app-id",
    "twitter:app:country": "KE",
    "business:contact_data:country": "Kenya",
    "business:contact_data:region": "Nairobi",
    "business:contact_data:email": "support@kenyadesires.com",
    "business:contact_data:phone_number": "+254743129621",
    "pinterest-rich-pin": "enabled",
  },
};

// JSON-LD Structured Data with Kenya-wide focus
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://kenyadesires.com/#website",
      name: "KenyaDesires - Kenya Escorts | Premium Verified Companions Across Kenyam| Nairobi Hot Escorts | Nairobi Escorts | Mombasa Escorts | Kisumu Escorts | Nakuru Escorts | Eldoret Escorts",
      description:
        "Find verified escorts and companions across Kenya. Premium companions in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and all major cities.",
      url: "https://kenyadesires.com",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://kenyadesires.com/search?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
      publisher: {
        "@type": "Organization",
        "@id": "https://kenyadesires.com/#organization",
        name: "KenyaDesires",
        url: "https://kenyadesires.com",
        logo: {
          "@type": "ImageObject",
          url: "https://kenyadesires.com/logo.png",
          width: 600,
          height: 60,
        },
        sameAs: [
          "https://twitter.com/kenyadesires",
          "https://www.instagram.com/kenyadesires",
          "https://www.facebook.com/kenyadesires",
        ],
        email: "contact@kenyadesires.com",
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
      "@id": "https://kenyadesires.com/#business",
      name: "KenyaDesires Escort Directory",
      description:
        "Premium escort directory connecting clients with verified companions across all counties in Kenya",
      url: "https://kenyadesires.com",
      telephone: "+254700000000",
      email: "contact@kenyadesires.com",
      areaServed: [
        {
          "@type": "Country",
          name: "Kenya",
          sameAs: "https://www.wikidata.org/wiki/Q114",
        },
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
          "@type": "City",
          name: "Nakuru",
          sameAs: "https://www.wikidata.org/wiki/Q1385858",
        },
        {
          "@type": "City",
          name: "Eldoret",
          sameAs: "https://www.wikidata.org/wiki/Q860587",
        },
        {
          "@type": "City",
          name: "Kiambu",
          sameAs: "https://www.wikidata.org/wiki/Q6403752",
        },
        {
          "@type": "City",
          name: "Malindi",
          sameAs: "https://www.wikidata.org/wiki/Q752790",
        },
        {
          "@type": "City",
          name: "Kitale",
          sameAs: "https://www.wikidata.org/wiki/Q1019439",
        },
        {
          "@type": "City",
          name: "Garissa",
          sameAs: "https://www.wikidata.org/wiki/Q848323",
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
      "@id": "https://kenyadesires.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://kenyadesires.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Escorts in Kenya",
          item: "https://kenyadesires.com/escorts",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": "https://kenyadesires.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is KenyaDesires?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KenyaDesires is Kenya's premier escort directory connecting clients with verified, high-quality companions across all major cities and counties in Kenya.",
          },
        },
        {
          "@type": "Question",
          name: "Are the escorts on KenyaDesires verified?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, all escorts featured on KenyaDesires go through a strict verification process to ensure authenticity and quality service across Kenya.",
          },
        },
        {
          "@type": "Question",
          name: "What cities in Kenya does KenyaDesires cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "KenyaDesires covers all major cities and counties including Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Thika, Malindi, Kitale, and many more across Kenya.",
          },
        },
        {
          "@type": "Question",
          name: "How do I book an escort on KenyaDesires?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Browse our verified listings, view real photos and reviews, and contact escorts directly through their preferred contact method listed on their profile.",
          },
        },
        {
          "@type": "Question",
          name: "Is KenyaDesires discreet?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we prioritize client and escort privacy with discreet booking processes and secure communication channels across Kenya.",
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
  name: "KenyaDesires",
  url: "https://kenyadesires.com",
  logo: "https://kenyadesires.com/logo.png",
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+254700000000",
      contactType: "customer service",
      email: "support@kenyadesires.com",
      availableLanguage: ["English", "Swahili"],
      areaServed: "KE",
    },
  ],
  sameAs: [
    "https://twitter.com/kenyadesires",
    "https://www.instagram.com/kenyadesires",
    "https://www.facebook.com/kenyadesires",
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
        <Head>
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

          {/* ✅ Use the dynamic icon - this works on Firebase */}
          <link rel="icon" href="/icon" type="image/png" sizes="36x36" />
          <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
          <link rel="apple-touch-icon" href="/icon" type="image/png" />

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
          <meta name="apple-mobile-web-app-title" content="KenyaDesires" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />

          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
          <meta name="msapplication-config" content="/browserconfig.xml" />

          {/* Additional meta tags */}
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="KenyaDesires" />

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
            title="KenyaDesires - Latest Escorts"
            href="/rss.xml"
          />

          {/* Sitemap */}
          <link
            rel="sitemap"
            type="application/xml"
            title="Sitemap"
            href="/sitemap.xml"
          />
        </Head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased text-white bg-dark-slate min-h-screen flex flex-col`}
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
              alt="KenyaDesires Background"
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
          </header>

          {/* Main Content */}
          <main className="bg-black/80 flex-1 py-4 w-full">
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
