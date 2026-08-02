// app/agencies/page.tsx
import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SectionArticle from "./SectionArticle";
import AgencyFilterInput from "./AgencyFilterInput";
import AgenciesContent from "./AgenciesContent";
import AgenciesLoadingSkeleton from "./AgenciesLoadingSkeleton";
import { generateBreadcrumbList } from "../girls/seo-utils";
import { Metadata, ResolvingMetadata } from "next";
import {
  getAgencies,
  getAgenciesCountOptimized,
  getFirstAgencyOptimized,
} from "@/server-actions/agency.action";

// ✅ Force dynamic - no caching
export const dynamic = "force-dynamic";

// ============ CONSTANTS ============
const ITEMS_PER_PAGE = 24;
const SITE_NAME = "KenyaDesires";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.com";

// ============ TYPES ============
type Props = {
  searchParams: {
    county?: string;
    region?: string;
    business?: string;
    town?: string;
    verified?: string;
    featured?: string;
    search?: string;
    page?: string;
  };
};

interface FilterParams {
  county?: string;
  region?: string;
  business?: string;
  town?: string;
  verified?: string;
  featured?: string;
  search?: string;
  page?: string;
}

// ============ HELPERS ============

function parsePageNumber(page?: string): number {
  const parsed = page ? parseInt(page) : 1;
  return isNaN(parsed) || parsed < 1 ? 1 : parsed;
}

