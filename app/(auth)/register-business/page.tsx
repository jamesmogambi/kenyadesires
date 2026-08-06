import React from "react";
import { Metadata } from "next";
import RegisterBusinessForm from "./RegisterBusinessForm";

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
