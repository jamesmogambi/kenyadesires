import PassionateMoments from "@/components/blog/PassionateMoments";
import WhyProfile from "@/components/blog/WhyProfile";
import { ClientPaginationWrapper } from "@/components/ClientPaginationWrapper";
import GirlList from "@/components/GirlList";
import GirlRegions from "@/components/GirlRegions";
import NotFoundList from "@/components/NotFoundList";
import { ITEMS_PER_PAGE } from "@/constants";
import { getCachedEscorts } from "@/lib/cache";

// ✅ ISR - Revalidate every 7 days (data doesn't change frequently)
export const revalidate = 604800; // 7 days in seconds

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

  const {
    escorts,
    total,
    totalPages,
    page: currentPage,
    hasMore,
  } = await getCachedEscorts({
    county: params.county,
    region: params.region,
    practice: params.practice,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: ITEMS_PER_PAGE,
  });

  // If no escorts found and it's the first page, show not found
  // if (escorts.length === 0 && currentPage === 1) {
  //   notFound();
  // }

  // console.log("escorts", escorts);

  return (
    <>
      <GirlRegions />
      {escorts.length > 0 && <GirlList girls={escorts} />}

      {escorts.length === 0 && total === 0 && <NotFoundList />}
      <ClientPaginationWrapper
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={total}
        itemsPerPage={ITEMS_PER_PAGE}
      />
      <WhyProfile className="mt-20" />
      <PassionateMoments className="mt-8" />
    </>
  );
}
