import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";
import AgencyProfileForm from "./AgencyProfileForm";

export const metadata: Metadata = {
  title: "Agency Profile 💖 | kenyadesires.com",
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
          You need to be signed in to create an agency profile.
        </p>
        <Link
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg"
          href="/"
        >
          Go to homepage
        </Link>
      </SectionCard>
    );
  }

  const user = await currentUser();

  return (
    <div>
      <AgencyProfileForm
        ownerId={userId}
        defaultEmail={user?.primaryEmailAddress?.emailAddress}
      />
    </div>
  );
};

export default page;
