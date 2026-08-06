import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import NewEscortForm from "@/app/new-profile/NewEscortForm";
import { getEscortByIdOriginal } from "@/server-actions/girl.action";
import type { NewEscortProfileInput } from "@/server-actions/girl.action";

export const metadata: Metadata = {
  title: "Edit Girl 💖 | kenyadesires.com",
  robots: {
    index: false,
    follow: true,
  },
};

interface EditGirlPageProps {
  params: Promise<{
    id: string;
  }>;
}

const mapEscortToInitialData = (escort: any): NewEscortProfileInput => ({
  id: escort.id,
  name: escort.name || "",
  email: escort.email || "",
  street: escort.street || "",
  phone: escort.telephone || "",
  whatsappNumber: escort.whatsappPhone || "",
        county: escort.county || "",
        towns: (escort.regions?.filter(
          (r: string) => r !== escort.primaryRegion,
        ) || []) as string[],
        region: (escort.locations?.[0]?.region ?? escort.primaryRegion ?? "") as string,
        nationality: escort.nationality || "",
  age: escort.age || "",
  height: "",
  breasts: escort.breastSize || escort.bustSize || "",
  weight: escort.weight || "",
  ageCategory: escort.ageCategory || "",
  character: escort.character || "",
  hairColor: escort.hairColor || "",
  experience: escort.experience || "",
  about: escort.about || "",
   previewPhoto: escort.previewPhoto || "",
   images: escort.images || [],
   videos: escort.videos || [],
   telephone: escort.telephone || "",
  whatsappPhone: escort.whatsappPhone || "",
  availability: escort.availability || [],
  languages: escort.languages || [],
  practices: escort.practices || [],
  bdsm: escort.bdsm || [],
  massages: escort.massage || [],
  extraServices: escort.extraServices || [],
  categories: escort.categories || [],
  openingHours: escort.openingHours || {
    monday: "",
    tuesday: "",
    wednesday: "",
    thursday: "",
    friday: "",
    saturday: "",
    sunday: "",
  },
  bustSize: escort.bustSize || "",
  clerkUserId: escort.clerkUserId,
  agencyId: escort.agencyId,
  isAgencyOwned: escort.isAgencyOwned,
});

const EditGirlPage = async ({ params }: EditGirlPageProps) => {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return notFound();
  }

  const escort = await getEscortByIdOriginal(id);

  if (!escort) {
    return notFound();
  }

  const initialData = mapEscortToInitialData(escort);

  return (
    <div>
      <NewEscortForm mode="edit" initialData={initialData} agencyId={escort.agencyId} />
    </div>
  );
};

export default EditGirlPage;
