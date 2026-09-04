"use client";

import { useTrackOnView } from "./useTrackOnView";
import { PROVIDER_EVENTS } from "../constants";
import React from "react";

export default function TrackedSection({
  children,
  events = [PROVIDER_EVENTS.WELCOME_OFFER_VIEW],
}: {
  children: React.ReactNode;
  events?: string[];
}) {
  const ref = useTrackOnView(events);
  return <div ref={ref}>{children}</div>;
}
