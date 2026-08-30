import Link from "next/link";
import React from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  showBrowseLink?: boolean;
}

const EmptyState = ({
  title = "Nothing here yet",
  description = "This section doesn't have any content at the moment. Check back later or browse our latest posts.",
  showBrowseLink = true,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-10 h-10 text-white/40"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12m-3.75.75h9.75m-9.75 0V19.5m0 2.25h9.75m-9.75 0V19.5m0 2.25H12m3.75-.75V19.5m0 2.25h3.75m-3.75 0V19.5"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-primary mb-3">{title}</h3>
      <p className="text-white/60 text-base max-w-md mb-8 leading-relaxed">
        {description}
      </p>
      {showBrowseLink && (
        <Link
          href="/blog"
          className="text-white uppercase font-bold rounded-md px-8 py-3 bg-primary hover:bg-primary/80 transition text-sm tracking-wide"
        >
          browse all posts
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
