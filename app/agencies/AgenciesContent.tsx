import { ClientPaginationWrapper } from "@/components/ClientPaginationWrapper";
import AgencyList from "./AgencyList";
import { IAgency } from "@/types/agency.types";
import { Escort } from "@/server-actions/escort.action";

interface AgenciesContentProps {
  agenciesPromise: Promise<{
    agencies: (IAgency & { escorts?: Escort[] })[];
    total: number;
    totalPages: number;
    page: number;
    hasMore: boolean;
  }>;
  displayTitle: string;
  currentPage: number;
  itemsPerPage: number;
}

export default async function AgenciesContent({
  agenciesPromise,
  displayTitle,
  currentPage,
  itemsPerPage,
}: AgenciesContentProps) {
  try {
    const { agencies, total, totalPages, hasMore } = await agenciesPromise;

    if (!agencies || agencies.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-white/70 text-lg">
            No agencies found matching your filters at this time.
          </p>
        </div>
      );
    }

    return (
      <>
        <AgencyList agencies={[]} title={displayTitle} />
        {hasMore && (
          <div className="mt-8">
            <ClientPaginationWrapper
              totalPages={totalPages}
              currentPage={currentPage}
              totalItems={total}
              itemsPerPage={itemsPerPage}
            />
          </div>
        )}
      </>
    );
  } catch (error) {
    console.error("Error in AgenciesContent:", error);
    return null;
  }
}
