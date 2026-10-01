import React from "react";
import GirlFilterInput from "./GirlFIlterInput";
import ListHeader from "@/components/ListHeader";
import GirlList from "@/components/GirlList";
import { ClientPaginationWrapper } from "@/components/ClientPaginationWrapper";
import SectionArticle from "./SectionArticle";
import { Metadata, ResolvingMetadata } from "next";
import NotFoundList from "@/components/NotFoundList";
import {
  generateBreadcrumbList,
  generateListStructuredData,
} from "./seo-utils";
import {
  getEscortCountForMetadata,
  getFirstEscortForMetadata,
} from "@/lib/metadata-helper";
import { getEscortsWithCleanedImages } from "@/server-actions/cleaned-escorts.action";
import type { Escort } from "@/server-actions/escort.action";
import LocationTracker from "@/components/analytics/LocationTracker";
import { buildListingHref } from "@/lib/utils";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// ✅ No caching - always fresh (server actions are also uncached)

interface PageProps {
  searchParams: Promise<{
    county?: string;
    region?: string;
    practice?: string;
    sort?: string;
    order?: string;
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 24;

const defaultTitle = "Sexy Call girls in Kenya";
const defaultDescription =
  "KenyaDesires - Kenya's premier escort directory. Browse verified Sexy Call girls in Nairobi, Mombasa, Kisumu and across Kenya. Real photos, authentic reviews, and transparent rates.";

const formatLocationName = (str: string): string => {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// ✅ Optimized metadata generation
export async function generateMetadata(
  { searchParams }: PageProps,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const params = await searchParams;
  const { county, region, practice, sort, order, page } = params;
  const pageNumber = page ? parseInt(page) : 1;

  // ✅ Fetch lightweight data for metadata only
  const [totalEscorts, firstEscort] = await Promise.all([
    getEscortCountForMetadata({ county, region, practice }).catch(() => 0),
    getFirstEscortForMetadata({ county, region, practice }).catch(() => null),
  ]);

  const formattedCounty =
    county && county !== "all" ? formatLocationName(county) : null;
  const formattedRegion =
    region && region !== "all" ? formatLocationName(region) : null;
  const formattedPractice =
    practice && practice !== "all" ? formatLocationName(practice) : null;

  const buildTitle = () => {
    const parts = [];
    if (formattedPractice) parts.push(formattedPractice);
    if (formattedRegion) parts.push(formattedRegion);
    if (formattedCounty) parts.push(formattedCounty);

    if (parts.length === 0) return `Sexy Call girls in Kenya | KenyaDesires`;

    const baseTitle = `${parts.join(" ")} Escorts in Kenya`;
    return pageNumber > 1
      ? `${baseTitle} - Page ${pageNumber} | KenyaDesires`
      : `${baseTitle} | KenyaDesires`;
  };

  const buildDescription = () => {
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

    const servicePhrase = formattedPractice
      ? `Find verified ${formattedPractice.toLowerCase()} escorts ${locationPhrase.join(" ")}.`
      : `Discover Sexy Call girls services ${locationPhrase.join(" ")}.`;

    return `KenyaDesires - ${servicePhrase} Browse ${totalEscorts}+ verified profiles with real photos, authentic reviews, rates, and discreet contact information.`;
  };

  const title = buildTitle();
  const description = buildDescription();

  // Build canonical URL with query parameters.
  // Filter values are slugified so every equivalent URL — the legacy raw form
  // (`?practice=Tantric body-to-body massage`) and the slug — canonicalises to one
  // address instead of splitting crawl budget across duplicates.
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";
  const canonicalPath = buildListingHref("/girls", { county, region, practice });
  const canonicalParams = new URLSearchParams(
    canonicalPath.includes("?") ? canonicalPath.split("?")[1] : "",
  );
  if (sort) canonicalParams.set("sort", sort);
  if (order) canonicalParams.set("order", order);
  if (pageNumber > 1) canonicalParams.set("page", pageNumber.toString());

  const canonicalQuery = canonicalParams.toString();
  const canonicalUrl = `${baseUrl}${canonicalPath.split("?")[0]}${canonicalQuery ? `?${canonicalQuery}` : ""}`;

  return {
    title,
    description,
    keywords: [
      "KenyaDesires",
      "Kenya escorts",
      "Sexy Call girls in Kenya",
      formattedCounty && `${formattedCounty} escorts`,
      formattedRegion && `${formattedRegion} escorts`,
      formattedPractice && `${formattedPractice} escorts`,
    ]
      .filter(Boolean)
      .join(", "),
    openGraph: {
      type: "website",
      locale: "en_KE",
      siteName: "KenyaDesires Kenya",
      title,
      description,
      url: canonicalUrl,
      images: [
        {
          url:
            firstEscort?.previewPhoto ||
            `${process.env.NEXT_PUBLIC_SITE_URL}/og-girls.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      countryName: "Kenya",
    },
    twitter: {
      card: "summary_large_image",
      site: "@kenyadivas",
      creator: "@kenyadivas",
      title,
      description,
      images: [
        firstEscort?.previewPhoto ||
          `${process.env.NEXT_PUBLIC_SITE_URL}/og-girls.jpg`,
      ],
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
    other: {
      "geo.region": "KE",
      "geo.placename": formattedCounty || "Kenya",
      classification: "Adult Entertainment",
      author: "KenyaDesires",
      "og:price:currency": "KES",
    },
  };
}

const GirlsListingPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = params.page ? parseInt(params.page, 10) : 1;

  const formattedCounty =
    params.county && params.county !== "all"
      ? formatLocationName(params.county)
      : null;
  const formattedRegion =
    params.region && params.region !== "all"
      ? formatLocationName(params.region)
      : null;
  const formattedPractice =
    params.practice && params.practice !== "all"
      ? formatLocationName(params.practice)
      : null;

  const getDynamicTitle = () => {
    const parts = [];
    if (formattedPractice) parts.push(formattedPractice);
    if (formattedRegion) parts.push(formattedRegion);
    if (formattedCounty) parts.push(formattedCounty);
    return parts.length === 0
      ? "Sexy Call girls in Kenya"
      : `${parts.join(" ")} Escorts in Kenya`;
  };

  const title = getDynamicTitle();

  const location = formattedRegion || formattedCounty || "Kenya";
  const locationSlug = params.region || params.county || "kenya";

  let escorts: Escort[] = [];
  let total = 0;
  let totalPages = 0;
  let currentPageFromResponse = 1;
  let hasMore = false;

  try {
    const result = await getEscortsWithCleanedImages({
      county: params.county,
      region: params.region,
      practice: params.practice,
      sortBy: params.sort as
        | "createdAt"
        | "updatedAt"
        | "age"
        | "totalViews"
        | "rating"
        | "totalBookings"
        | undefined,
      // sortOrder: params.order as "desc" | "asc" | undefined,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      isActive: true,
      sortOrder: "asc",
    });
    escorts = result.escorts;
    total = result.total;
    totalPages = result.totalPages;
    currentPageFromResponse = result.page;
    hasMore = result.hasMore;
  } catch (error) {
    console.error("Error loading girls listing:", error);
  }

  const structuredData = generateListStructuredData({
    title,
    description: defaultDescription,
    totalItems: total,
    currentPage,
    totalPages,
    filters: {
      county: formattedCounty,
      region: formattedRegion,
      practice: formattedPractice,
    },
    items: escorts.slice(0, 10),
  });

  const breadcrumbData = generateBreadcrumbList([
    { name: "Home", url: "/" },
    { name: "Escorts", url: "/girls" },
    ...(formattedCounty
      ? [
          {
            name: `${formattedCounty} Escorts`,
            url: buildListingHref("/girls", { county: params.county }),
          },
        ]
      : []),
    ...(formattedRegion
      ? [
          {
            name: `${formattedRegion} Escorts`,
            url: buildListingHref("/girls", { region: params.region }),
          },
        ]
      : []),
    ...(formattedPractice
      ? [
          {
            name: `${formattedPractice} Escorts`,
            url: buildListingHref("/girls", { practice: params.practice }),
          },
        ]
      : []),
    ...(currentPage > 1
      ? [{ name: `Page ${currentPage}`, url: `/girls?page=${currentPage}` }]
      : []),
  ]);

  return (
    <>
      <LocationTracker
        location={location}
        locationSlug={locationSlug}
        profileType="provider"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="sr-only">
        <h1>{title} | KenyaDesires Kenya</h1>
        <p>{defaultDescription}</p>
      </div>

      <div className="bg-black p-5 pb-6 -mt-4.5">
        <div className="max-w-2/3 mx-auto">
          <GirlFilterInput />
        </div>
      </div>

      <ListHeader title={title} subTitle="Girls for Sex" />

      {total > 0 && (
        <>
          <GirlList girls={escorts} />
          <ClientPaginationWrapper
            totalPages={totalPages}
            currentPage={currentPageFromResponse}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}

      {total === 0 && (
        <NotFoundList county={params.county} />
      )}

      <SectionArticle />
    </>
  );
};

export default GirlsListingPage;
