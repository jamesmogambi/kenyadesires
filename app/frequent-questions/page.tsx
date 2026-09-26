/**
 * app/frequent-questions/page.tsx
 *
 * The AEO FAQ page.
 *
 * CHANGED FROM THE PREVIOUS VERSION
 * --------------------------------
 * The old page was a provider-advertising help centre ("how do I buy
 * credits", "how do I hide my profile") with no <h1> and, critically, no
 * matching on-page FAQPage schema — while the root layout shipped FAQ
 * schema on every URL. So the site marked up questions its users could
 * never see, and never marked up the questions it did show.
 *
 * This version puts the brand, trust, coverage, contact, pricing and
 * compliance questions first, because those are what AI assistants are
 * actually asked about a directory in this category, and whether an
 * assistant can answer "is this legitimate" from our own words is what
 * decides if we get cited.
 *
 * The provider questions are kept below under their own heading, since
 * that audience still needs them.
 *
 * Both the visible list and the FAQPage schema render from
 * `lib/aeo/faq.ts`, so the two cannot drift out of sync.
 */

import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";

import JsonLd from "@/components/seo/JsonLd";
import FaqCard from "@/components/FaqCard";
import { ALL_FAQS, BRAND_FAQS, FAQ_LAST_UPDATED, PROVIDER_FAQS } from "@/lib/aeo/faq";
import { SITE_NAME, absoluteUrl } from "@/lib/aeo/entity";
import { NODE_IDS, breadcrumbNode, faqNode } from "@/lib/aeo/schema";

export const instant = false;

const PAGE_TITLE = `Frequently Asked Questions | ${SITE_NAME}`;

const PAGE_DESCRIPTION =
  "Answers to the questions people ask about KenyaDesires: is it a legitimate escort directory, which areas of Kenya it covers, how to contact a listing, what verification is done, and what it costs.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/frequent-questions"),
  },
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
    type: "article",
    url: absoluteUrl("/frequent-questions"),
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function FrequentlyQuestionsPage() {
  await connection();

  return (
    <>
      {/* Page-specific nodes only. The Organization is defined once in the
          root layout's site-wide graph and referenced by @id below. */}
      <JsonLd
        nodes={[
          faqNode(ALL_FAQS),
          {
            "@type": "WebPage",
            "@id": `${absoluteUrl("/frequent-questions")}#webpage`,
            url: absoluteUrl("/frequent-questions"),
            name: PAGE_TITLE,
            description: PAGE_DESCRIPTION,
            isPartOf: { "@id": NODE_IDS.website },
            about: { "@id": NODE_IDS.organization },
            inLanguage: "en-KE",
            dateModified: FAQ_LAST_UPDATED,
          },
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Frequently asked questions", path: "/frequent-questions" },
          ]),
        ]}
      />

      <article className="bg-white min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Frequently asked questions about {SITE_NAME}
          </h1>

          <p className="mt-3 text-lg text-slate-700">
            What {SITE_NAME} is, who it serves, how listings are verified, and
            how to get in touch. Short answers, with no claim on this page
            that the directory cannot evidence.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Last updated:{" "}
            <time dateTime={FAQ_LAST_UPDATED}>{FAQ_LAST_UPDATED}</time>
          </p>

          <nav aria-label="On this page" className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-xl font-semibold text-slate-900">
              About the directory
            </h2>
            <ul className="mt-3 space-y-1 text-slate-700">
              {BRAND_FAQS.map((faq) => (
                <li key={faq.question} className="text-sm">
                  <a
                    href={`#${slugify(faq.question)}`}
                    className="text-primary hover:underline"
                  >
                    {faq.question}
                  </a>
                </li>
              ))}
            </ul>

            <h2 className="mt-6 text-xl font-semibold text-slate-900">
              For providers and agencies
            </h2>
            <ul className="mt-3 space-y-1 text-slate-700">
              {PROVIDER_FAQS.map((faq) => (
                <li key={faq.question} className="text-sm">
                  <a
                    href={`#${slugify(faq.question)}`}
                    className="text-primary hover:underline"
                  >
                    {faq.question}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <h2
            id="about-the-directory"
            className="mt-12 text-2xl font-semibold text-slate-900"
          >
            About the directory
          </h2>
          <div className="mt-4">
            {BRAND_FAQS.map((faq) => (
              <div key={faq.question} id={slugify(faq.question)}>
                <FaqCard question={faq.question} answer={faq.answer} />
              </div>
            ))}
          </div>

          <h2
            id="for-providers"
            className="mt-12 text-2xl font-semibold text-slate-900"
          >
            For providers and agencies
          </h2>
          <p className="mt-2 text-slate-700">
            Questions about listing, advertising, credits and account
            management. If you are looking to list with us, start with{" "}
            <Link href="/join-provider" className="text-primary hover:underline">
              joining as a provider
            </Link>{" "}
            or{" "}
            <Link href="/join-agency" className="text-primary hover:underline">
              joining as an agency
            </Link>
            .
          </p>
          <div className="mt-4">
            {PROVIDER_FAQS.map((faq) => (
              <div key={faq.question} id={slugify(faq.question)}>
                <FaqCard question={faq.question} answer={faq.answer} />
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-slate-500">
            Still unanswered? The{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact page
            </Link>{" "}
            lists how to reach the directory, and the{" "}
            <Link href="/about" className="text-primary hover:underline">
              About page
            </Link>{" "}
            states the business details we publish officially.
          </p>
        </div>
      </article>
    </>
  );
}

/** URL-safe id from a question, for the on-page anchor links. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
