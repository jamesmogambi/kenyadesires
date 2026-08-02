import PassionateMoments from "@/components/blog/PassionateMoments";
import WhyProfile from "@/components/blog/WhyProfile";
import GirlList from "@/components/GirlList";
import GirlRegions from "@/components/GirlRegions";
import NotFoundList from "@/components/NotFoundList";
import YouTargetsAd from "@/components/YouTargetsAd";
import { ITEMS_PER_PAGE } from "@/constants";
import { getEscortsWithCleanedImages } from "@/server-actions/cleaned-escorts.action";
// import { getEscortsWithOnlyCleanedImages } from "@/server-actions/cleaned-escorts.action";

export const dynamic = "force-dynamic";

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

  // Get only 20 escorts with cleaned images - no pagination controls
  const { escorts, total } = await getEscortsWithCleanedImages({
    county: params.county,
    region: params.region,
    practice: params.practice,
    page: 1,
    limit: 20, // Only fetch 20 items
    sortOrder: "asc",
  });

  return (
    <>
      {/* YouTargets Ad - 300x250 medium rectangle */}
      <div className="flex justify-center">
        <YouTargetsAd />
      </div>
      <div className="-mt-12">
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
