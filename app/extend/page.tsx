"use client";

import React, { useState } from "react";
import InfoAlert from "./InfoAlert";
import MessageAlert from "./MessageAlert";
import { PurchaseInfoSection } from "./PurchaseInfoSection";
import AdvertisingPriceLIst from "./AdvertisingPriceLIst";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { getUserCredits } from "@/server-actions/payment.action";
import { useRouter } from "next/navigation";

const ExtendPage = () => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  React.useEffect(() => {
    async function fetchCredits() {
      const result = await getUserCredits();
      if (result.success) {
        setCredits(result.credits);
      }
      setLoading(false);
    }
    fetchCredits();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <InfoAlert className="" text="|   Extend Membership" />
      <MessageAlert
        className="px-2"
        text="WARNING – if you encounter someone contacting you from various phone numbers, do not respond to anything. This is a scam. We will always inform you only from phone number 0743 129 621"
      />
      <div className="mt-6 flex justify-center">
        <div className="bg-stone-100 rounded-lg p-4 md:p-6 flex items-center gap-3 shadow-md">
          <CreditCard className="size-6 md:size-8 text-red-700" />
          <div>
            <p className="text-sm text-gray-600">Your Credits</p>
            <p className="text-2xl md:text-3xl font-bold text-red-700">
              {loading ? "..." : `${credits}`}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full mt-8 lg:mt-16 lg:max-w-200 my-3 mx-auto px-4">
        <h4 className="text-2xl md:text-4xl text-center font-extrabold text-red-700">
          Purchase credits to boost your listing
        </h4>

        <PurchaseInfoSection className="mt-8 lg:mt-20" />
        <AdvertisingPriceLIst
          userCredits={credits}
          onPurchaseSuccess={() => router.refresh()}
        />
      </div>
      <p className="text-lg py-12 md:text-2xl   pb-8 max-w-250 text-red-700 mx-auto text-center my-6 font-semibold px-4">
        After the payment is received, the credits will be added automatically.
        You can then use your credits to purchase a boost package and increase
        your visibility.
      </p>
    </div>
  );
};

export default ExtendPage;
