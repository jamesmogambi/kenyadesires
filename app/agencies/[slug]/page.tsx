// app/agencies/[slug]/page.tsx
import { notFound } from "next/navigation";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import Header from "./Header";
import AgencyProfile from "./AgencyDetailCard";
import { IAgency } from "@/types/agency.types";
import { getCachedAgencyBySlug } from "@/server-actions/agency.action";

// ✅ OPTION 1: Force dynamic with ISR
export const dynamic = "force-dynamic";
export const revalidate = 604800; // 7 days in seconds

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ============================================
// GENERATE METADATA
// ============================================
export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;

  try {
    // ✅ Use server action instead of fetch
    const result = await getCachedAgencyBySlug(slug);

    if (!result || !result.success || !result.data) {
      return {
        title: "Agency Not Found | KENYADIVAS",
        description: "The requested agency could not be found.",
        robots: {
          index: false,
          follow: true,
        },
      };
    }

    const agency = result.data;
    const displayName = agency.name;
    const location = agency.region || agency.county || "Kenya";
    const imageUrl =
      agency.coverImage ||
      agency.logo ||
      agency.coverImage ||
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com"}/og-agency.jpg`;

    const buildDescription = () => {
      if (agency.description) {
        return `${agency.description.substring(0, 160)}... Visit ${displayName} for premium adult entertainment services in ${location}.`;
      }
      return `KENYADIVAS - ${displayName} is a verified adult entertainment venue based in ${location}. Professional, discreet, and safe environment. Book your experience today.`;
    };

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";

    return {
      title: `${displayName} - Premium Adult Entertainment in ${location} | KENYADIVAS`,
      description: buildDescription(),
      keywords: [
        displayName,
        `${displayName} adult entertainment`,
        `${location} adult entertainment`,
        `${location} private rooms`,
        "KENYADIVAS",
        "adult entertainment Kenya",
        "verified venues",
      ]
        .filter(Boolean)
        .join(", "),
      openGraph: {
        type: "website",
        locale: "en_KE",
        siteName: "KENYADIVAS",
        title: `${displayName} - Premium Adult Entertainment in ${location}`,
        description: buildDescription(),
        url: `${siteUrl}/agency/${slug}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${displayName} - Adult Entertainment Venue`,
          },
        ],
        countryName: "Kenya",
      },
      twitter: {
        card: "summary_large_image",
        site: "@kenyadivas",
        creator: "@kenyadivas",
        title: `${displayName} - Premium Adult Entertainment in ${location}`,
        description: buildDescription(),
        images: [imageUrl],
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
        canonical: `${siteUrl}/agency/${slug}`,
      },
      category: "Adult Entertainment",
      other: {
        "geo.region": "KE",
        "geo.placename": location,
        classification: "Adult Entertainment",
        "og:price:currency": "KES",
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Agency | KENYADIVAS",
      description:
        "View verified adult entertainment venue details on KENYADIVAS.",
    };
  }
}

// ============================================
// PAGE COMPONENT
// ============================================
const BusinessPage = async ({ params }: PageProps) => {
  const { slug } = await params;

  try {
    // ✅ Use server action instead of fetch
    const result = await getCachedAgencyBySlug(slug);

    if (!result || !result.success || !result.data) {
      return notFound();
    }

    const agency: IAgency = result.data;

    return (
      <div className="w-full lg:max-w-7xl mx-auto p-4 md:p-8 lg:p-12">
        <Header
          county={agency.county}
          region={agency.region}
          name={agency.name}
        />

        <AgencyProfile agency={agency} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching agency:", error);
    return notFound();
  }
};

export default BusinessPage;
