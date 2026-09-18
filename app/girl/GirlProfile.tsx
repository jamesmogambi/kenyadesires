import SectionCard from "@/components/SectionCard";
import React from "react";
import ProfileGallery from "./ProfileGallery";
import BioSection from "./BioSection";
import BackToListButton from "./BackToListButton";
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
    cleanedImages,
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
    ...(Array.isArray(cleanedImages) && cleanedImages.length > 0 ? cleanedImages : []),
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
              {formatSlugToTitle(girl.county)}
            </span>
          </span>
        </h3>

        <BackToListButton
          fallbackHref={`/girls?region=${slugify(girl.primaryRegion)}`}
        />
      </div>

      {/* body section */}
      <div className="w-full my-5 pt-5 gap-4  flex flex-col lg:flex-row  ">
        {/* section 1 */}
        <div className="  border-green-900  lg:w-[40%]">
          <ProfileGallery videos={girl.videos || []} photos={allPhotos} />
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
