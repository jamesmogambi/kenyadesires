import type {Metadata} from "next";
import {searchEscorts} from "@/server-actions/search.action";
import GirlList from "@/components/GirlList";
import Link from "next/link";
import {ClientPaginationWrapper} from "@/components/ClientPaginationWrapper";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

interface SearchPageProps {
    searchParams: Promise<{
        q?: string;
        page?: string;
        county?: string;
        region?: string;
        gender?: string;
        town?: string;
        practice?: string;
        category?: string;
        nationality?: string;
        minAge?: string;
        maxAge?: string;
        sort?: string;
        order?: string;
    }>;
}

// The whitelist in getValidSortField, plus the defaults the listing uses
const SORT_FIELDS = [
    "createdAt",
    "updatedAt",
    "age",
    "totalViews",
    "rating",
    "totalBookings",
] as const;

type SortField = (typeof SORT_FIELDS)[number];

const toSortField = (value?: string): SortField =>
    SORT_FIELDS.includes(value as SortField) ? (value as SortField) : "createdAt";

const toNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
};

export async function generateMetadata({
                                           searchParams,
                                       }: SearchPageProps): Promise<Metadata> {
    const params = await searchParams;
    const query = params.q || "";

    return {
        title: query
            ? `Search: "${query}" - Escorts in Kenya`
            : "Search Escorts in Kenya",
        description: query
            ? `Search results for "${query}" - Find verified escorts in Kenya`
            : "Search for verified escorts in Kenya by name, location, or service",
        openGraph: {
            title: query
                ? `Search Results for "${query}"`
                : "Search Escorts in Kenya",
            description: query
                ? `Browse search results for "${query}" - Verified escorts with photos and reviews`
                : "Find verified escorts by name, location, or service",
        },
    };
}

export default async function SearchPage({searchParams}: SearchPageProps) {
    const params = await searchParams;
    const {
        q = "",
        page = "1",
        county,
        region,
        gender,
        town,
        practice,
        category,
        nationality,
        minAge,
        maxAge,
        sort,
        order,
    } = params;

    const pageNumber = parseInt(page) || 1;
    const limit = 20;

    // If no search query, show empty state
    // if (!q.trim()) {
    //   return <EmptySearchState />;
    // }

    // Fetch search results
    const result: any = await searchEscorts({
        query: q.trim(),
        page: pageNumber,
        limit,
        sortBy: toSortField(sort),
        sortOrder: order === "asc" ? "asc" : "desc",
        filters: {
            county: county || undefined,
            region: region || undefined,
            gender: gender || undefined,
            town: town || undefined,
            practice: practice || undefined,
            category: category || undefined,
            nationality: nationality || undefined,
            minAge: toNumber(minAge),
            maxAge: toNumber(maxAge),
        },
    });

    // Handle search error
    if (!result.success) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-medium text-center mb-4">Search Error</h1>
                <p className="text-gray-400 mb-8">
                    {result.error || "Failed to fetch search results"}
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    console.log("search results ==>", result.data);

    // const escorts = result.escorts;

    if (result.success && result.data.pagination.total === 0) {
        return (
            <section className="my-8">
                <h3 className="text-center text-2xl text-white font-medium">
                    Search result for : <span className="">&quot;{q}&quot; </span>
                </h3>
                <p className="text-center font-semibold text-lg text-gray-1">
                    No results found
                </p>
            </section>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Search Header */}
            <div className="mb-8">
                <h4 className="text-2xl text-center font-medium md:text-2xl  text-white mb-4">
                    Search Results for: &quot;{q}&quot;
                </h4>
            </div>
            <GirlList girls={result.data.escorts || []}/>
            <ClientPaginationWrapper
                currentPage={result.data.pagination.page}
                itemsPerPage={20}
                totalItems={result.data.pagination.total}
                totalPages={result.data.pagination.totalPages}
            />
        </div>
    );
}
