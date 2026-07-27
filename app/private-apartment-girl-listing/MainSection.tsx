import SectionCard from "@/components/SectionCard";
import Link from "next/link";
import React from "react";

const MainSection = () => {
  return (
    <SectionCard className="">
      <h3 className="text-3xl font-semibold text-center">
        Private/girl registration
      </h3>

      <div className="flex mt-16 mb-28 gap-10 flex-col lg:flex-row justify-between">
        {/* section one */}
        <div className="flex justify-center flex-col items-center gap-2">
          <h4 className="text-2xl font-semibold">
            You are already logged in to your account.
          </h4>
          <Link
            className="bg-primary p-3 px-8 text-lg font-semibold text-white"
            href="/"
          >
            Go to homepage
          </Link>
        </div>

        {/* section two*/}
        <div className="flex justify-center flex-col items-center gap-2">
          <h4 className="text-2xl font-semibold">
            Profile editing and creating girls
          </h4>
          <Link
            className="bg-primary p-3 px-8 text-lg font-semibold text-white"
            href="/administration"
          >
            Go to profile editing
          </Link>
        </div>
      </div>
    </SectionCard>
  );
};

export default MainSection;
