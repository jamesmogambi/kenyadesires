export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import SectionCard from "@/components/SectionCard";
import React from "react";
import TextSection from "./TextSection";
import InfoSection from "./InfoSection";
import { Metadata } from "next";
import UserForm from "./UserForm";
import { auth } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";

export const metadata: Metadata = {
  title: "Update Profile 💖 | kenyadesires.com",
};
const page = async () => {
  const { userId } = await auth();
  const escort = userId ? await getEscortByClerkUserId(userId) : null;

  if (!escort) {
    return (
      <div className="flex flex-1 items-center justify-center text-primary">
        No escort profile found
      </div>
    );
  }
  console.log("profile of escort", escort);
  return (
    <div className="text-4xl ">
      <SectionCard>
        <TextSection />
        <div className="my-4 space-y-10 mt-8">
          <InfoSection
            title="How to extend your listing?"
            description="If you have enough credits, simply click below at the specific girl: “EXTEND LISTING BY 30 DAYS”. The system will automatically deduct the credits and extend the membership by another 30 days."
          />

          <InfoSection
            title="How to boost a listing?"
            description="Each girl has a “BOOST LISTING” button. After clicking this button, choose how many credits per day you want to use to boost the girl and until when the boosting should be active. During this process you can purchase more credits at any time so that the listing appears higher among others if the added credits are not enough for first place. You can find more information in the help"
          />

          <InfoSection
            title="How to top up credits?"
            description={`To purchase credits, simply go to your account settings and select "BUY MORE CREDITS". Then order a credit package and send the corresponding amount with the correct variable symbol (VS). Within one hour of receiving the payment, the system will automatically add the credits to your account. There’s no need to contact us; everything is automatic. If the credits do not appear within one hour, please contact us.`}
          />
        </div>

        <div className="mt-6">
          <UserForm />
        </div>
      </SectionCard>
    </div>
  );
};

export default page;
