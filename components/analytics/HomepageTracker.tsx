"use client";

import { useEffect } from "react";
import { trackViewHomepage } from "@/lib/customer-analytics";

export default function HomepageTracker() {
  useEffect(() => {
    trackViewHomepage();
  }, []);

  return null;
}