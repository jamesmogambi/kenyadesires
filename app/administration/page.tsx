export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import SectionCard from "@/components/SectionCard";
import React from "react";
import TextSection from "./TextSection";
import InfoSection from "./InfoSection";
import { Metadata } from "next";
import UserForm from "./UserForm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import Link from "next/link";
import AgencyGirls from "./AgencyGirls";
import { getUserActivePackages, getUserCredits } from "@/server-actions/payment.action";
import { Button } from "@/components/ui/button";
import { CreditCard, Package, Check } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/constants/packages";

export const metadata: Metadata = {
  title: "Update Profile 💖 | kenyadesires.com",
  robots: {
    index: false,
    follow: true,
  },
};

const page = async () => {
  const { userId } = await auth();
  const user = await currentUser();

  const role = user?.unsafeMetadata?.role as string;

  const isBusiness = role === "business";
  const agency = isBusiness && userId ? await getAgencyByOwnerId(userId) : null;

  const isUser = role === "user";
  const escort = isUser && userId ? await getEscortByClerkUserId(userId) : null;

  let editProfileLink = "/adjustment";
  let buttonText = "Edit profile";

  if (isBusiness) {
    editProfileLink = "/agency-profile";
    buttonText = agency ? "Edit agency" : "Create agency";
  } else if (!escort) {
    editProfileLink = "/adjustment";
    buttonText = "Create profile";
  } else {
    editProfileLink = "/adjustment";
    buttonText = "Edit profile";
  }

  const creditsResult = userId ? await getUserCredits() : { success: true, credits: 0 };
  const packagesResult = userId ? await getUserActivePackages() : { success: true, packages: [] };

  const credits = creditsResult.success ? creditsResult.credits : 0;
  const activePackages = packagesResult.success ? packagesResult.packages : [];

  const planType = escort?.plan?.type || agency?.plan?.type || "free";
  const plan = PLAN_DETAILS[planType as keyof typeof PLAN_DETAILS] || PLAN_DETAILS.free;

  return (
    <div className="text-4xl ">
      <SectionCard>
        <TextSection />

        <div className="my-4 space-y-10 mt-8">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <div className="bg-stone-100 rounded-lg p-4 md:p-6 flex items-center gap-3 shadow-md flex-1 max-w-md">
              <CreditCard className="size-6 md:size-8 text-red-700" />
              <div>
                <p className="text-sm text-gray-600">Your Credits</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700">{credits}</p>
              </div>
            </div>
            <div className="bg-stone-100 rounded-lg p-4 md:p-6 flex items-center gap-3 shadow-md flex-1 max-w-md">
              <Package className="size-6 md:size-8 text-red-700" />
              <div>
                <p className="text-sm text-gray-600">Current Plan</p>
                <p className="text-2xl md:text-3xl font-bold text-red-700 capitalize">{plan.name}</p>
              </div>
            </div>
          </div>

          {activePackages.length > 0 && (
            <div className="bg-stone-100 rounded-lg p-4 md:p-6 shadow-md">
              <h4 className="text-xl font-bold text-red-700 mb-4">Active Ad Packages</h4>
              <div className="space-y-3">
                {activePackages.map((pkg: any) => (
                  <div key={pkg.id} className="flex items-center justify-between bg-white p-3 rounded-md">
                    <div>
                      <p className="font-semibold text-gray-800">{pkg.name || pkg.packageId}</p>
                      <p className="text-sm text-gray-600">
                        Expires: {new Date(pkg.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="size-4" />
                      <span className="font-semibold">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InfoSection
            title="How to extend your listing?"
            description="If you have enough credits, simply click below at the specific girl: 'EXTEND LISTING BY 30 DAYS'. The system will automatically deduct the credits and extend the membership by another 30 days."
          />

          <InfoSection
            title="How to boost a listing?"
            description="Each girl has a 'BOOST LISTING' button. After clicking this button, choose how many credits per day you want to use to boost the girl and until when the boosting should be active. During this process you can purchase more credits at any time so that the listing appears higher among others if the added credits are not enough for first place. You can find more information in the help"
          />

          <InfoSection
            title="How to top up credits?"
            description={`To purchase credits, simply go to your account settings and select "BUY MORE CREDITS". Then order a credit package and send the corresponding amount with the correct variable symbol (VS). Within one hour of receiving the payment, the system will automatically add the credits to your account. There's no need to contact us; everything is automatic. If the credits do not appear within one hour, please contact us.`}
          />

          <div className=" flex justify-center items-center">
            <Link
              className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg "
              href={editProfileLink}
            >
              {buttonText}
            </Link>
          </div>
        </div>

        {agency && <AgencyGirls agencyId={agency.id} />}
        <div className="mt-6">
          <UserForm />
        </div>
      </SectionCard>
    </div>
  );
};

export default page;
