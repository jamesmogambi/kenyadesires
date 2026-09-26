/**
 * components/aeo/AboutSection.tsx
 *
 * The business "About" block, rendered from `lib/aeo/about.ts`.
 *
 * Used twice: compactly on the homepage (h2 headings, collapsed detail)
 * and in full on /about (h1 + h2s). One source, so the two surfaces cannot
 * drift apart — a mismatch between the homepage and the About page is a
 * classic entity-confusion signal.
 *
 * AEO DETAIL: the answers are plain server-rendered HTML with no client
 * state, so an answer engine fetching the page sees the same text a human
 * does. The first sentence of every block is a complete, quotable answer.
 */

import Link from "next/link";
import {
  ABOUT_LAST_UPDATED,
  ABOUT_SECTIONS,
  HOW_TO_VERIFY,
  WHAT_WE_OFFER,
  WHERE_WE_OPERATE,
} from "@/lib/aeo/about";
import { SERVICE_CATALOG } from "@/lib/aeo/entity";

interface AboutSectionProps {
  /**
   * Heading level for the section titles. "h2" when embedded in a page
   * that has its own h1 (homepage, /about), "h3" when nested deeper.
   */
  headingLevel?: "h2" | "h3";
  className?: string;
}

export default function AboutSection({
  headingLevel: Heading = "h2",
  className = "",
}: AboutSectionProps) {
  const sections = ABOUT_SECTIONS;

  return (
    <section
      // id="about" gives the homepage block a stable, linkable anchor.
      id="about"
      aria-labelledby="about-heading"
      className={`w-full bg-white text-slate-800 py-12 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Heading
          id="about-heading"
          className="text-3xl font-bold text-slate-900"
        >
          About {`KenyaDesires`}
        </Heading>
        <p className="mt-2 text-sm text-slate-500">
          Last updated:{" "}
          <time dateTime={ABOUT_LAST_UPDATED}>{ABOUT_LAST_UPDATED}</time>
        </p>

        {sections.map((section) => (
          <div key={section.heading} className="mt-10">
            <Heading className="text-2xl font-semibold text-slate-900">
              {section.heading}
            </Heading>

            <p className="mt-3 text-lg font-medium text-slate-800">
              {section.lead}
            </p>

            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-slate-700">
                {paragraph}
              </p>
            ))}

            {/* Service list, mirroring the OfferCatalog schema exactly. */}
            {section === WHAT_WE_OFFER && (
              <ul className="mt-4 space-y-3">
                {SERVICE_CATALOG.map((service) => (
                  <li
                    key={service.id}
                    className="border-l-2 border-primary/40 pl-4"
                  >
                    <Link
                      href={service.path}
                      className="font-semibold text-primary hover:underline"
                    >
                      {service.name}
                    </Link>
                    <p className="text-slate-700">{service.description}</p>
                  </li>
                ))}
              </ul>
            )}

            {/* Operating area: towns and cities as chips, then the full
                county list as prose. */}
            {section === WHERE_WE_OPERATE && (
              <>
                <p className="mt-4 font-semibold text-slate-900">
                  Cities and towns with listings
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {WHERE_WE_OPERATE.areas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                    >
                      {area}
                    </li>
                  ))}
                </ul>

                <p className="mt-4 font-semibold text-slate-900">
                  Counties covered
                </p>
                <p className="mt-2 text-slate-700">
                  {WHERE_WE_OPERATE.counties.join(", ")}.
                </p>
              </>
            )}

            {/* NAP data in plain text, so the contact facts an answer
                engine extracts from the page match the JSON-LD. */}
            {section === HOW_TO_VERIFY && (
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Contact details
                  </h3>
                  <dl className="mt-2 space-y-2">
                    {HOW_TO_VERIFY.contact.map((item) => (
                      <div key={item.label}>
                        <dt className="text-sm text-slate-500">
                          {item.label}
                        </dt>
                        <dd className="text-slate-800">
                          {"href" in item && item.href ? (
                            <a
                              href={item.href}
                              className="text-primary hover:underline break-all"
                            >
                              {item.value}
                            </a>
                          ) : (
                            item.value
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Official profiles
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    This list is the canonical set of official{" "}
                    {`KenyaDesires`} profiles. Anything claiming to be an
                    official account that is not listed here is not ours.
                  </p>
                  <ul className="mt-2 space-y-1">
                    {HOW_TO_VERIFY.social.map((item) => (
                      <li key={item.label}>
                        <span className="text-sm text-slate-500">
                          {item.label}:{" "}
                        </span>
                        <a
                          href={item.href}
                          rel="me noopener"
                          target="_blank"
                          className="text-primary hover:underline break-all"
                        >
                          {item.value}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="mt-10 flex flex-wrap gap-4 border-t border-slate-200 pt-6">
          <Link
            href="/about"
            className="font-semibold text-primary hover:underline"
          >
            Read the full About page
          </Link>
          <Link
            href="/frequent-questions"
            className="font-semibold text-primary hover:underline"
          >
            Frequently asked questions
          </Link>
          <Link
            href="/contact"
            className="font-semibold text-primary hover:underline"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  );
}
