import React from "react";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import NewEscortForm from "./NewEscortForm";

export const metadata: Metadata = {
  title: "New Profile - Kenya Desires",
  robots: {
    index: false,
    follow: true,
  },
};
const page = async () => {
  const { userId } = await auth();
  const escort = userId ? await getEscortByClerkUserId(userId) : null;

  if (escort) {
    redirect("/administration");
  }

  return (
    <div>
      <NewEscortForm fresh />
    </div>
  );
};

export default page;
