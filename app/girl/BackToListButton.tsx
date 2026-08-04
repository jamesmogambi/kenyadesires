"use client";
import { useRouter } from "next/navigation";
import React from "react";

interface BackToListButtonProps {
  fallbackHref?: string;
}

const BackToListButton = ({ fallbackHref = "/girls" }: BackToListButtonProps) => {
  const router = useRouter();

  const handleBack = () => {
    // If the user navigated from another page (browser history exists), go back
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      // Fallback: user arrived via direct URL, go to girls listing
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="text-primary lg:text-lg hover:underline gap-2 pb-1.5 flex items-center font-bold"
    >
      back to list of girls
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M16.72 7.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06l2.47-2.47H3a.75.75 0 0 1 0-1.5h16.19l-2.47-2.47a.75.75 0 0 1 0-1.06Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export default BackToListButton;
