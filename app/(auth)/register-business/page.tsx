import React from "react";
import { Metadata } from "next";
import RegisterBusinessForm from "./RegisterBusinessForm";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Register Agency or Business Registration for Girls - My Site",
  description: " Agency registration",
  robots: {
    index: false,
    follow: true,
  },
};
const page = () => {
  return (
    <div>
      <RegisterBusinessForm />
    </div>
  );
};

export default page;
