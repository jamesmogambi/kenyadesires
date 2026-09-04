"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { usePostHog } from "posthog-js/react";
import { AGENCY_EVENTS, AGENCY_CTA_LOCATIONS } from "../constants";

const PRESERVED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
];

function PreserveParamsLink({
  href,
  children,
  trackEvent,
  ctaLocation,
  ...props
}: React.ComponentProps<typeof Link> & {
  trackEvent?: string;
  ctaLocation?: string;
}) {
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  const preservedHref = React.useMemo(() => {
    if (!href || typeof href !== "string") return href;
    const [path, hash] = href.split("#");
    const url = new URL(path || "/", typeof window !== "undefined" ? window.location.origin : "http://localhost");
    PRESERVED_PARAMS.forEach((key) => {
      const value = searchParams.get(key);
      if (value) {
        url.searchParams.set(key, value);
      }
    });
    const result = url.pathname + url.search;
    return hash ? `${result}#${hash}` : result;
  }, [href, searchParams]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const eventName = trackEvent || AGENCY_EVENTS.CTA_CLICK;
    if (posthog) {
      posthog.capture(eventName, {
        cta_location: ctaLocation,
        href,
        utm_source: searchParams.get("utm_source"),
        utm_medium: searchParams.get("utm_medium"),
        utm_campaign: searchParams.get("utm_campaign"),
        landing_page: "/join-agency",
      });
    }
    if (props.onClick) {
      (props.onClick as (e: React.MouseEvent<HTMLAnchorElement>) => void)(e);
    }
  };

  return (
    <Link href={preservedHref} {...props} onClick={handleClick}>
      {children}
    </Link>
  );
}

export default PreserveParamsLink;
