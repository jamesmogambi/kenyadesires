"use client";

import React from "react";
import RenderEditorContent from "./RenderEditorContent";
import PhonePicker from "./PhonePicker";
import AboutTabs from "./AboutTabs";
import Link from "next/link";
import { formatSlugToTitle, normalizeArray } from "@/lib/utils";
import { Escort } from "@/server-actions/escort.action";
import { trackClickContact, trackClickWhatsApp, determineProfileType } from "@/lib/customer-analytics";

interface Prop {
  girl: Escort;
}

const BioSection = ({ girl }: Prop) => {
  const {
    about,
    categories,
    telephone,
    whatsappPhone,
    county,
    primaryRegion,
    regions,
  } = girl;

  const profileId = girl.id;
  const profileType = determineProfileType(girl);
  const location = primaryRegion || girl.locations?.[0]?.region || county || "Kenya";

  const getDisplayAddress = (): string => {
    const uniqueRegions = new Set<string>();

    if (primaryRegion && primaryRegion.trim()) {
      uniqueRegions.add(primaryRegion);
    }

    normalizeArray(regions).forEach((r: string) => {
      if (r && r.trim()) uniqueRegions.add(r);
    });

    const parts: string[] = Array.from(uniqueRegions).map(formatSlugToTitle);

    if (
      county &&
      county.trim() &&
      !Array.from(uniqueRegions).includes(county)
    ) {
      parts.push(formatSlugToTitle(county));
    }

    if (parts.length > 0) {
      return parts.join(", ");
    }

    return "Location not specified";
  };

  const displayAddress = getDisplayAddress();
  const hasAddress = displayAddress !== "Location not specified";

  const handlePhoneClick = () => {
    trackClickContact(profileId, profileType, location, "phone");
  };

  const handleWhatsAppClick = () => {
    trackClickContact(profileId, profileType, location, "whatsapp");
    trackClickWhatsApp(profileId, profileType, location);
  };

  return (
    <div>
      {about && <RenderEditorContent html={about} />}

      <div>
        <PhonePicker phone={telephone || whatsappPhone} className="my-6" onClick={handlePhoneClick} />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-primary">Locations:</h3>

          {hasAddress ? (
            <p className="text-white/50 font-light mt-1">{displayAddress}</p>
          ) : (
            <p className="text-white/30 italic mt-1">Location not specified</p>
          )}
        </div>

        {/* WhatsApp icon - only if exists */}
        {whatsappPhone && (
          <a
            href={`https://wa.me/${whatsappPhone.replace(/[^\d+]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full cursor-pointer bg-[#40C351] shrink-0 ml-4"
            onClick={handleWhatsAppClick}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={30}
              height={30}
              viewBox="0 0 24 24"
            >
              <path
                fill="#fff"
                d="M18.497 4.409a10 10 0 0 1-10.36 16.828l-.223-.098l-4.759.849l-.11.011a1 1 0 0 1-.11 0l-.102-.013l-.108-.024l-.105-.037l-.099-.047l-.093-.058l-.014-.011l-.012-.007l-.086-.073l-.077-.08l-.067-.088l-.056-.094l-.034-.07l-.04-.108l-.028-.128l-.012-.102a1 1 0 0 1 0-.125l.012-.1l.024-.11l.045-.122l1.433-3.304l-.009-.014A10 10 0 0 1 5.056 4.83l.215-.203a10 10 0 0 1 13.226-.217M9.5 7.5A1.5 1.5 0 0 0 8 9v1a6 6 0 0 0 6 6h1a1.5 1.5 0 0 0 0-3h-1l-.144.007a1.5 1.5 0 0 0-1.128.697l-.042.074l-.022-.007a4.01 4.01 0 0 1-2.435-2.435l-.008-.023l.075-.041A1.5 1.5 0 0 0 11 10V9a1.5 1.5 0 0 0-1.5-1.5"
                strokeWidth={0.5}
                stroke="#fff"
              ></path>
            </svg>
          </a>
        )}
      </div>

      <AboutTabs className="my-12 mb-0" girl={girl} />

      {/* Other categories section */}
      <div className="mt-3">
        <h5 className="font-bold text-lg text-primary">
          Other Categories girls:
        </h5>
        <div>
          {normalizeArray(categories).map((category: any, index: number) => (
            <Link
              href={`/girls?practice=${category}`}
              key={index}
              className="text-white/40"
            >
              <span className="underline capitalize text-white/30">
                {category}
              </span>
              {index < normalizeArray(categories).length - 1 && ", "}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BioSection;
