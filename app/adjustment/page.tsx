import React from "react";

import NewEscortForm from "@/app/new-profile/NewEscortForm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEscortByClerkUserId, getEscortByEmail } from "@/server-actions/girl.action";
import type { NewEscortProfileInput } from "@/server-actions/girl.action";

const page = async () => {
  const { userId } = await auth();
  const user = await currentUser();
  let escort = userId ? await getEscortByClerkUserId(userId) : null;

  if (!escort && user?.primaryEmailAddress?.emailAddress) {
    const byEmail = await getEscortByEmail(user.primaryEmailAddress.emailAddress);
    if (byEmail) {
      escort = byEmail;
    }
  }

  const initialData: NewEscortProfileInput | null = escort
    ? {
        id: escort.id,
        name: escort.name,
        email: escort.email,
        street: escort?.street || "",
        phone: escort.telephone || "",
        whatsappNumber: escort.whatsappPhone || "",
        region: (escort.locations?.[0]?.region ??
          escort.primaryRegion ??
          "") as string,
        town: (escort.locations?.[0]?.town ?? "") as string,
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
        languages: escort.languages,
        practices: escort.practices,
        bdsm: escort.bdsm,
        massages: escort.massage,
        extraServices: escort.extraServices,
        categories: escort.categories,
        openingHours: escort.openingHours,
        bustSize: escort.bustSize || "",
      }
    : null;

  console.log("escort record==>", { ...initialData });
  return (
    <div>
      <NewEscortForm
        mode={initialData ? "edit" : "create"}
        initialData={initialData || undefined}
        fresh={!initialData}
        isEscort
      />
    </div>
  );
};

export default page;
