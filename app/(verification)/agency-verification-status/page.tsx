import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import SectionCard from "@/components/SectionCard";
import type { IAgency } from "@/types/agency.types";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const STATUS_LABELS: Record<
  NonNullable<IAgency["verificationStatus"]>,
  { title: string; subtitle: string; color: string; label: string }
> = {
  pending: {
    title: "Pending Verification",
    subtitle:
      "Your agency documents have not been submitted yet. Upload them to start the review.",
    color: "bg-yellow-400",
    label: "pending",
  },
  under_review: {
    title: "Under Review",
    subtitle:
      "Your verification documents have been received and are being reviewed by our team. This usually takes up to one business day.",
    color: "bg-blue-400",
    label: "under_review",
  },
  verified: {
    title: "Verified Agency",
    subtitle:
      "Your agency identity has been verified. You now have access to all verified features.",
    color: "bg-green-400",
    label: "verified",
  },
  rejected: {
    title: "Verification Rejected",
    subtitle:
      "Your verification was not approved. Please review the requirements and re-submit your documents.",
    color: "bg-red-400",
    label: "rejected",
  },
};

export default async function AgencyVerificationStatusPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <SectionCard>
        <h3 className="text-2xl font-semibold text-white mb-4">
          Sign in required
        </h3>
        <p className="text-white/50 text-lg mb-8">
          You need to be signed in to view your verification status.
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
          No agency profile found
        </h3>
        <p className="text-white/50 text-lg mb-8">
          Create your agency profile before checking verification status.
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

  const statusKey =
    agency.isVerified && agency.verificationStatus === "verified"
      ? "verified"
      : agency.verificationStatus || "pending";

  const status = STATUS_LABELS[statusKey];
  const docs = agency.verificationDocuments || {};
  const hasDocs = Boolean(docs.businessLicense || docs.idProof || docs.otherDocuments?.length);
  const showCredits = statusKey === "verified";

  return (
    <div className="max-w-2xl mx-auto">
      <SectionCard className="lg:px-12">
        <h3 className="text-2xl font-semibold mb-6">
          Agency verification status
        </h3>

        <div className="flex items-center gap-4 mb-6">
          <span
            className={`size-6 shrink-0 rounded-full ${status.color}`}
            aria-label={status.label}
          />
          <h4 className="text-2xl font-bold">{status.title}</h4>
        </div>

        <p className="text-white/70 text-lg mb-6">{status.subtitle}</p>

        {showCredits && (
          <div className="bg-primary/10 rounded-lg p-4 mb-6">
            <p className="text-primary font-semibold text-lg">
              +200 Credits
            </p>
            <p className="text-white/60 text-sm">
              Worth 2,000 KSH — credited to your account for completing verification
            </p>
          </div>
        )}

        {statusKey === "pending" && !hasDocs && (
          <Link
            className="inline-flex bg-primary p-3 px-5 font-semibold text-white uppercase text-lg rounded-none"
            href="/agency-verify"
          >
            Submit verification documents
          </Link>
        )}

        {hasDocs && (
          <div className="mt-6 space-y-3">
            <h5 className="text-base font-medium text-white/60">
              Submitted documents
            </h5>
            <ul className="space-y-2 text-sm text-white/70">
              {docs.businessLicense && (
                <li>
                  Business Registration Certificate{" "}
                  <a
                    href={docs.businessLicense}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    view
                  </a>
                </li>
              )}
              {docs.idProof && (
                <li>
                  National ID (front){" "}
                  <a
                    href={docs.idProof}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    view
                  </a>
                </li>
              )}
              {(docs.otherDocuments || []).map((url) => (
                <li key={url}>
                  National ID (back){" "}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-primary"
                  >
                    view
                  </a>
                </li>
              ))}
            </ul>

            {statusKey !== "verified" && (
              <Link
                className="inline-flex bg-primary p-3 px-5 font-semibold text-white uppercase text-lg rounded-none mt-4"
                href="/agency-verify"
              >
                Re-submit documents
              </Link>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
