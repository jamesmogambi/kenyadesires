import React from "react";
import InfoAlert from "./InfoAlert";
import MessageAlert from "./MessageAlert";
import { PurchaseInfoSection } from "./PurchaseInfoSection";
import AdvertisingPriceLIst from "./AdvertisingPriceLIst";

const page = () => {
  return (
    <div className="min-h-screen bg-white">
      <InfoAlert className="-mt-10" text="|   Extend Membership" />
      <MessageAlert
        text="WARNING – if you encounter someone contacting you from various phone numbers, do not respond to anything. This is a scam. We will always inform you only from phone number 0743 129 621
"
      />

      <div className="w-full mt-8 lg:mt-16 lg:max-w-200 my-3 mx-auto px-4">
        <h4 className="text-2xl md:text-4xl text-center font-extrabold text-red-700">
          Purchase credits to extend or boost your listing
        </h4>

        <PurchaseInfoSection className="mt-8 lg:mt-20" />
        <AdvertisingPriceLIst />
      </div>
      <p className="text-lg md:text-2xl pb-8 max-w-250 text-red-700 mx-auto text-center my-6 font-semibold px-4">
        After the payment is received, the credits will be added automatically.
        If you advertise as a standalone profile and the membership has ended or
        only 5 days remain, your membership will be automatically extended from
        this payment.
      </p>
    </div>
  );
};

export default page;
