"use client";

import { useState, useEffect } from "react";
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
        creditsValue: "10 KSH",
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

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/verify/status");
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Failed to fetch verification status:", err);
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
      <SectionCard className="mt-14">
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
            <Link
              href="/"
              className="inline-block px-6 text-lg py-4 bg-primary text-white font-semibold rounded-none hover:bg-primary/80 transition-colors"
            >
              Back to KenyaDesires
            </Link>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