function formatLocationName(str?: string): string {
  if (!str || str === "all") return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatBusinessType(type?: string): string {
  if (!type || type === "all") return "";

  const businessTypes: Record<string, string> = {
    agency: "Agency",
    private: "Private Room",
    hotel: "Hotel",
    massage: "Massage Parlor",
    sauna: "Sauna",
    club: "Night Club",
    lounge: "Lounge",
  };

  return (
    businessTypes[type.toLowerCase()] ||
    type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function extractFilterParams(
  searchParams: Props["searchParams"],
): FilterParams {
  return {
    county: searchParams.county,
    region: searchParams.region,
    business: searchParams.business,
    town: searchParams.town,
    verified: searchParams.verified,
    featured: searchParams.featured,
    search: searchParams.search,
    page: searchParams.page,
  };
}

function buildTitleParts(params: FilterParams): {
  practice?: string;
  location?: string;
} {
  const locationParts = [];

  if (params.region && params.region !== "all") {
    locationParts.push(formatLocationName(params.region));
  }
  if (params.county && params.county !== "all") {
    locationParts.push(formatLocationName(params.county));
  }

  return {
    practice:
      params.business && params.business !== "all"
        ? formatBusinessType(params.business)
        : undefined,
    location: locationParts.length > 0 ? locationParts.join(", ") : undefined,
  };
}

// ============================================
// GENERATE METADATA
// ============================================
export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // ✅ Await searchParams
  const params = await searchParams;
  const filterParams = extractFilterParams(params);
  const pageNumber = parsePageNumber(filterParams.page);

  // ✅ Fetch lightweight data for metadata only using optimized server actions
  const [totalAgencies, firstAgency] = await Promise.all([
    getAgenciesCountOptimized({
      county: filterParams.county,
      region: filterParams.region,
      business: filterParams.business,
    }),
    getFirstAgencyOptimized({
      county: filterParams.county,
      region: filterParams.region,
      business: filterParams.business,
    }),
  ]);

  const formattedCounty = formatLocationName(filterParams.county);
  const formattedRegion = formatLocationName(filterParams.region);
  const formattedBusiness = formatBusinessType(filterParams.business);

  const buildTitle = () => {
    const parts = [];
    if (formattedBusiness) {
      parts.push(formattedBusiness);
    } else {
      parts.push("Erotic Businesses");
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
    return pageNumber > 1
      ? `${baseTitle} - Page ${pageNumber} | ${SITE_NAME}`
      : `${baseTitle} | ${SITE_NAME}`;
  };

  const buildDescription = () => {
    const businessText = formattedBusiness?.toLowerCase() || "erotic business";
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
    return `KenyaDesires - Find verified ${businessText} venues ${locationPhrase.join(" ")}. Browse ${totalAgencies}+ professional adult entertainment venues with real photos, reviews, and discreet services.`;
  };

  const title = buildTitle();
  const description = buildDescription();
  const canonicalUrl = `${SITE_URL}/agencies`;

  const ogImages = [];
  if (firstAgency?.logo) {
    ogImages.push({
      url: firstAgency.logo,
      width: 1200,
      height: 630,
      alt: `${firstAgency.name} - Agency on KenyaDesires`,
    });
  }

  ogImages.push({
    url: `${SITE_URL}/og-agencies.jpg`,
    width: 1200,
    height: 630,
    alt: "KenyaDesires - Erotic Businesses in Kenya",
  });

  return {
    title,
    description,
    keywords: [
      "KenyaDesires",
      "erotic businesses Kenya",
      formattedBusiness && `${formattedBusiness.toLowerCase()} Kenya`,
      formattedCounty && `${formattedCounty} erotic business`,
      formattedRegion && `${formattedRegion} erotic business`,
      "adult entertainment Kenya",
      "private rooms Kenya",
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: SITE_NAME,
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
    },
    category: "Adult Entertainment",
    other: {
      "geo.region": "KE",
      "geo.placename": formattedCounty || "Kenya",
      classification: "Adult Entertainment",
      author: SITE_NAME,
      "og:price:currency": "KES",
    },
  };
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
const AgenciesPage = async ({ searchParams }: Props) => {
  try {
    // ✅ Await searchParams
    const params = await searchParams;
    const filterParams = extractFilterParams(params);
    const currentPage = parsePageNumber(filterParams.page);

    // ✅ Start the agencies fetch immediately as a promise (enables streaming)
    // Filters are now applied server-side via adminDb + field selection
    const agenciesPromise = getAgencies({
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      county: filterParams.county,
      region: filterParams.region,
      business: filterParams.business,
      verified: filterParams.verified,
      featured: filterParams.featured,
      search: filterParams.search,
    });

    // Build title parts for display
    const { practice, location } = buildTitleParts(filterParams);

    const displayTitleParts = [];
    if (practice) {
      displayTitleParts.push(practice);
    } else {
      displayTitleParts.push("Erotic Businesses");
    }

    if (location) {
      displayTitleParts.push(`in ${location}`);
    } else {
      displayTitleParts.push("in Kenya");
    }

    const displayTitle = displayTitleParts.join(" ");

    return (
      <>
        {/* Hidden SEO elements */}
        <div className="sr-only">
          <h1>
            {displayTitle} | {SITE_NAME}
          </h1>
          <p>
            Find verified erotic businesses and adult entertainment venues
            across Kenya. Discreet, professional, and safe environments.
          </p>
        </div>

        <div className="min-h-screen bg-transparent">
          {/* Header Section — renders immediately, no data needed */}
          <header className="w-full -mt-4 bg-black">
            <div className="container max-w-2/3 mx-auto px-4 py-6">
              <AgencyFilterInput className="border-0" />
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            {/* Breadcrumb Navigation — renders immediately */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <Breadcrumb>
                <BreadcrumbList className="text-white">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href="/"
                        className="text-primary hover:text-primary/80 text-lg font-bold"
                      >
                        Introduction
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-white">
                    -
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href="/agencies"
                        className="text-white hover:text-white/80 text-lg font-bold"
                      >
                        Erotic private rooms
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </nav>

            {/* Agency List — streamed via Suspense while data fetches */}
            <Suspense
              fallback={
                <AgenciesLoadingSkeleton
                  title={displayTitle}
                  itemCount={ITEMS_PER_PAGE}
                />
              }
            >
              <AgenciesContent
                agenciesPromise={agenciesPromise}
                displayTitle={displayTitle}
                currentPage={currentPage}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </Suspense>

            {/* SEO Section — renders immediately */}
            <SectionArticle />
          </main>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error in AgenciesPage:", error);
    return notFound();
  }
};

export default AgenciesPage;
