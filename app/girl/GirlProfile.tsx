import SectionCard from "@/components/SectionCard";
import Link from "next/link";
import React from "react";
import ProfileGallery from "./ProfileGallery";
import BioSection from "./BioSection";
import { formatSlugToTitle, slugify } from "@/lib/utils";
import { Escort } from "@/server-actions/escort.action";

interface Prop {
  className?: string;
  girl: Escort;
  // girl: Girl;
}

const GirlProfile = ({ girl, className }: Prop) => {
  const {
    images,
    name,
    email,
    telephone,
    whatsappPhone,
    openingHours,
    nationality,
    languages,
    availability,
    previewPhoto,
    videos,
    username,
    about,
    age,
  } = girl;

  const allPhotos: string[] = [
    ...(previewPhoto ? [previewPhoto] : []),
    ...(Array.isArray(images) ? images : []),
  ];

  const formatUsername = (username: any) => {
    return username
      .split("_")
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <SectionCard>
      {/* header */}
      <div className="flex gap-y-6 lg:gap-y-0  flex-col lg:flex-row justify-between lg:items-center ">
        <h3 className="text-3xl font-semibold text-primary">
          {name ? formatUsername(name) : formatUsername(username)} ({age} years
          old) {"  "}
          <span className="text-lg text-stone-400/70 font-extralight">
            from{" "}
            <span className="font-bold capitalize">
              {" "}
              {formatSlugToTitle(girl.primaryRegion)}
            </span>
          </span>
        </h3>

        <Link
          className="text-primary lg:text-lg hover:underline gap-2 pb-1.5 flex items-center font-bold "
          href={`/girls?region=${slugify(girl.primaryRegion)}`}
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
        </Link>
      </div>

      {/* body section */}
      <div className="w-full my-5 pt-5 gap-4  flex flex-col lg:flex-row  ">
        {/* section 1 */}
        <div className="  border-green-900  lg:w-[40%]">
          <ProfileGallery videos={[]} photos={allPhotos} />
        </div>
        {/* section 2 */}
        <div className=" p-5 w-full lg:flex-1">
          <BioSection girl={girl} />
        </div>
      </div>
    </SectionCard>
  );
};

export default GirlProfile;
