import { cn } from "@/lib/utils";
import React, { useState } from "react";

import ProfileGallery from "../girl/ProfileGallery";
import ProfileSelectInput from "./ProfileSelectInput";
// import { variantSettings } from "@/fixtures/setting";
import { ServiceTags } from "./ServiceTags";
import { useFormStore } from "@/store/formStore";
import { useVariantStore } from "@/store/variantStore";
interface Prop {
  className?: string;
  form: any;
}
const SettingsForm = ({ form, className }: Prop) => {
  const { setValue } = form;

  const {
    age,
    setAge,
    breast,
    setBreast,
    character,
    setCharacter,
    hairColor,
    setHairColor,
    nationality,
    setNationality,
    experience,
    setExperience,
    tags,
    setTags,
  } = useFormStore();

  const variantSettings = useVariantStore();
  // const { hairColor, nationality, experience } = variantSettings;
  return (
    <section className={cn("space-y-2 w-full", className)}>
      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setAge}
            value={age}
            name="variantAge"
            options={variantSettings.age}
            placeholder={age ? `Age: ${age}` : "Select age"}
          />
        </div>
      </div>

      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setBreast}
            value={breast}
            name="variantBreast"
            options={variantSettings.breast}
            placeholder={breast ? `Breasts: ${breast}` : "Select breasts"}
          />
        </div>
      </div>

      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setCharacter}
            value={character}
            name="variantCharacter"
            options={variantSettings.character}
            placeholder={character ? `Character: ${character}` : "Select a character"}
          />
        </div>
      </div>

      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setHairColor}
            value={hairColor}
            name="variantHairColor"
            options={variantSettings.hairColor}
            placeholder={hairColor ? `Hair: ${hairColor}` : "Select hair color"}
          />
        </div>
      </div>

      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setNationality}
            value={nationality}
            name="variantNationality"
            options={variantSettings.nationality}
            placeholder={nationality ? `Nationality: ${nationality}` : "Select Nationality"}
          />
        </div>
      </div>

      <div className=" flex-row  w-full justify-between flex gap-2  border-none">
        <div className=" w-full  border-primary">
          <ProfileSelectInput
            onChange={setExperience}
            value={experience}
            name="variantExperience"
            options={variantSettings.experience}
            placeholder={experience ? `Experience: ${experience}` : "Select Experience"}
          />
        </div>
      </div>

      <ServiceTags value={tags} onChange={setTags} />
    </section>
  );
};

export default SettingsForm;
