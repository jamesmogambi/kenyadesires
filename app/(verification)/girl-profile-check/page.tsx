import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";

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
          You need to be signed in to verify your profile.
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

  return (
    <SectionCard className="py-16 flex mt-8 justify-center items-center flex-col">
      <h3 className="text-2xl font-semibold text-white mb-4">
        Create your Girl profile first
      </h3>
      <p className="text-white/50 text-lg mb-8">
        You need to create a girl profile before starting your verification .
      </p>
      <Link
        className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg"
        href="/new-profile"
      >
        Go to Girl profile
      </Link>
    </SectionCard>
  );
};

export default page;
