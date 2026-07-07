// app/components/GoogleAnalytics.tsx
"use client";

import Script from "next/script";
import { useConsent, shouldLoadAnalytics } from "@convective/gdpr-consent";

export function GoogleAnalytics() {
  const { isEU, consentStatus, isLoading } = useConsent();

  // Don't render anything while loading to avoid flickering
  if (isLoading) return null;

  // Only load the script if the user is not in the EU or has explicitly accepted
  if (!shouldLoadAnalytics(isEU, consentStatus)) return null;

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-XXXXXXXXXX');
        `}
      </Script>
    </>
  );
}
