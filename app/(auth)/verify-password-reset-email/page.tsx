import React from "react";
import { Metadata } from "next";
import VerificationForm from "./VerificationForm";

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
