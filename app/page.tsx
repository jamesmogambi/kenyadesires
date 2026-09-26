import { Metadata } from "next";
import PassionateMoments from "@/components/blog/PassionateMoments";
import WhyProfile from "@/components/blog/WhyProfile";
import GirlList from "@/components/GirlList";
import GirlRegions from "@/components/GirlRegions";
import NotFoundList from "@/components/NotFoundList";
import AboutSection from "@/components/aeo/AboutSection";
import JsonLd from "@/components/seo/JsonLd";
import { ITEMS_PER_PAGE } from "@/constants";
import { getEscortsWithCleanedImages } from "@/server-actions/cleaned-escorts.action";
import type { Escort } from "@/server-actions/escort.action";
import { absoluteUrl } from "@/lib/aeo/entity";
import { NODE_IDS, breadcrumbNode } from "@/lib/aeo/schema";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "KenyaDesires.xyz | Female Escorts & Companions in Kenya",
  description:
    "Browse verified female escort and companion profiles across Kenya. Explore photos, videos, locations and contact details on KenyaDesires.xyz.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
};

interface PageProps {
  searchParams: Promise<{
    county?: string;
    region?: string;
    practice?: string;
    page?: string;
  }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;

  let escorts: Escort[] = [];
  let total = 0;

  try {
    const result = await getEscortsWithCleanedImages({
      county: params.county,
      region: params.region,
      practice: params.practice,
      limit: 20,
      sortOrder: "desc",
    });
    escorts = result.escorts;
    total = result.total;
  } catch (error) {
    console.error("Error loading home page girls:", error);
  }

  return (
    <>
      {/* Homepage graph. No FAQPage here: the questions are visible on
          /frequent-questions, and marking up content that is not on the
          page is a structured-data policy violation. */}
      {/* Page-specific nodes only. The Organization, OfferCatalog, WebSite,
          OnlineBusiness and age-policy nodes are defined once in the root
          layout's site-wide graph and referenced by @id here — redefining
          them per page would emit duplicate definitions of the same @id on
          a single URL. */}
      <JsonLd
        nodes={[
          {
            "@type": "WebPage",
            "@id": `${absoluteUrl("/")}#webpage`,
            url: absoluteUrl("/"),
            name: "KenyaDesires — Female Escorts & Companions in Kenya",
            description:
              "Directory of adult companion and escort profiles in Kenya, with photographs, locations and service categories.",
            isPartOf: { "@id": NODE_IDS.website },
            about: { "@id": NODE_IDS.organization },
            primaryItemOfPage: { "@id": NODE_IDS.website },
            inLanguage: "en-KE",
          },
          breadcrumbNode([{ name: "Home", path: "/" }]),
        ]}
      />

      {/* YouTargets Ad - 300x250 medium rectangle */}
      {/* <div className="flex justify-center">
        <YouTargetsAd />
      </div> */}
      <div className="">
        <GirlRegions />
      </div>
      <div className="">
        {escorts.length > 0 && <GirlList className="" girls={escorts} />}
        {escorts.length === 0 && total === 0 && <NotFoundList />}
      </div>

      <WhyProfile className="mt-20" />
      <PassionateMoments className="mt-8" />

      {/* Factual business description. Placed below the listings so it does
          not push the directory content down, but rendered on the homepage
          itself — an answer engine retrieving `/` gets the entity
          definition without a second request. */}
      <AboutSection className="mt-12" />
    </>
  );
}
