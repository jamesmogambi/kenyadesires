"use client";

import { useProviderTracking } from "./Tracking";

export default function TrackingWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  useProviderTracking();
  return <>{children}</>;
}
