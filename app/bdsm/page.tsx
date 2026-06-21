// ✅ ISR - 7 days
import React from "react";
import BDSMHeader from "./BDSMHeader";
import BDSMFilterInput from "./BDSMFilterInput";
import SectionArticle from "./SectionArticle";
import GirlList from "@/components/GirlList";
import { ClientPaginationWrapper } from "@/components/ClientPaginationWrapper";
import { ITEMS_PER_PAGE } from "@/constants";
import NotFoundList from "@/components/NotFoundList";
import { Metadata, ResolvingMetadata } from "next";
import { generateBDSMStructuredData } from "./seo-utils";
import { generateBreadcrumbList } from "../girls/seo-utils";
import { getCachedBDSMEscorts } from "@/lib/cache";
import { getBDSMEscortCount, getFirstBDSMEscort } from "@/lib/metadata-helper";

export const revalidate = 604800; // 7 days in seconds

interface PageProps {
  searchParams: Promise<{
    county?: string;
    region?: string;
    practice?: string;
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

// Helper function to format BDSM practice types
const formatPracticeType = (type: string): string => {
  if (!type || type === "all") return "";

  const practiceTypes: Record<string, string> = {
    domination: "Domination",
    submission: "Submission",
    bondage: "Bondage",
    discipline: "Discipline",
    sadism: "Sadism",
    masochism: "Masochism",
    "master-slave": "Master/Slave",
    "rope-bondage": "Rope Bondage",
    shibari: "Shibari",
    "impact-play": "Impact Play",
    "sensory-deprivation": "Sensory Deprivation",
    roleplay: "Roleplay",
    kink: "Kink",
    fetish: "Fetish",
  };

  return (
    practiceTypes[type.toLowerCase()] ||
    type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

// ✅ Optimized metadata generation
export async function generateMetadata(
  { searchParams }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const { county, region, practice, page } = params;
  const pageNumber = page ? parseInt(page) : 1;

  // ✅ Fetch lightweight data for metadata only
  const [totalBDSM, firstBDSM] = await Promise.all([
    getBDSMEscortCount({ county, region, practice }),
    getFirstBDSMEscort({ county, region, practice }),
  ]);

  // Format filter values for display
  const formattedCounty = formatLocationName(county);
  const formattedRegion = formatLocationName(region);
  const formattedPractice = formatPracticeType(practice || "");

  // Build dynamic title
  const buildTitle = () => {
    const parts = [];
    if (formattedPractice) {
      parts.push(formattedPractice);
    } else {
      parts.push("BDSM");
    }
    const locationParts = [];
    if (formattedRegion) locationParts.push(formattedRegion);
    if (formattedCounty) locationParts.push(formattedCounty);
    if (locationParts.length > 0) {
      parts.push(`in ${locationParts.join(", ")}`);
    } else {
      parts.push("in Kenya");
    }
    const baseTitle = parts.join(" ");
    const withBrand = `${baseTitle} | KENYADIVAS BDSM`;
    return pageNumber > 1 ? `${withBrand} - Page ${pageNumber}` : withBrand;
  };

  // Build dynamic description
  const buildDescription = () => {
    const practiceText = formattedPractice?.toLowerCase() || "BDSM";
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
    return `KENYADIVAS BDSM - Discover professional ${practiceText} practitioners ${locationPhrase.join(" ")}. Browse ${totalBDSM}+ verified dominatrix, submissive, and kink-friendly escorts. Real photos, authentic reviews, and discreet BDSM experiences.`;
  };

  const title = buildTitle();
  const description = buildDescription();

  // Build canonical URL
  const buildCanonicalUrl = () => {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";
    const params = new URLSearchParams();
    if (county && county !== "all") params.append("county", county);
    if (region && region !== "all") params.append("region", region);
    if (practice && practice !== "all") params.append("practice", practice);
    if (pageNumber > 1) params.append("page", pageNumber.toString());
    const queryString = params.toString();
    return `${baseUrl}/bdsm-escorts${queryString ? `?${queryString}` : ""}`;
  };

  const canonicalUrl = buildCanonicalUrl();

  // Open Graph images
  const ogImages = [];
  if (firstBDSM?.previewPhoto) {
    ogImages.push({
      url: firstBDSM.previewPhoto,
      width: 1200,
      height: 630,
      alt: `${firstBDSM.name || firstBDSM.username} - BDSM Practitioner on KENYADIVAS`,
    });
  }

  ogImages.push({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com"}/og-bdsm.jpg`,
    width: 1200,
    height: 630,
    alt: "KENYADIVAS BDSM - Professional BDSM Services in Kenya",
  });

  const totalPages = Math.ceil(totalBDSM / ITEMS_PER_PAGE);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadivas.com";

  const buildPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    if (county && county !== "all") params.append("county", county);
    if (region && region !== "all") params.append("region", region);
    if (practice && practice !== "all") params.append("practice", practice);
    if (pageNum > 1) params.append("page", pageNum.toString());
    const queryString = params.toString();
    return `${baseUrl}/bdsm-escorts${queryString ? `?${queryString}` : ""}`;
  };

  return {
    title,
    description,
    keywords: [
      "KENYADIVAS BDSM",
      "BDSM Kenya",
      "dominatrix Kenya",
      formattedPractice && `${formattedPractice.toLowerCase()} Kenya`,
      formattedCounty && `${formattedCounty} BDSM`,
      formattedRegion && `${formattedRegion} BDSM`,
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "KENYADIVAS BDSM",
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
    category: "BDSM Services",
    other: {
      "geo.region": "KE",
      "geo.placename": formattedCounty || "Kenya",
      classification: "Adult BDSM Services",
      author: "KENYADIVAS BDSM",
      "og:price:currency": "KES",
      "service:type": practice || "BDSM",
      "bdsm:specialty": formattedPractice || "BDSM",
    },
  };
}

// Generate dynamic title for display
const getDynamicTitle = (params: {
  county?: string;
  region?: string;
  practice?: string;
}): string => {
  const { county, region, practice } = params;
  const practiceText =
    practice && practice !== "all" ? formatPracticeType(practice) : "BDSM";
  const locationParts = [];
  if (region && region !== "all")
    locationParts.push(formatLocationName(region));
  if (county && county !== "all")
    locationParts.push(formatLocationName(county));
  const locationText =
    locationParts.length > 0 ? `in ${locationParts.join(", ")}` : "";
  return `${practiceText} ${locationText}`.trim();
};

const BDSMPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page) : 1;

  const formattedCounty = formatLocationName(params.county);
  const formattedRegion = formatLocationName(params.region);
  const formattedPractice = formatPracticeType(params.practice || "");

  // ✅ Use cached version
  const {
    escorts,
    total,
    totalPages,
    page: currentPageFromResponse,
    hasMore,
  } = await getCachedBDSMEscorts({
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    county: params.county === "all" ? undefined : params.county,
    region: params.region === "all" ? undefined : params.region,
    isActive: true,
  });

  const title = getDynamicTitle({
    county: params.county,
    region: params.region,
    practice: params.practice,
  });

  const structuredData = generateBDSMStructuredData({
    title,
    description: `Professional ${formattedPractice || "BDSM"} services ${formattedCounty ? `in ${formattedCounty}` : "across Kenya"}.`,
    totalItems: total,
    currentPage,
    totalPages: totalPages,
    filters: {
      county: formattedCounty,
      region: formattedRegion,
      practice: formattedPractice,
    },
    items: escorts?.slice(0, 10) || [],
  });

  const breadcrumbData = generateBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "BDSM Escorts", url: "/bdsm-escorts" },
    ...(formattedCounty
      ? [
          {
            name: `${formattedCounty} BDSM`,
            url: `/bdsm-escorts?county=${params.county}`,
          },
        ]
      : []),
    ...(formattedRegion
      ? [
          {
            name: `${formattedRegion} BDSM`,
            url: `/bdsm-escorts?region=${params.region}`,
          },
        ]
      : []),
    ...(formattedPractice
      ? [
          {
            name: formattedPractice,
            url: `/bdsm-escorts?practice=${params.practice}`,
          },
        ]
      : []),
    ...(currentPage > 1
      ? [
          {
            name: `Page ${currentPage}`,
            url: `/bdsm-escorts?page=${currentPage}`,
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
        <h1>{title} | KENYADIVAS BDSM</h1>
        <p>
          Professional BDSM services in Kenya. Find verified dominatrix,
          submissive, and kink-friendly practitioners for safe, consensual
          experiences.
        </p>
      </div>

      <BDSMHeader title={title} subTitle="" />

      <div className="px-4">
        <div className="max-w-2/3 mx-auto">
          <BDSMFilterInput />
        </div>
      </div>

      {total > 0 && <GirlList girls={escorts} />}
      {total === 0 && <NotFoundList />}

      <ClientPaginationWrapper
        totalPages={totalPages}
        currentPage={currentPageFromResponse}
        totalItems={total}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <SectionArticle />
    </>
  );
};

export default BDSMPage;
