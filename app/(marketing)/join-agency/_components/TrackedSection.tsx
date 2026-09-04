"use client";

import { useTrackOnView } from "./useTrackOnView";
import { AGENCY_EVENTS } from "../constants";
import React from "react";

export default function TrackedSection({
  children,
  events = [AGENCY_EVENTS.LANDING_VIEW],
}: {
  children: React.ReactNode;
  events?: string[];
}) {
  const ref = useTrackOnView(events);
  return <div ref={ref}>{children}</div>;
}
