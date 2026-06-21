import { AppPagination } from "@/components/AppPagination";
import { ClientPaginationWrapper } from "@/components/ClientPaginationWrapper";
import FilterInput from "@/components/FilterInput";
import GirlList from "@/components/GirlList";
import ListHeader from "@/components/ListHeader";
import React from "react";
import SectionArticle from "./SectionArticle";
import MassageTypeFilterInput from "./MassageFilterInput";
import { ITEMS_PER_PAGE } from "@/constants";
import NotFoundList from "@/components/NotFoundList";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { generateMassageStructuredData } from "./seo-utils";
import { generateBreadcrumbList } from "../girls/seo-utils";
import { getCachedMassageEscorts } from "@/lib/cache";
import {
  getMassageEscortCount,
  getFirstMassageEscort,
} from "@/lib/metadata-helper";

export const revalidate = 604800; // 7 days in seconds

interface PageProps {
  searchParams: Promise<{
    county?: string;
    region?: string;
    massageType?: string;
    page?: string;
  }>;
}

// Helper function to format location names
const formatLocationName = (str?: string): string => {
  if (!str || str === "all") return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Helper function to format massage type names
const formatMassageType = (type?: string): string => {
  if (!type || type === "all") return "";

  const massageTypes: Record<string, string> = {
    erotic: "Erotic",
    tantric: "Tantric",
    nuru: "Nuru",
    lingam: "Lingam",
    yoni: "Yoni",
    "body-to-body": "Body to Body",
    sensual: "Sensual",
    therapeutic: "Therapeutic",
    "four-hands": "Four Hands",
    b2b: "B2B",
  };

  return (
    massageTypes[type.toLowerCase()] ||
    type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

// ✅ OPTIMIZED: Generate dynamic metadata using lightweight helpers
export async function generateMetadata(
  { searchParams }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const { county, region, massageType, page } = params;
  const pageNumber = page ? parseInt(page) : 1;

  // ✅ Fetch lightweight data for metadata only (not the full list)
  const [totalMasseuses, firstMasseuse] = await Promise.all([
    getMassageEscortCount({ county, region, massageType }),
    getFirstMassageEscort({ county, region, massageType }),
  ]);

  // Format filter values for display
  const formattedCounty = formatLocationName(county || "");
  const formattedRegion = formatLocationName(region || "");
  const formattedMassageType = formatMassageType(massageType || "");

  // Build dynamic title
  const buildTitle = () => {
    const parts = [];

    if (formattedMassageType) {
      parts.push(formattedMassageType);
    } else {
      parts.push("Erotic");
    }

    parts.push("Massage");

    if (formattedRegion) {
      parts.push(formattedRegion);
    }

    if (formattedCounty) {
      parts.push(formattedCounty);
    }

    const baseTitle = parts.join(" ");
    const locationSuffix =
      formattedCounty || formattedRegion ? "" : " in Kenya";

    return pageNumber > 1
      ? `${baseTitle}${locationSuffix} - Page ${pageNumber} | KENYADIVAS Massage`
      : `${baseTitle}${locationSuffix} | KENYADIVAS Massage`;
  };

  // Build dynamic description
  const buildDescription = () => {
    const massageWord = formattedMassageType?.toLowerCase() || "erotic";
    const locationPhrase = [];

    if (formattedCounty && formattedRegion) {
      locationPhrase.push(`in ${formattedRegion}, ${formattedCounty}`);
    } else if (formattedCounty) {
      locationPhrase.push(`in ${formattedCounty} County`);
    } else if (formattedRegion) {
      locationPhrase.push(`in ${formattedRegion}`);
    } else {
      locationPhrase.push("across Kenya");
    }

    return `KENYADIVAS Massage - Find professional ${massageWord} massage therapists ${locationPhrase.join(" ")}. Browse ${totalMasseuses}+ verified masseuses offering sensual, tantric, nuru, and erotic massage services. Real photos, authentic reviews, and discreet booking.`;
  };

  // Build comprehensive keywords
  const buildKeywords = () => {
    const keywords = new Set<string>([
      "KENYADIVAS Massage",
      "erotic massage Kenya",
      "sensual massage",
      "tantric massage",
      "nuru massage",
      "lingam massage",
      "yoni massage",
      "body to body massage",
      "massage therapists Kenya",
      "masseuses Kenya",
      "Nairobi massage",
      "Mombasa massage",
      "Kisumu massage",
      "adult massage",
      "relaxation massage",
      "couples massage",
      "wellness massage",
      "spa services Kenya",
      "therapeutic massage",
    ]);

    if (formattedMassageType) {
      keywords.add(`${formattedMassageType.toLowerCase()} massage Kenya`);
      keywords.add(`${formattedMassageType.toLowerCase()} therapists`);
    }

    if (formattedCounty) {
      keywords.add(`${formattedCounty} massage`);
      keywords.add(`massage in ${formattedCounty}`);
      keywords.add(`${formattedCounty} masseuses`);
    }

    if (formattedRegion) {
      keywords.add(`${formattedRegion} massage`);
      keywords.add(`massage in ${formattedRegion}`);
    }

    // Add unique locations from actual masseuses (if available)
    if (firstMasseuse?.name) {
      keywords.add(`${firstMasseuse.name} massage`);
    }

    return Array.from(keywords).join(", ");
  };

  // Build canonical URL
  const buildCanonicalUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";
    const params = new URLSearchParams();

    if (county && county !== "all") params.append("county", county);
    if (region && region !== "all") params.append("region", region);
    if (massageType && massageType !== "all")
      params.append("massageType", massageType);

    if (pageNumber > 1) params.append("page", pageNumber.toString());

    const queryString = params.toString();
    return `${baseUrl}/massage-escorts${queryString ? `?${queryString}` : ""}`;
  };

  const title = buildTitle();
  const description = buildDescription();
  const keywords = buildKeywords();
  const canonicalUrl = buildCanonicalUrl();

  // Open Graph images
  const ogImages = [];
  if (firstMasseuse?.previewPhoto) {
    ogImages.push({
      url: firstMasseuse.previewPhoto,
      width: 1200,
      height: 630,
      alt: `${firstMasseuse.name || firstMasseuse.username} - Massage Therapist on KENYADIVAS`,
    });
  }

  ogImages.push({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com"}/og-massage.jpg`,
    width: 1200,
    height: 630,
    alt: "KENYADIVAS Massage - Professional Massage Therapists in Kenya",
  });

  const totalPages = Math.ceil(totalMasseuses / ITEMS_PER_PAGE);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (county && county !== "all") params.append("county", county);
    if (region && region !== "all") params.append("region", region);
    if (massageType && massageType !== "all")
      params.append("massageType", massageType);
    if (pageNum > 1) params.append("page", pageNum.toString());
    const queryString = params.toString();
    return `${baseUrl}/massage-escorts${queryString ? `?${queryString}` : ""}`;
  };

  return {
    title,
    description,
    keywords,
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "KENYADIVAS Massage",
      title,
      description,
      url: canonicalUrl,
      images: ogImages,
      countryName: "Kenya",
    },
    twitter: {
      card: "summary_large_image",
      site: "@kenyadivas",
      creator: "@kenyadivas",
      title,
      description,
      images: ogImages.map((img) => img.url),
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
      canonical: canonicalUrl,
      ...(pageNumber > 1 && { prev: buildPageUrl(pageNumber - 1) }),
      ...(pageNumber < totalPages && { next: buildPageUrl(pageNumber + 1) }),
    },
    ...(pageNumber > 1 && { title: `${title} - Page ${pageNumber}` }),
    category: "Massage Services",
    other: {
      "geo.region": "KE",
      "geo.placename": formattedCounty || "Kenya",
      classification: "Adult Massage Services",
      author: "KENYADIVAS Massage",
      "og:price:currency": "KES",
      "service:type": massageType || "erotic massage",
    },
  };
}

