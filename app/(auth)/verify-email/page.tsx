import { cn } from "@/lib/utils";
import React from "react";
import { Metadata } from "next";
import VerifyEmailForm from "./VerifyEmailForm";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const page = () => {
  return (
    <div className="pt-12">
      <VerifyEmailForm />
    </div>
  );
};

export default page;
