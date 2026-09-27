"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import SectionCard from "@/components/SectionCard";
import { Check, Clock, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";

type VerificationStatus =
  | "not_found"
  | "pending_review"
  | "approved"
  | "declined"
  | "expired"
  | "unknown";

interface VerificationResult {
  status: VerificationStatus;
  decision: unknown;
  verifiedAt: string | null;
  updatedAt: string | null;
}

function getStatusConfig(status: VerificationStatus) {
  switch (status) {
    case "approved":
      return {
        icon: Check,
        iconColor: "text-green-400",
        bgColor: "bg-green-400/20",
        title: "Verification Approved",
        message:
          "Your identity has been verified successfully. You now have access to all verified features.",
        showCredits: true,
        creditsAmount: 50,
        creditsValue: "500 KSH",
      };
    case "declined":
      return {
        icon: XCircle,
        iconColor: "text-red-400",
        bgColor: "bg-red-400/20",
        title: "Verification Declined",
        message:
          "Your identity verification was not approved. Please review the documents and re-submit.",
        showCredits: false,
      };
    case "pending_review":
      return {
        icon: Clock,
        iconColor: "text-yellow-400",
        bgColor: "bg-yellow-400/20",
        title: "Under Review",
        message:
          "Your identity verification is currently under review. This usually takes up to 24 hours.",
        showCredits: false,
      };
    case "expired":
      return {
        icon: AlertTriangle,
        iconColor: "text-orange-400",
        bgColor: "bg-orange-400/20",
        title: "Verification Expired",
        message:
          "Your verification has expired. Please re-submit your documents to verify your identity.",
        showCredits: false,
      };
    case "not_found":
      return {
        icon: Clock,
        iconColor: "text-yellow-400",
        bgColor: "bg-yellow-400/20",
        title: "Verification Submitted",
        message:
          "Your identity verification has been received and is pending review. You will be notified once the review is complete.",
        showCredits: false,
      };
    default:
      return {
        icon: AlertTriangle,
        iconColor: "text-yellow-400",
        bgColor: "bg-yellow-400/20",
        title: "Unknown Status",
        message:
          "Your verification status is being processed. Please check back later.",
        showCredits: false,
      };
  }
}

export default function VerifyDonePage() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/verify/status", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || `Request failed (${res.status})`);
        }

        setResult(data);
      } catch (err) {
        // Surface why the lookup failed instead of silently rendering
        // "Unknown Status", which is indistinguishable from a genuinely
        // unrecognised DB value.
        console.error("Failed to fetch verification status:", err);
        setFetchError(
          err instanceof Error ? err.message : "Could not load verification status",
        );
        setResult({
          status: "unknown",
          decision: null,
          verifiedAt: null,
          updatedAt: null,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  useEffect(() => {
    if (result?.status === "approved") {
      toast.custom(
        () => (
          <div className="bg-primary text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 flex-shrink-0"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-semibold">Verification Approved</p>
              <p className="text-sm opacity-90">
                +50 credits (500 KSH) credited to your account
              </p>
            </div>
          </div>
        ),
        { duration: 5000 },
      );

      window.dispatchEvent(new CustomEvent("credits-updated"));
    }
  }, [result?.status]);

  if (loading) {
    return (
      <div>
        <SectionCard>
          <div className="flex items-center justify-center">
            <div className="mx-auto p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-white/70">Checking verification status…</p>
            </div>
          </div>
        </SectionCard>
      </div>
    );
  }

  const config = getStatusConfig(result?.status ?? "unknown");
  const Icon = config.icon;

  return (
    <div>
      <SectionCard>
        <div className="flex items-center justify-center">
          <div className="mx-auto p-8 text-center">
            <div
              className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}
            >
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">
              {config.title}
            </h1>
            <p className="text-white/70 mb-6">{config.message}</p>
            {fetchError && (
              <p className="text-red-400 text-sm mb-6">
                Could not load your verification status: {fetchError}
              </p>
            )}
            {config.showCredits && (
              <div className="bg-primary/10 rounded-lg p-4 mb-6">
                <p className="text-primary font-semibold text-lg">
                  +{config.creditsAmount} Credits
                </p>
                <p className="text-white/60 text-sm">
                  Worth {config.creditsValue} — credited to your account
                </p>
              </div>
            )}
            {result?.status === "declined" && (
              <p className="text-red-400 text-sm mb-4">
                You can re-submit your verification at any time.
              </p>
            )}
            {result?.status === "expired" && (
              <p className="text-orange-400 text-sm mb-4">
                Re-submit your documents to regain verified status.
              </p>
            )}
            {result?.status !== "approved" && (
              <Link
                href="/girl-documents-verification"
                className="inline-block uppercase px-6 text-xl py-4 bg-primary text-white font-semibold rounded-none hover:bg-primary/80 transition-colors"
              >
                Re-submit documents
              </Link>
            )}
            {result?.status === "approved" && (
              <Link
                href="/"
                className="inline-block px-6 text-lg py-4 bg-primary text-white font-semibold rounded-none hover:bg-primary/80 transition-colors"
              >
                Back to KenyaDesires
              </Link>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
