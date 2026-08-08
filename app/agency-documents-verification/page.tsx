import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import SectionCard from "@/components/SectionCard";
import AgencyVerificationForm from "@/app/agency-profile/AgencyVerificationForm";
import Link from "next/link";

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
          href="/"
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg inline-block"
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
          href="/agency-profile"
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg inline-block"
        >
          Go to agency profile
        </Link>
      </SectionCard>
    );
  }

  return (
    <div>
      <SectionCard className="lg:px-12">
        <div className="mb-6">
          <Link
            href="/verify-agency"
            className="text-white/60 hover:text-white text-sm underline"
          >
            ← Back to verification info
          </Link>
        </div>
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
