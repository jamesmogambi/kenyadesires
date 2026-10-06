"use client";

import React from "react";
import RenderEditorContent from "./RenderEditorContent";
import PhonePicker from "./PhonePicker";
import AboutTabs from "./AboutTabs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  formatSlugToTitle,
  normalizeArray,
  buildListingHref,
} from "@/lib/utils";
import { Escort } from "@/server-actions/escort.action";
import {
  trackClickContact,
  trackClickWhatsApp,
  determineProfileType,
  trackShareProfile,
  type ShareMethod,
} from "@/lib/customer-analytics";

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
  const location =
    primaryRegion || girl.locations?.[0]?.region || county || "Kenya";
  const pathname = usePathname();
  const profileUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz").replace(/\/+$/, "")}${pathname}`;

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

  const handleShare = (method: ShareMethod) => {
    trackShareProfile(profileId, profileType, location, method);
  };

  return (
    <div>
      {about && <RenderEditorContent html={about} />}

      <div>
        <PhonePicker
          phone={telephone || whatsappPhone}
          className="my-6"
          onClick={handlePhoneClick}
        />
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

      {/* Share section */}
      <div className="mt-6 flex flex-row items-center gap-2">
        <h3 className="font-bold text-lg text-primary">Share:</h3>
        <div className="flex items-center gap-3 mt-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleShare("facebook")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-label="Share on Facebook Messenger"
          >
            <svg
              fill="#fe0032"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#fe0032"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="m12 0c-6.627 0-12 4.974-12 11.111.035 3.55 1.774 6.686 4.438 8.633l.031.021v4.235l4.088-2.242c1.031.295 2.215.464 3.439.464h.004c6.627 0 12-4.975 12-11.11s-5.373-11.112-12-11.112zm1.191 14.963-3.055-3.263-5.963 3.26 6.559-6.96 3.131 3.259 5.889-3.259z"></path>
              </g>
            </svg>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(profileUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleShare("whatsapp")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
            aria-label="Share on WhatsApp"
          >
            <svg
              fill="#fe0032"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              stroke="#fe0032"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z"></path>
                <path d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z"></path>
              </g>
            </svg>
          </a>
        </div>
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
              href={buildListingHref("/girls", { practice: category })}
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
