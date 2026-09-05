"use client";

import React from "react";

const UTM_FIELDS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "utm_source_platform",
] as const;

const FIRST_TOUCH_KEY = "kenyadesires_first_touch";
const SESSION_KEY = "kenyadesires_session_attribution";
const MAX_UTM_LENGTH = 200;

export type UTMValues = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  utm_source_platform?: string;
  landing_page?: string;
  first_touch_at?: string;
};

export function parseUTMParams(searchParams: URLSearchParams): Partial<UTMValues> {
  const result: Partial<UTMValues> = {};

  for (const field of UTM_FIELDS) {
    const value = searchParams.get(field);
    if (value && value.trim()) {
      result[field] = sanitizeUTMValue(value);
    }
  }

  return result;
}

export function sanitizeUTMValue(value: string): string {
  return value
    .trim()
    .replace(/<[^>]*>/g, "")
    .slice(0, MAX_UTM_LENGTH);
}

export function getFirstTouchAttribution(): UTMValues | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(FIRST_TOUCH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setFirstTouchAttribution(attribution: UTMValues): void {
  if (typeof window === "undefined") return;

  try {
    const existing = getFirstTouchAttribution();
    const hasExisting = existing && Object.values(existing).some((v) => v && v.trim());
    if (!hasExisting) {
      localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(attribution));
    }
  } catch {
    // localStorage unavailable
  }
}

export function getSessionAttribution(): UTMValues | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setSessionAttribution(attribution: UTMValues): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(attribution));
  } catch {
    // sessionStorage unavailable
  }
}

export function clearSessionAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

export function useAttribution(): UTMValues | null {
  const [attribution, setAttribution] = React.useState<UTMValues | null>(null);

  React.useEffect(() => {
    setAttribution(getFirstTouchAttribution());
  }, []);

  return attribution;
}