/**
 * Generate h1 title for the page (displayed in ListHeader)
 */
const generateListHeaderTitle = (params: {
  county?: string;
  region?: string;
  massageType?: string;
}): string => {
  const { county, region, massageType } = params;

  const locationParts = [];
  if (region) locationParts.push(formatLocationName(region));
  if (county) locationParts.push(`${formatLocationName(county)} County`);
  const locationText =
    locationParts.length > 0 ? `in ${locationParts.join(", ")}` : "";

  let massageText = "";
  if (massageType) {
    const formatted = formatMassageType(massageType);
    massageText = formatted.toLowerCase().includes("massage")
      ? formatted
      : `${formatted} Massage`;
  } else {
    massageText = "Erotic Massage";
  }

  return `${massageText} ${locationText}`.trim();
};

const MassageEscortsPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page) : 1;

  const formattedCounty = formatLocationName(params.county);
  const formattedRegion = formatLocationName(params.region);
  const formattedMassageType = formatMassageType(params.massageType || "");

  // ✅ Use cached version (already optimized)
  const {
    escorts,
    total,
    totalPages,
    page: currentPageFromResponse,
    hasMore,
  } = await getCachedMassageEscorts({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    county: params.county,
    region: params.region,
    isActive: true,
  });

  const listHeaderTitle = generateListHeaderTitle({
    county: params.county,
    region: params.region,
    massageType: params.massageType,
  });

  const structuredData = generateMassageStructuredData({
    title: listHeaderTitle,
    description: `Find professional ${formattedMassageType || "erotic"} massage therapists ${formattedCounty ? `in ${formattedCounty}` : "across Kenya"}.`,
    totalItems: total,
    currentPage,
    totalPages: totalPages,
    filters: {
      county: formattedCounty,
      region: formattedRegion,
      massageType: formattedMassageType,
    },
    items: escorts?.slice(0, 10) || [],
  });

  const breadcrumbData = generateBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "Massage Escorts", url: "/massage-escorts" },
    ...(formattedCounty
      ? [
          {
            name: `${formattedCounty} Massage`,
            url: `/massage-escorts?county=${params.county}`,
          },
        ]
      : []),
    ...(formattedRegion
      ? [
          {
            name: `${formattedRegion} Massage`,
            url: `/massage-escorts?region=${params.region}`,
          },
        ]
      : []),
    ...(formattedMassageType
      ? [
          {
            name: `${formattedMassageType} Massage`,
            url: `/massage-escorts?massageType=${params.massageType}`,
          },
        ]
      : []),
    ...(currentPage > 1
      ? [
          {
            name: `Page ${currentPage}`,
            url: `/massage-escorts?page=${currentPage}`,
          },
        ]
      : []),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="sr-only">
        <h1>{listHeaderTitle} | KENYADIVAS Massage</h1>
        <p>
          Professional massage therapy services across Kenya. Find verified
          masseuses offering {formattedMassageType || "erotic"}, tantric, and
          sensual massage experiences.
        </p>
      </div>

      <div className="bg-black p-5 pb-6 -mt-4.5">
        <div className="max-w-2/3 mx-auto">
          <MassageTypeFilterInput />
        </div>
      </div>

      <ListHeader
        title={listHeaderTitle}
        subTitle={
          params.massageType
            ? `${formattedMassageType} specialists`
            : "Erotic massages"
        }
      />

      {total === 0 && <NotFoundList />}
      {total > 0 && <GirlList girls={escorts as any} />}

      <ClientPaginationWrapper
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={total}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <SectionArticle />
    </>
  );
};

export default MassageEscortsPage;
