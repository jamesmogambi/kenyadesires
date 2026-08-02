import SectionCard from "@/components/SectionCard";
import React from "react";
import HeaderSection from "./HeaderSection";
import InfoSection from "@/app/administration/InfoSection";

const page = () => {
  return (
    <div>
      <SectionCard>
        <HeaderSection />

        <div className="my-4 space-y-10 mt-8">
          <InfoSection
            title="What is identity verification?"
            description="Identity verification confirms that the girl is who she claims to be. She uploads a valid government-issued ID and a real-time selfie, which are then cross-checked by our verification system. Once approved, her profile receives a verified badge, giving her credibility and trustworthiness."
          />

          <InfoSection
            title="Why is verifying identity important to the girl?"
            description="Verifying identity builds trust with potential clients, making her profile stand out among others. It increases her chances of receiving genuine inquiries and bookings, as clients prefer verified profiles. It also protects her reputation and ensures a safer, more professional experience on the platform."
          />

          <InfoSection
            title="How to start verifying?"
            description="To begin the verification process, click the button below. You will be guided to upload a valid government-issued ID and take a live selfie. Once submitted, our team will review your documents and approve your verification within one business day."
          />

          <div className=" flex justify-center items-center">
            {/* TODO:// PUT VERIFY GIRL BUTTON HERE */}
            {/* <Link
              className="bg-primary p-3 px-4 font-semibold text-white uppercase text-lg "
              href={editProfileLink}
            >
              {buttonText}
            </Link> */}
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

export default page;