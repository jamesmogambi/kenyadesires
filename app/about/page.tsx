/**
 * app/about/page.tsx
 *
 * The canonical About page for the business entity.
 *
 * This is the page answer engines will most often retrieve when asked who
 * KenyaDesires is, so it leads with a direct definition rather than
 * marketing, and it publishes the NAP data in plain text that matches the
 * JSON-LD exactly.
 *
 * Emits its own `@graph` (AboutPage + Organization + OfferCatalog), linked
 * to the site-wide graph by `@id`. It does NOT emit FAQPage — that belongs
 * on /frequent-questions, where the questions are actually visible.
 */

import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import AboutSection from "@/components/aeo/AboutSection";
import JsonLd from "@/components/seo/JsonLd";
import { ABOUT_LAST_UPDATED, ABOUT_LEDE } from "@/lib/aeo/about";
import { SITE_NAME, absoluteUrl } from "@/lib/aeo/entity";
import { aboutPageNode, breadcrumbNode } from "@/lib/aeo/schema";

// Cache Components opt-out, consistent with the other content routes.
export const instant = false;

export const metadata: Metadata = {
  title: `About ${SITE_NAME} — Adult Companion & Escort Directory in Kenya`,
  description:
    "KenyaDesires is an online directory for adult companion and escort listings in Kenya. Who we are, what we offer, where we operate, and how to contact or verify us.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  // An About page is one of the highest-value AEO assets on the site, so
  // it is explicitly indexable and is referenced as the site's about page.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "profile",
    url: absoluteUrl("/about"),
    title: `About ${SITE_NAME}`,
    description: ABOUT_LEDE,
  },
};

export default async function AboutPage() {
  await connection();

  // Page-specific nodes only. The Organization and OfferCatalog are defined
  // once in the root layout's site-wide graph and referenced by @id, so
  // redefining them here would duplicate the same @id on one URL.
  const graph = [
    aboutPageNode(),
    breadcrumbNode([
      { name: "Home", path: "/" },
      { name: "About", path: "/about" },
    ]),
  ];

  return (
    <>
      <JsonLd nodes={graph} />

      <article className="bg-white min-h-screen">
        <h1 className="sr-only">
          About {SITE_NAME}: adult companion and escort directory in Kenya
        </h1>

        <AboutSection />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="text-2xl font-semibold text-slate-900">
            Related pages
          </h2>
          <ul className="mt-3 space-y-2 text-slate-700">
            <li>
              <Link
                href="/frequent-questions"
                className="text-primary hover:underline"
              >
                Frequently asked questions about KenyaDesires
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-primary hover:underline">
                Contact KenyaDesires
              </Link>
            </li>
            <li>
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
              >
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-primary hover:underline">
                Terms of use
              </Link>
            </li>
          </ul>

          <p className="mt-10 text-sm text-slate-500">
            This page was last reviewed on{" "}
            <time dateTime={ABOUT_LAST_UPDATED}>{ABOUT_LAST_UPDATED}</time>. It
            is reviewed {`quarterly`}, or sooner if the directory's contact
            details, coverage or policies change.
          </p>
        </div>
      </article>
    </>
  );
}
