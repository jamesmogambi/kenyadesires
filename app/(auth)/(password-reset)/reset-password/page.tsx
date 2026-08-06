import React from "react";
import { Metadata } from "next";
import PasswordResetForm from "./PasswordResetForm";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const page = () => {
  return (
    <div>
      <PasswordResetForm />
    </div>
  );
};

export default page;
