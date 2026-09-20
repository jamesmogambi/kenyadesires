// app/layout.tsx
import type { Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "quill/dist/quill.core.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  getCachedLookupData,
  getCachedRegions,
  getCachedPopularCounties,
} from "@/lib/cache";
import LocationInitializer from "@/components/FileInputInitializer";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import ScrollToTopBottom from "@/components/ScrollToTopBottom";
// import YouTargetsAd from "@/components/YouTargetsAd";
import Head from "next/head";
import { getAllCounties } from "@/server-actions/region.action";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getEscortByClerkUserId } from "@/server-actions/girl.action";
import { getAgencyByOwnerId } from "@/server-actions/agency.action";
import { headers } from "next/headers";
import { PostHogProvider } from "./PostHogProvider";
import { GoogleTagManager } from "@next/third-parties/google";
import AttributionCapture from "@/components/AttributionCapture";
import UtmCapture from "@/components/UtmCapture";

// ✅ Import metadata and structured data from separate files
import { metadata } from "./config/metadata";
import { structuredData, organizationSchema } from "./config/structured-data";
import { getAllLookupData } from "@/server-actions/lookup.action";
import YouTargetsAd from "@/components/YouTargetsAd";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

// ✅ Export metadata so Next.js picks it up
export { metadata };


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();

  // This is the key for Firebase Hosting
  // The cloudfront-viewer-country header is set by Firebase Hosting's CDN
  const countryCode = headersList.get("cloudfront-viewer-country");

  // ✅ Fetch escort verification status for NavActions (show verify link or status)
  const { userId } = await auth();
  const user = await currentUser();
  const escortRole = user?.unsafeMetadata?.role as string | undefined;
  const isEscort = escortRole === "user";
  const isBusiness = escortRole === "business";
  const escort =
    isEscort && userId ? await getEscortByClerkUserId(userId) : null;
  const agency = isBusiness && userId ? await getAgencyByOwnerId(userId) : null;

  // ✅ Pre-fetch on server
  const [counties, regions, lookup, allCounties] = await Promise.all([
    getCachedPopularCounties(),
    getCachedRegions(),
    // getCachedLookupData(),
    getAllLookupData(),
    getAllCounties(),
  ]);

  return (
    <ClerkProvider>
      <html lang="en-KE">
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        <Head>
          {/* Structured Data */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
          />
          {/* DNS Prefetching for Sanity CDN */}
          <link rel="dns-prefetch" href="https://cdn.sanity.io" />
          <link rel="preconnect" href="https://cdn.sanity.io" />
          <link
            rel="preconnect"
            href="https://cdn.sanity.io"
            crossOrigin="anonymous"
          />

          {/* Apple touch icon */}
          <link rel="apple-touch-icon" href="/icon" />

          <meta name="apple-mobile-web-app-title" content="KenyaDesires" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="black-translucent"
          />
          {/* Microsoft Tiles */}
          <meta name="msapplication-TileColor" content="#000000" />
          <meta name="msapplication-TileImage" content="/mstile-144x144.png" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          {/* Additional meta tags */}
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="application-name" content="KenyaDesires" />
          {/* Language and region */}
          <meta name="language" content="English" />
          <meta name="geo.country" content="KE" />
          <meta name="geo.region" content="KE-30" />
          {/* PWA Configuration */}
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#fe0032" />
          {/* RSS Feed */}
          <link
            rel="alternate"
            type="application/rss+xml"
            title="KenyaDesires - Latest Escorts"
            href="/rss.xml"
          />
          {/* Exolick site verification */}
          <meta
            name="6a97888e-site-verification"
            content="7076eebf366b5125e5462f1490d115bf"
          />
          {/* Sitemap */}
          <link
            rel="sitemap"
            type="application/xml"
            title="Sitemap"
            href="/sitemap.xml"
          />
          {/* Meta Pixel Code */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '1072230955456230');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1072230955456230&ev=PageView&noscript=1" />`,
            }}
          />
          {/* End Meta Pixel Code */}
          <script
            defer
            src="https://www.thunderbolt.com/gateway/api/v1/thunderbolt-ui/embed.js"
          />
        </Head>

        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased text-white bg-dark-slate min-h-screen flex flex-col`}
        >
          <AttributionCapture />
          <UtmCapture />
          <AgeVerificationModal />

          {/* Fixed Grayscale Background */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: -1,
              overflow: "hidden",
            }}
          >
            <Image
              src="/background.jpg"
              alt="KenyaDesires Background"
              fill
              priority
              quality={50}
              style={{
                objectFit: "cover",
                filter: "grayscale(100%)",
              }}
            />
          </div>

          <header>
            <Header
              initialCounties={counties.data}
              escortIsVerified={escort?.isVerified ?? false}
              escortVerificationStatus={
                ((escort as any)?.verificationStatus as string) || "not_started"
              }
              isEscort={isEscort}
              agencyIsVerified={agency?.isVerified ?? false}
              agencyVerificationStatus={
                (agency?.verificationStatus as string) || "not_started"
              }
            />
          </header>

          {/* Main Content */}
          <main className="bg-black/80 flex-1 py-4 w-full">
            <TooltipProvider>
              {/* {children} */}
              <PostHogProvider>{children}</PostHogProvider>
            </TooltipProvider>
            <LocationInitializer
              initialCounties={allCounties.data}
              initialRegions={regions.data}
              initialLookup={lookup.data}
            />

            {/* YouTargets Ad - 300x250 medium rectangle */}
            {/* <div className="flex justify-center">
              <YouTargetsAd />
            </div> */}
          </main>

          <div>
            <Footer />
          </div>

          <Toaster position="bottom-left" />

          <ScrollToTopBottom />
        </body>
      </html>
    </ClerkProvider>
  );
}
