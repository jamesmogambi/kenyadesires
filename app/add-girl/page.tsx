import React from "react";
import { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";
import NewEscortForm from "@/app/new-profile/NewEscortForm";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Add Girl 💖 | kenyadesires.xyz",
  robots: {
    index: false,
    follow: true,
  },
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
          You need to be signed in to add a girl.
        </p>
      </SectionCard>
    );
  }

  const agency = await getAgencyByOwnerId(userId);

  if (!agency) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Agency required
        </h3>
        <p className="text-white/50 text-lg mb-8">
          You need to have an agency profile before adding girls.
        </p>
        <a
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg inline-block"
          href="/agency-profile"
        >
          Create agency
        </a>
      </SectionCard>
    );
  }

  return (
    <div>
      <NewEscortForm agencyId={agency.id} fresh />
    </div>
  );
};

export default page;
