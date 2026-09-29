import { Metadata } from "next";
import { useEffect } from "react";
import PassionateMoments from "@/components/blog/PassionateMoments";
import WhyProfile from "@/components/blog/WhyProfile";
import GirlList from "@/components/GirlList";
import GirlRegions from "@/components/GirlRegions";
import NotFoundList from "@/components/NotFoundList";
import YouTargetsAd from "@/components/YouTargetsAd";
import { ITEMS_PER_PAGE } from "@/constants";
import { getEscortsWithCleanedImages } from "@/server-actions/cleaned-escorts.action";
import type { Escort } from "@/server-actions/escort.action";
import { trackViewHomepage } from "@/lib/customer-analytics";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz";

export const metadata: Metadata = {
  title: "KenyaDesires.xyz | Female Escorts & Companions in Kenya",
  description:
    "Browse verified female escort and companion profiles across Kenya. Explore photos, videos, locations and contact details on KenyaDesires.xyz.",
  alternates: {
    canonical: SITE_URL,
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

  useEffect(() => {
    trackViewHomepage();
  }, []);

  return (
    <>
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
    </>
  );
}
