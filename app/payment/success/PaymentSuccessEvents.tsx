"use client";

import { useEffect } from "react";

/**
 * Fires the storage/Clerk refresh events so the rest of the app (credits
 * balance, packages, listing boost) picks up a completed payment.
 *
 * This must be a client effect: a raw <script> rendered inside a React
 * component is never executed during a client-side navigation, which is the
 * path a credit purchase takes (app/extend/AdvertisingPriceLIst.tsx redirects
 * here via router.push). The events would silently never fire.
 */
export default function PaymentSuccessEvents() {
  useEffect(() => {
    window.dispatchEvent(new Event("credits-updated"));
    window.dispatchEvent(new Event("packages-updated"));
  }, []);

  return null;
}
