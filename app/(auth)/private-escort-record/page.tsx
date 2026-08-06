import React from "react";
import { Metadata } from "next";
import MenuSection from "./MenuSection";
import WhyProfile from "@/components/blog/WhyProfile";

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
