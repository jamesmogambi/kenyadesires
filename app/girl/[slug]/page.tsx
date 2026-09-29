// app/girl/[slug]/page.tsx
import React, { useEffect } from "react";
import { notFound } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import GirlProfile from "../GirlProfile";
import { Metadata, ResolvingMetadata } from "next";
import { formatSlugToTitle } from "@/lib/utils";
import { generateEscortStructuredData } from "./utils";
import { getEscortByIdentifier } from "@/server-actions/girl.action";
import { trackViewProfile, determineProfileType, handleProfileView } from "@/lib/customer-analytics";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

function normalizeArray(val: any): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val && typeof val === "object" && typeof val.map === "function") return val;
  if (val && typeof val === "object") return Object.values(val).map(String);
  return [];
}
// import { getEscortByIdentifier } from "@/server-actions/get-escorts";


// Generate metadata for the escort profile page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;

  try {
    // ✅ Get escort by identifier (handles ID, slug, or username)
    const result = await getEscortByIdentifier(slug);

    if (!result) {
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

    const escort = result;
    const displayName = formatSlugToTitle(
      escort.name || escort.username || "Escort",
    );
    const location =
      escort.primaryRegion || escort.locations?.[0]?.region || "Kenya";

    // Get cleaned images for metadata
    const getCleanedImages = () => {
      if (escort.cleanedImages && escort.cleanedImages.length > 0) {
        return escort.cleanedImages;
      }

      if (!escort.imagesMetadata) return [];

      const cleanedUrls: string[] = [];
      Object.values(escort.imagesMetadata).forEach((metadata: any) => {
        if (metadata.status === "completed") {
          cleanedUrls.push(metadata.cleanedUrl || metadata.cloudinaryUrl);
        }
      });
      return cleanedUrls;
    };

    const cleanedImages = getCleanedImages();

    // Use cleaned preview photo if available
    const getCleanedPreviewPhoto = () => {
      if (escort.cleanedImages && escort.cleanedImages.length > 0) {
        return escort.cleanedImages[0];
      }

      if (!escort.imagesMetadata || !escort.previewPhoto)
        return escort.previewPhoto;

      const previewMetadata = escort.imagesMetadata[escort.previewPhoto];
      if (previewMetadata?.status === "completed") {
        return (
          previewMetadata?.cleanedUrl ||
          previewMetadata?.cloudinaryUrl ||
          escort.previewPhoto
        );
      }
      return escort.previewPhoto;
    };

    const primaryImage =
      getCleanedPreviewPhoto() ||
      cleanedImages[0] ||
      escort.previewPhoto ||
      escort.images?.[0];

    const priceAmount =
      (
        (escort as any).ratePerHour ??
        (escort as any).pricePerHour ??
        (escort as any).hourlyRate
      )?.toString() || "";

    // Generate description
    const generateDescription = () => {
      const age = escort.age ? `${escort.age} year old` : "";
      const categories =
        normalizeArray(escort.categories).slice(0, 3).join(", ") || "Sexy Call girl";

      if (escort.about) {
        return `${escort.about.substring(0, 160)}... Book ${displayName} for an unforgettable experience in ${location}.`;
      }

      return `${displayName} is a ${age} ${categories} based in ${location}. Verified companion on KenyaDesires. Available for incall and outcall services.`;
    };

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
        ...(normalizeArray(escort.categories)),
        ...(normalizeArray(escort.labels)),
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
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/girl/${escort.id || slug}`,
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
        site: "@kenyadesires",
        creator: "@kenyadesires",
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
        canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/girl/${escort.id || slug}`,
      },

      category: "Adult Entertainment",

      other: {
        "profile:username": escort.username,
        "profile:gender": "female",
        "profile:age": escort.age?.toString() || "",
        "og:availability": "available",
        "og:price:amount": (escort as any).ratePerHour?.toString() || "",
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

interface EscortPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const EscortProfilePage = async ({ params }: EscortPageProps) => {
  const { slug } = await params;

  // ✅ Validate slug
  if (!slug || slug.trim() === "") {
    notFound();
  }

  // ✅ Get escort by identifier (handles ID, slug, or username)
  const result = await getEscortByIdentifier(slug);

  if (!result) {
    notFound();
  }

  const escort = result;
  const displayName = formatSlugToTitle(
    escort.name || escort.username || "Escort",
  );
  const location =
    escort.primaryRegion || escort.locations?.[0]?.region || "Kenya";
  const locationSlug = escort.primaryRegion || escort.county || "kenya";

  // Track profile view with proper profile_type detection
  useEffect(() => {
    const profileType = determineProfileType(escort);
    handleProfileView(escort.id || slug, profileType, location, locationSlug);
  }, [escort.id, slug, escort.isAgencyOwned, escort.agencyId, location, locationSlug]);

  // Helper to get cleaned images
  const getCleanedImages = () => {
    if (escort.cleanedImages && escort.cleanedImages.length > 0) {
      return escort.cleanedImages;
    }

    if (!escort.imagesMetadata) return [];

    const cleanedUrls: string[] = [];
    Object.values(escort.imagesMetadata).forEach((metadata: any) => {
      if (metadata.status === "completed" && metadata.cleanedUrl) {
        cleanedUrls.push(metadata.cleanedUrl);
      }
    });
    return cleanedUrls;
  };

  const cleanedImages = getCleanedImages();
  const hasCleanedImages = cleanedImages.length > 0;

  // Generate structured data with cleaned images
  const structuredData = generateEscortStructuredData({
    ...escort,
    images: hasCleanedImages ? cleanedImages : escort.images,
  });

  // Generate breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Escorts",
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"}/girls`,
      },
      ...(escort.primaryRegion
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: `${escort.county || escort.primaryRegion} Escorts`,
              item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"}/girls?region=${encodeURIComponent(escort.primaryRegion)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: escort.primaryRegion ? 4 : 3,
        name: displayName,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"}/girl/${escort.id || slug}`,
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
          text: normalizeArray(escort.categories).length
            ? `${displayName} offers: ${normalizeArray(escort.categories).join(", ")}. Contact directly for specific services and availability.`
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

  // Get the identifier for display (use ID if available, otherwise use the slug)
  const profileIdentifier = escort.id || slug;

  // console.log("escort ==> ", escort);

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
                className="text-primary font-bold text-lg hover:text-primary/80 bg-transparent transition-colors whitespace-nowrap"
                href="/"
                aria-label="Home"
              >
                Introduction
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60">
              -
            </BreadcrumbSeparator>

            <BreadcrumbItem>
              <Link
                className="text-primary text-lg hover:text-primary/80 bg-transparent font-bold transition-colors whitespace-nowrap"
                href={`/girls?region=${encodeURIComponent(escort.primaryRegion || "")}`}
                aria-label={`${escort.county || escort.primaryRegion} Escorts`}
              >
                <span className="text-white font-bold">sex</span>
                {"   "}
                <span className="capitalize">
                  {escort.primaryRegion || "Kenya"}
                </span>
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-white/60 lg:text-base">
              -
            </BreadcrumbSeparator>

            <BreadcrumbItem>
              <span
                className="text-white/80 bg-transparent text-lg font-bold whitespace-nowrap"
                aria-current="page"
              >
                {displayName}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Hidden h1 for SEO */}
        <h1 className="sr-only">
          {displayName} - Sexy Hot Escort in {location} | KenyaDesires Kenya
        </h1>

        {/* TODO: add verification badge in future */}
        {/* Cleaned Images Badge */}
        {/* {hasCleanedImages && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/20 text-green-300 px-4 py-2 rounded-lg border border-green-500/30">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium">
              This escort has {cleanedImages.length} verified cleaned images
            </span>
          </div>
        )} */}

        {/* Main Profile Component */}
        <GirlProfile girl={escort} />
      </div>
    </>
  );
};

export default EscortProfilePage;
