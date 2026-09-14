import SectionCard from "@/components/SectionCard";
import React from "react";
import MainSection from "./MainSection";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

const page = () => {
  return (
    <div className="min-h-screens">
      <MainSection />
    </div>
  );
};

export default page;
