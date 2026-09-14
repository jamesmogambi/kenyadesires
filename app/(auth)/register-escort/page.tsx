import React from "react";
import { Metadata } from "next";
import RegisterForm from "./RegisterForm";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: "Private Room Registration for Girls - KenyaDesires",
  description: " Private room registration",
  robots: {
    index: false,
    follow: true,
  },
};
const page = () => {
  return (
    <div>
      <RegisterForm />
    </div>
  );
};

export default page;
