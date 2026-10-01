// Separate client component for the button
// components/blog/ShowMoreButton.tsx
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ShowMoreButtonProps {
  nextPage: number;
  totalPosts: number;
  currentCount: number;
}

export function ShowMoreButton({
  nextPage,
  totalPosts,
  currentCount,
}: ShowMoreButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const activePage = searchParams.get("page") ?? "1";

  // The navigation swaps in a new server-rendered page, but this component
  // instance is reconciled rather than remounted. Without clearing the flag on
  // the new `page` param the button stays stuck on "Loading..." forever.
  useEffect(() => {
    setLoading(false);
  }, [activePage]);

  const handleClick = () => {
    setLoading(true);
    // Update URL with next page parameter
    router.push(`/blog?page=${nextPage}`, { scroll: false });
    // The page will reload with new data
  };

  return (
    <div className="text-center">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-8 py-3 bg-red-400 text-white font-semibold rounded-lg hover:bg-red-800 active:scale-95 transition-all disabled:opacity-70"
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            Loading...
          </>
        ) : (
          <>
            Show More Posts
            <span className="text-sm opacity-80">
              ({currentCount} of {totalPosts})
            </span>
          </>
        )}
      </button>
    </div>
  );
}
