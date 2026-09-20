"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React from "react";
import { usePostHog } from "posthog-js/react";

const PRESERVED_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "utm_source_platform",
  "ref",
];

interface PreserveParamsLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  trackEvent?: string;
  trackEventProperties?: Record<string, unknown>;
}

function PreserveParamsLink({
  href,
  children,
  trackEvent,
  trackEventProperties,
  ...props
}: PreserveParamsLinkProps) {
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
    if (trackEvent && posthog) {
      posthog.capture(trackEvent, trackEventProperties);
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
