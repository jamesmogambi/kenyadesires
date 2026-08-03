import SectionCard from "@/components/SectionCard";
import React from "react";
import HeaderSection from "./HeaderSection";
import InfoSection from "@/app/administration/InfoSection";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import type { IAgency } from "@/types/agency.types";

async function page() {
  const { userId } = await auth();
  const agency: IAgency | null = userId ? await getAgencyByOwnerId(userId) : null;

  const verificationStarted =
    !!agency && agency.verificationStatus !== "pending";
  const ctaHref = verificationStarted
    ? "/agency-verification-status"
    : "/agency-verify";
  const ctaLabel = verificationStarted
    ? "View verification status"
    : "Start Verification";

  return (
    <>
      <div>
        <SectionCard>
          <HeaderSection />

          <div className="my-4 space-y-10 mt-8">
            <InfoSection
              title="What is agency identity verification?"
              description="Agency identity verification confirms that the business is legitimate and trustworthy. The agency representative uploads a valid Business Registration Certificate for the agency together with their own government-issued National ID, plus a real-time selfie. These are cross-checked by our verification system. Once approved, the agency receives a verified badge, building credibility with clients and escorts alike."
            />

            <InfoSection
              title="Why is verifying identity important to the agency?"
              description="Verifying identity builds trust with potential clients and escorts, making the agency profile stand out among others. It increases the chances of receiving genuine inquiries and bookings, as clients prefer verified agencies. It also protects the agency's reputation and ensures a safer, more professional experience on the platform."
            />

            <InfoSection
              title="How to start verifying?"
              description="To begin the verification process, click the button below. You will be asked to upload two documents: a valid Business Registration Certificate for the agency and a government-issued National ID belonging to the agency representative, along with a live selfie. Once submitted, our team will review your documents and approve your verification within one business day."
            />

            <InfoSection
              title="Verification reward"
              description="When your agency identity verification is approved, you will receive 200 credits (equivalent to KSH 2000, assuming 1 credit = KSH 10) credited to your account. These credits can be used to boost your agency listing, promote your escorts, and extend your advertising on the platform."
            />

            <div className="flex justify-center items-center">
              <Link
                href={ctaHref}
                className="px-5 py-3 bg-primary text-lg text-white uppercase font-semibold rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </SectionCard>
      </div>
    </>
  );
};

export default page;
