import SectionCard from "@/components/SectionCard";
import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import EscortVerificationForm from "@/app/(verification)/verify-girl/EscortVerificationForm";
import Link from "next/link";

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
          You need to be signed in to verify your identity.
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

  const escort = await getEscortByClerkUserId(userId);

  if (!escort) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Create your profile first
        </h3>
        <p className="text-white/50 text-lg mb-8">
          You need to create a profile before submitting your verification
          documents.
        </p>
        <Link
          href="/edit-profile"
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg inline-block"
        >
          Go to profile
        </Link>
      </SectionCard>
    );
  }

  return (
    <div>
      <SectionCard className="lg:px-12">
        <div className="mb-6">
          <Link
            href="/verify-girl"
            className="text-white/60 hover:text-white text-sm underline"
          >
            ← Back to verification info
          </Link>
        </div>
        <EscortVerificationForm
          escortId={escort.id}
          existingName={escort.name}
          existingDocs={escort.verificationDocuments}
        />
      </SectionCard>
    </div>
  );
};

export default page;
