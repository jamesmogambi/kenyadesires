import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";
import AgencyVerificationForm from "@/app/agency-profile/AgencyVerificationForm";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
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
          You need to be signed in to verify your agency.
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

  const agency = await getAgencyByOwnerId(userId);

  if (!agency) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Create your agency profile first
        </h3>
        <p className="text-white/50 text-lg mb-8">
          You need to create an agency profile before submitting your
          verification documents.
        </p>
        <Link
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg"
          href="/agency-profile"
        >
          Go to agency profile
        </Link>
      </SectionCard>
    );
  }

  return (
    <div>
      <SectionCard className="lg:px-12">
        {/* <h3 className="text-2xl font-semibold mb-1">
          Verify your <span className="text-primary font-bold">agency</span>{" "}
          identity
        </h3>
        <p className="text-white/50 text-lg mb-6">
          Upload the required documents to verify your agency. This usually
          takes up to one business day.
        </p> */}

        <AgencyVerificationForm
          agencyId={agency.id}
          ownerId={userId}
          agencyName={agency.name}
          existingDocs={agency.verificationDocuments}
        />
      </SectionCard>
    </div>
  );
};

export default page;
