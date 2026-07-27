// app/config/metadata.ts
import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "Kenya Desires - Hot Kenyan Escorts - KenyaDivas - Sexy Call Girls",
    template: "%s | Kenya Desires",
  },

  description:
    "KenyaDesires is Kenya's premier escort directory. Find 900+ verified, high-class companions in Nairobi, Mombasa, Kisumu, and all major cities. Real photos, honest reviews, and discreet booking.",

  keywords: [
    // Primary brand
    "KenyaDesires",
    "Kenya Desires",
    "kenya desires",

    // Core service
    "Kenya escorts",
    "escorts in Kenya",
    "Kenya call girls",
    "verified escorts Kenya",
    "premium escorts Kenya",
    "high class escorts Kenya",
    "Kenya companion services",
    "Kenya adult entertainment",
    "Kenya escort directory",
    "Nairobi Hot Escorts",

    // Major cities – full list
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

    // Additional
    "Nairobi call girls",
    "escort services Nairobi",
    "Kenya nightlife",
    "Kenya companions",
    "Kenya escort reviews",
    "real escort photos Kenya",
    "verified companion directory",
    "trusted escorts Kenya",
    "best escorts in Kenya",
    "top escort agencies Kenya",
    "independent escorts Kenya",
    "Kenya elite companions",
  ].join(", "),

  authors: [{ name: "KenyaDesires", url: SITE_URL }],

  openGraph: {
    type: "website",
    locale: "en_KE",
    url: SITE_URL,
    siteName: "KenyaDesires - Hot Kenyan Escorts",
    title: "KenyaDesires - Hot Kenyan Escorts - KenyaDivas - Sexy Call Girls",
    description:
      "Discover hot, verified escorts, girls for sex and companions across Kenya. Browse real photos, genuine reviews, and transparent rates. Discreet and secure booking.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KenyaDesires - Hot Kenyan Escorts - KenyaDivas - Sexy Call Girls",
      },
    ],
    emails: ["hello@kenyadesires.com"],
    phoneNumbers: ["+254743129621"],
    countryName: "Kenya",
  },

  twitter: {
    card: "summary_large_image",
    site: "@kenyadesires",
    creator: "@kenyadesires",
    title: "KenyaDesires - Hot Kenyan Escorts - KenyaDivas - Sexy Call Girls",
    description:
      "Kenya's most trusted escort directory. 900+ verified companions in Nairobi, Mombasa, Kisumu & all major cities. Real photos, authentic reviews.",
    images: ["/twitter-image.jpg"],
  },

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

  manifest: "/manifest.json",

  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-KE": SITE_URL,
      "en-US": `${SITE_URL}/en`,
    },
  },

  appleWebApp: {
    capable: true,
    title: "KenyaDesires",
    statusBarStyle: "black-translucent",
  },

  formatDetection: {
    telephone: true,
    date: false,
    address: false,
    email: true,
    url: true,
  },

  other: {
    rating: "RTA-5042-1996-1400-1577-RTA",
    distribution: "global",
    language: "English",
    "revisit-after": "7 days",
    author: "KenyaDesires",
    copyright: `© ${new Date().getFullYear()} KenyaDesires. All rights reserved.`,
    "geo.region": "KE",
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
