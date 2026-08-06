import { cn } from "@/lib/utils";
import React from "react";
import { Metadata } from "next";
import VerifyEmailForm from "./VerifyEmailForm";

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
