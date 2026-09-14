import React from "react";
import { Metadata } from "next";
import MenuSection from "./MenuSection";
import WhyProfile from "@/components/blog/WhyProfile";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Private room registration for girls",
  description: "Private room registration for girls",
  robots: {
    index: false,
    follow: true,
  },
};

const page = () => {
  return (
    <div className="mb-7">
      <MenuSection />

      {/* <WhyProfile className="my-8" /> */}
    </div>
  );
};

export default page;
