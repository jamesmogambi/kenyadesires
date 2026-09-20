"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { trackProvider } from "@/lib/analytics";

export default function VerifyProfileCta() {
  const { user } = useUser();
  const isProvider =
    (user?.unsafeMetadata?.role as string | undefined) === "user";

  return (
    <Link
      href="/girl-documents-verification"
      className="px-5 py-3 bg-primary text-lg text-white uppercase font-semibold rounded-none transition-colors"
      onClick={() => {
        if (isProvider && user?.id) {
          trackProvider("start_verification", { provider_id: user.id });
        }
      }}
    >
      Start Verification
    </Link>
  );
}
