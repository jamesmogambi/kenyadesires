import React from "react";
import { Metadata } from "next";
import VerificationForm from "./VerificationForm";

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
    <div className="">
      <VerificationForm />
    </div>
  );
};

export default page;
