import React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import SectionCard from "@/components/SectionCard";
import AgencyProfileForm from "./AgencyProfileForm";
import { getAgencyById, getAgencyByOwnerId, getCachedAgencies, isAdminUser } from "@/server-actions/agency.action";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Agency Profile 💖 | kenyadesires.xyz",
};

const page = async ({
  searchParams,
}: {
  searchParams: Promise<{ agency?: string; id?: string }>;
}) => {
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
  const isAdmin = await isAdminUser();

  const params = await searchParams;
  const requestedId = params.agency || params.id;

  // Admins edit an agency by id; everyone else edits the agency they own
  const agency = isAdmin
    ? await getAgencyById(requestedId || "")
    : await getAgencyByOwnerId(userId);

  if (isAdmin && requestedId && !agency) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Agency not found
        </h3>
        <p className="text-white/50 text-lg mb-8">
          No agency exists with the id you provided.
        </p>
        <Link
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg"
          href="/agencies"
        >
          Browse agencies
        </Link>
      </SectionCard>
    );
  }

  // Admins are not agency owners, so they pick which agency to edit
  if (isAdmin && !agency) {
    const agencyListResult = await getCachedAgencies(1, 100);
    const agencies = agencyListResult.data?.agencies ?? [];

    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Select an agency to edit
        </h3>

        {agencies.length === 0 ? (
          <p className="text-white/50 text-lg mb-8">No agencies found.</p>
        ) : (
          <ul className="space-y-2 mb-8">
            {agencies.map((agencyItem) => (
              <li key={agencyItem.id}>
                <Link
                  className="block bg-white/5 hover:bg-white/10 p-3 font-semibold text-white"
                  href={`/agency-profile?agency=${agencyItem.id}`}
                >
                  {agencyItem.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link
          className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg"
          href="/agencies"
        >
          Browse agencies
        </Link>
      </SectionCard>
    );
  }

  return (
    <div>
      <AgencyProfileForm
        ownerId={userId}
        defaultEmail={user?.primaryEmailAddress?.emailAddress}
        agency={agency}
      />
    </div>
  );
};

export default page;
