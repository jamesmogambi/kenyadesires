import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";
import NewEscortForm from "@/app/new-profile/NewEscortForm";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import type { NewEscortProfileInput } from "@/server-actions/girl.action";

export const metadata: Metadata = {
  title: "Agency Admin Profile 💖 | kenyadesires.com",
};

const page = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Sign in required
        </h3>
        <p className="text-white/50 text-lg mb-8">
          You need to be signed in to manage your profile.
        </p>
      </SectionCard>
    );
  }

  let escort;
  let agency;
  try {
    const [escortResult, agencyResult] = await Promise.all([
      getEscortByClerkUserId(userId),
      getAgencyByOwnerId(userId),
    ]);
    escort = escortResult;
    agency = agencyResult;
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Something went wrong
        </h3>
        <p className="text-white/50 text-lg mb-8">
          We couldn&apos;t load your profile. Please try again later.
        </p>
      </SectionCard>
    );
  }

  const agencyDefaults: NewEscortProfileInput = agency
    ? {
        id: undefined,
        name: agency.name || "",
        email: agency.contactEmail || "",
        street: "",
        phone: agency.contactPhone || "",
        whatsappNumber: agency.whatsappPhone || "",
        region: agency.region || "",
        town: agency.town || "",
        nationality: "",
        age: "",
        height: "",
        breasts: "",
        weight: "",
        ageCategory: "",
        character: "",
        hairColor: "",
        experience: "",
        about: "",
        previewPhoto: agency.logo || "",
        images: [],
        telephone: agency.contactPhone || "",
        whatsappPhone: agency.whatsappPhone || "",
        availability: [],
        languages: agency.languages || [],
        practices: [],
        bdsm: [],
        massages: [],
        extraServices: [],
        categories: agency.categories || [],
        openingHours: agency.openingHours || {
          monday: "",
          tuesday: "",
          wednesday: "",
          thursday: "",
          friday: "",
          saturday: "",
          sunday: "",
        },
        bustSize: "",
      }
    : {
        id: undefined,
        name: "",
        email: "",
        street: "",
        phone: "",
        whatsappNumber: "",
        region: "",
        town: "",
        nationality: "",
        age: "",
        height: "",
        breasts: "",
        weight: "",
        ageCategory: "",
        character: "",
        hairColor: "",
        experience: "",
        about: "",
        previewPhoto: "",
        images: [],
        telephone: "",
        whatsappPhone: "",
        availability: [],
        languages: [],
        practices: [],
        bdsm: [],
        massages: [],
        extraServices: [],
        categories: [],
        openingHours: {
          monday: "",
          tuesday: "",
          wednesday: "",
          thursday: "",
          friday: "",
          saturday: "",
          sunday: "",
        },
        bustSize: "",
      };

  const initialData: NewEscortProfileInput | undefined = escort
    ? {
        id: escort.id,
        name: escort.name || agencyDefaults.name,
        email: escort.email || agencyDefaults.email,
        street: escort?.street || "",
        phone: escort.telephone || agencyDefaults.phone,
        whatsappNumber: escort.whatsappPhone || agencyDefaults.whatsappNumber,
        region: (escort.locations?.[0]?.region ??
          escort.primaryRegion ??
          agencyDefaults.region) as string,
        town: (escort.locations?.[0]?.town ?? agencyDefaults.town) as string,
        nationality: escort.nationality,
        age: escort.age,
        height: "",
        breasts: escort.breastSize || escort.bustSize || "",
        weight: escort.weight,
        ageCategory: escort.ageCategory,
        character: escort.character,
        hairColor: escort.hairColor,
        experience: escort.experience,
        about: escort.about,
        previewPhoto: escort.previewPhoto,
        images: escort.images,
        telephone: escort.telephone,
        whatsappPhone: escort.whatsappPhone,
        availability: escort.availability,
        languages: escort.languages.length ? escort.languages : agencyDefaults.languages,
        practices: escort.practices,
        bdsm: escort.bdsm,
        massages: escort.massage,
        extraServices: escort.extraServices,
        categories: escort.categories.length ? escort.categories : agencyDefaults.categories,
        openingHours: escort.openingHours || agencyDefaults.openingHours,
        bustSize: escort.bustSize || "",
      }
    : agencyDefaults;

  return (
    <div>
      <NewEscortForm
        mode={initialData && escort ? "edit" : "create"}
        initialData={initialData}
        agencyId={agency?.id}
      />
    </div>
  );
};

export default page;
