import React from "react";
import SectionCard from "./SectionCard";
import Link from "next/link";
import Image from "next/image";
import GirlFilterInput from "@/app/girls/GirlFIlterInput";
import { getCachedPopularCounties } from "@/lib/cache";
import { buildListingHref } from "@/lib/utils";

const GirlRegions = async () => {
  // ✅ Use cached version
  const {
    data: popularCounties,
    success,
    error,
  } = await getCachedPopularCounties(16);

  return (
    <div className="">
      <SectionCard className="">
        <h4 className="text-center text-3xl font-bold text-white ">
          Find a<span className="text-primary"> girl to have sex</span> with in
          your county
        </h4>

        <div className="flex items-center mt-5 mb-3 justify-center">
          <Image
            src={"/separator.png"}
            alt="separator"
            priority
            width={60}
            height={20}
            style={{ width: "auto", height: "auto" }}
          />
        </div>

        {/* Render most popular counties */}
        <div className="md:flex hidden gap-2 gap-y-2 mb-4 flex-wrap">
          {popularCounties?.slice(0, 16).map((county) => (
            <Link
              key={county.code}
              className="text-primary uppercase font-bold text-base bg-gray-1/35 rounded-md p-1.5 px-5"
              href={buildListingHref("/girls", { county: county?.name })}
            >
              sex {county.name}
            </Link>
          ))}
        </div>

        <GirlFilterInput />
      </SectionCard>
    </div>
  );
};

export default GirlRegions;
