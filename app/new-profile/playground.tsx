// const firebaseConfig = {
//   apiKey: "AIzaSyA0o7jEWajip6xHR0kM73pnuTpMTya6hI0",
//   authDomain: "kenyadivas-ffc51.firebaseapp.com",
//   projectId: "kenyadivas-ffc51",
//   storageBucket: "kenyadivas-ffc51.firebasestorage.app",
//   messagingSenderId: "82992442038",
//   appId: "1:82992442038:web:a5d811fb3fbb5f4c409417",
//   measurementId: "G-D4FJQFF8FS"
// };
//
//

import React from "react";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import GirlProfile from "../GirlProfile";
import { Metadata, ResolvingMetadata } from "next";
import { formatSlugToTitle } from "@/lib/utils";
import { generateEscortStructuredData } from "./utils";
import { getEscortById } from "@/server-actions/escort.action";

interface EscortPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate metadata for the escort profile page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { id } = await params;

  try {
    const result = await getEscortById(id);

    if (!result || !result) {
      return {
        title: "Profile Not Found | KenyaDesires Kenya",
        description:
          "The requested escort profile could not be found. Browse other verified companions on KenyaDesires.",
        robots: {
          index: false,
          follow: true,
        },
      };
    }

    const escort: any = result;
    const displayName = formatSlugToTitle(escort.name || escort.username);
    const location =
      escort.town || escort.workingAreas?.[0]?.countyName || "Kenya";

    // Generate description
    const generateDescription = () => {
      const age = escort.age ? `${escort.age} year old` : "";
      const categories =
        escort.categories?.slice(0, 3).join(", ") || "premium escort";

      if (escort.about) {
        return `${escort.about.substring(0, 160)}... Book ${displayName} for an unforgettable experience in ${location}.`;
      }

      return `${displayName} is a ${age} ${categories} based in ${location}. ${escort.measurements ? `Measurements: ${escort.measurements}. ` : ""}Verified companion on KenyaDesires. Available for incall and outcall services.`;
    };

    // Get primary image
    const primaryImage =
      escort.images?.find((img: any) => img.isPrimary)?.url ||
      escort.previewPhoto ||
      escort.images?.[0]?.url;

    return {
      title: `${displayName} - ${location} | Premium Escort | KenyaDesires`,
      description: generateDescription(),

      keywords: [
        displayName,
        `${displayName} escort`,
        `${location} escorts`,
        "KenyaDesires",
        "Kenya escorts",
        "premium companions",
        "verified escorts",
        ...(escort.categories || []),
        ...(escort.labels || []),
        escort.ethnicity,
        escort.age,
        location,
      ]
        .filter(Boolean)
        .join(", "),

      openGraph: {
        type: "profile",
        title: `${displayName} - Premium Escort in ${location} | KenyaDesires`,
        description: generateDescription().substring(0, 200),
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/girls/${escort.username}`,
        siteName: "KenyaDesires Kenya",
        images: primaryImage
          ? [
              {
                url: primaryImage,
                width: 1200,
                height: 630,
                alt: `${displayName} - ${location} Escort Profile`,
              },
            ]
          : [
              {
                url: `${process.env.NEXT_PUBLIC_SITE_URL}/og-image.jpg`,
                width: 1200,
                height: 630,
                alt: "KenyaDesires - Premium Escorts Kenya",
              },
            ],
        locale: "en_KE",
        countryName: "Kenya",
      },

      twitter: {
        card: primaryImage ? "summary_large_image" : "summary",
        title: `${displayName} - ${location} Escort | KenyaDesires`,
        description: generateDescription().substring(0, 150),
        images: primaryImage ? [primaryImage] : undefined,
        site: "@kenyadivas",
        creator: "@kenyadivas",
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

      alternates: {
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/girls/${escort.username}`,
      },

      category: "Adult Entertainment",

      other: {
        "profile:username": escort.username,
        "profile:gender": "female",
        "profile:age": escort.age?.toString() || "",
        "og:availability": "available",
        "og:price:amount": escort.ratePerHour?.toString() || "",
        "og:price:currency": "KES",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Escort Profile | KenyaDesires Kenya",
      description:
        "View verified escort profile details, photos, and services on KenyaDesires - Kenya's premier escort directory.",
    };
  }
}

const EscortProfilePage = async ({ params }: EscortPageProps) => {
  const { slug } = await params;

  console.log("EscortProfilePage called with slug:", slug);

  const result = await getEscortById(slug);

  if (!result) {
    notFound();
  }

  const escort = result;
  const displayName = formatSlugToTitle(escort.name || escort.username);
  const location = escort.primaryRegion;

  // Generate structured data
  const structuredData = generateEscortStructuredData(escort);

  // Generate breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com"}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Escorts",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com"}/girls`,
      },
      ...(escort.county
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: `${escort.county} Escorts`,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com"}/girls?county=${encodeURIComponent(escort.county)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: escort.county ? 4 : 3,
        name: displayName,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com"}/girls/${escort.username}`,
      },
    ],
  };

  // Generate FAQ structured data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where is ${displayName} located?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${displayName} is based in ${location}. Services available for incall and outcall.`,
        },
      },
      {
        "@type": "Question",
        name: `What services does ${displayName} offer?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: escort.categories?.length
            ? `${displayName} offers: ${escort.categories.join(", ")}. Contact directly for specific services and availability.`
            : `Contact ${displayName} directly for available services and packages.`,
        },
      },
      {
        "@type": "Question",
        name: `How can I book ${displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can book ${displayName} through KenyaDesires by contacting them directly via the contact information provided on their profile.`,
        },
      },
      {
        "@type": "Question",
        name: `Is ${displayName} verified on KenyaDesires?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all escorts on KenyaDesires go through a strict verification process to ensure authenticity and quality service.",
        },
      },
    ],
  };

  return (
    <>
      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />

      {/* Main Content */}
      <div className="w-full lg:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="py-4">
          <BreadcrumbList className="items-center text-lg flex-nowrap overflow-x-auto pb-2 scrollbar-hide">
            <BreadcrumbItem>
              <Link
                className="text-primary font-bold text-lg hover:text-primary/80 bg-transparent  transition-colors whitespace-nowrap"
                href="/"
                aria-label="Home"
              >
                Introduction
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60 ">
              -
            </BreadcrumbSeparator>

            <BreadcrumbItem>
              <Link
                className="text-primary text-lg  hover:text-primary/80 bg-transparent font-bold transition-colors whitespace-nowrap"
                href={`/girls?region=${encodeURIComponent(escort.regions[0])}`}
                aria-label={`${escort.county} Escorts`}
              >
                <span className="text-white font-bold">sex</span>
                {"   "}
                <span className="capitalize">{escort.primaryRegion}</span>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60  lg:text-base">
              -
            </BreadcrumbSeparator>

            <BreadcrumbItem>
              <span
                className="text-white/80 bg-transparent text-lg  font-bold whitespace-nowrap"
                aria-current="page"
              >
                {displayName}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hidden h1 for SEO (visible to search engines but visually hidden) */}
        <h1 className="sr-only">
          {displayName} - Premium Escort in {location} | KenyaDesires Kenya
        </h1>

        {/* Main Profile Component */}
        <GirlProfile girl={escort} />
      </div>
    </>
  );
};

export default EscortProfilePage;
