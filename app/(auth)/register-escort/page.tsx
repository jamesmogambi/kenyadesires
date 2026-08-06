import React from "react";
import { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Private Room Registration for Girls - My Site",
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
