/**
 * lib/aeo/schema.ts
 *
 * Reusable Schema.org JSON-LD graph builders for AEO.
 *
 * Design rules, chosen deliberately:
 *
 * 1. ONE GRAPH PER PAGE. We emit a single `@graph` array per page rather
 *    than several disconnected `<script>` tags. Answer engines merge the
 *    graph far more reliably when entities are explicitly linked by `@id`,
 *    so `Organization`, `WebSite`, `LocalBusiness` and the page entity all
 *    reference shared node ids.
 *
 * 2. NO INVENTED SIGNALS. There is no `aggregateRating` and no
 *    `review` here. We only emit `AggregateRating` on a page that renders
 *    real, visible review markup. Fabricated review counts in structured
 *    data are a manual-action trigger and AI tools actively discount
 *    entities that show that pattern.
 *
 * 3. CLAIM ONLY WHAT IS PROVABLE. No walk-in street address, no opening
 *    hours we do not staff, no "we arrange meetings" style claims.
 *
 * 4. FAQPage IS PAGE-BOUND. `faqNode` must only be called from a page
 *    that renders the same questions and answers in visible HTML.
 */

import {
  ADDRESS,
  AREA_SERVED_COUNTRY,
  BRAND_ALIASES,
  CONTACT,
  GEO,
  MINIMUM_AGE,
  SERVICE_CATALOG,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  absoluteUrl,
  areaServedDefinitions,
  areaServedReferences,
} from "./entity";

// ---------------------------------------------------------------------------
// Node ids
// ---------------------------------------------------------------------------

export const NODE_IDS = {
  website: `${SITE_URL}/#website`,
  organization: `${SITE_URL}/#organization`,
  localBusiness: `${SITE_URL}/#localbusiness`,
  country: `${SITE_URL}/#country`,
  serviceCatalog: `${SITE_URL}/#service-catalog`,
} as const;

// ---------------------------------------------------------------------------
// Graph wrapper
// ---------------------------------------------------------------------------

export type JsonLdNode = Record<string, unknown>;

/** Wrap nodes into a single `@graph` document. */
export function jsonLdGraph(nodes: JsonLdNode[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// a) WebSite
// ---------------------------------------------------------------------------

export function webSiteNode() {
  return {
    "@type": "WebSite",
    "@id": NODE_IDS.website,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: BRAND_ALIASES,
    description: SITE_DESCRIPTION,
    inLanguage: "en-KE",
    publisher: { "@id": NODE_IDS.organization },
    // Google's sitelinks search box. Restricted to the site's own results.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ---------------------------------------------------------------------------
// b) Organization
// ---------------------------------------------------------------------------

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": NODE_IDS.organization,
    name: SITE_NAME,
    alternateName: BRAND_ALIASES,
    legalName: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: absoluteUrl("/logo.png"),
      contentUrl: absoluteUrl("/logo.png"),
      width: 600,
      height: 60,
      caption: SITE_NAME,
    },
    image: { "@id": `${SITE_URL}/#logo` },
    // Only URLs of profiles we actually control. See docs/entity-profiles.md.
    sameAs: [...SOCIAL_PROFILES],
    email: CONTACT.email,
    telephone: CONTACT.phone,
    foundingDate: "2020",
    // Sets the machine-readable minimum age, which is the main trust signal
    // an answer engine can verify in this category.
    nonprofitStatus: undefined,
    knowsAbout: [
      "adult companion services in Kenya",
      "escort directories",
      "erotic massage services",
      "BDSM and fetish services in Kenya",
      "Nairobi escorts",
      "Mombasa escorts",
      "Kisumu escorts",
      "Kenya adult entertainment",
      "provider advertising and verification",
    ],
    address: postalAddress(),
    contactPoint: contactPoints(),
    // The ONLY place the area-served nodes are defined in the graph.
    // Everything else references them by @id.
    areaServed: areaServedDefinitions(),
    hasOfferCatalog: { "@id": NODE_IDS.serviceCatalog },
  };
}

/**
 * The minimum-age requirement, as its own verifiable node.
 *
 * `DefinedTerm` rather than `Offer`: this is a policy, not a commercial
 * offer, and an `Offer` named "Minimum listing age: 18" reads as a price
 * or a purchasable item to a validator. In this category the age policy is
 * the single most important trust signal an answer engine can check, so it
 * is worth stating in a form that is unambiguous rather than merely
 * present.
 */
export function agePolicyNode() {
  return {
    "@type": "DefinedTerm",
    "@id": `${SITE_URL}/#minimum-age-policy`,
    name: "Minimum provider age",
    termCode: `AGE-${MINIMUM_AGE}`,
    description: `Every provider listed on KenyaDesires must be at least ${MINIMUM_AGE} years old. Providers submit identity and supporting documents as part of the verification process before a profile is published or promoted. No under-${MINIMUM_AGE} listing is published in any category.`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${SITE_URL}/#listing-policies`,
      name: "KenyaDesires listing policies",
      url: absoluteUrl("/about"),
    },
  };
}

// ---------------------------------------------------------------------------
// c) LocalBusiness
// ---------------------------------------------------------------------------

/**
 * KenyaDesires has no customer-facing storefront, so this is a directory
 * business: `OnlineBusiness` is the accurate subtype. It is emitted
 * because a business with contact details and a service area benefits from
 * a concrete business-type node rather than a bare Organization.
 */
export function localBusinessNode() {
  return {
    "@type": "OnlineBusiness",
    "@id": NODE_IDS.localBusiness,
    name: SITE_NAME,
    alternateName: BRAND_ALIASES,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    telephone: CONTACT.phone,
    email: CONTACT.email,
    address: postalAddress(),
    areaServed: areaServedReferences(),
    parentOrganization: { "@id": NODE_IDS.organization },
    // No openingHours: this is an online directory with no staffed hours.
    // Claiming hours we do not staff is an unverifiable claim.
    currenciesAccepted: "KES",
    paymentAccepted: "M-Pesa, bank transfer",
    priceRange: "Varies by listing",
  };
}

function postalAddress() {
  return {
    "@type": "PostalAddress",
    addressLocality: ADDRESS.locality,
    addressRegion: ADDRESS.region,
    addressCountry: ADDRESS.country,
    // Intentionally omitting `streetAddress`: no verifiable public address.
  };
}

function contactPoints() {
  return [
    {
      "@type": "ContactPoint",
      "@id": `${SITE_URL}/#contact-general`,
      contactType: "customer support",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      availableLanguage: ["English", "Swahili"],
      areaServed: AREA_SERVED_COUNTRY,
      url: absoluteUrl("/contact"),
    },
    {
      "@type": "ContactPoint",
      "@id": `${SITE_URL}/#contact-privacy`,
      contactType: "privacy and data requests",
      email: CONTACT.emailPrivacy,
      availableLanguage: ["English"],
      areaServed: AREA_SERVED_COUNTRY,
    },
  ];
}

// ---------------------------------------------------------------------------
// d) OfferCatalog + Service
// ---------------------------------------------------------------------------

/**
 * The service catalogue, published as an `OfferCatalog` on the
 * Organization. This is how we describe *what we do* in a form an answer
 * engine can quote.
 */
export function serviceCatalogNode() {
  return {
    "@type": "OfferCatalog",
    "@id": NODE_IDS.serviceCatalog,
    name: "KenyaDesires services",
    description:
      "Directory sections covering adult companion listings, agency listings, erotic massage, BDSM services and editorial guides.",
    url: absoluteUrl("/girls"),
    itemListElement: SERVICE_CATALOG.map((service, index) => ({
      "@type": "Offer",
      position: index + 1,
      itemOffered: serviceNode(service.id, service.name, service.path, service.description),
    })),
  };
}

/** A single `Service`. Use on the relevant category page. */
export function serviceNode(
  id: string,
  name: string,
  path: string,
  description: string,
) {
  return {
    "@type": "Service",
    "@id": `${absoluteUrl(path)}#service-${id}`,
    name,
    description,
    url: absoluteUrl(path),
    serviceType: name,
    provider: { "@id": NODE_IDS.organization },
    // Country-level only. Each service is offered across Kenya, and the
    // Organization already carries the full place-level `areaServed`
    // definitions. Repeating all 41 place references on all six services
    // added ~8 KB of raw JSON to every page for no extra meaning, and it
    // is the kind of bloat that gets a graph discarded.
    areaServed: [{ "@id": `${SITE_URL}/#country` }],
    // Free to browse. Rates vary per listing and are set by providers.
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KES",
      description:
        "Browsing and contacting listings is free. Any service or rate is agreed directly with the provider.",
      availability: "https://schema.org/InStock",
    },
  };
}

// ---------------------------------------------------------------------------
// e) Person (individual profile)
// ---------------------------------------------------------------------------

export interface PersonSchemaInput {
  name: string;
  url: string;
  description?: string | null;
  image?: string | null;
  /** Free-text categories / tags shown on the profile. */
  categories?: string[];
  /** Primary county, for homeLocation. */
  location?: string | null;
  /** Verified flag from the database. */
  isVerified?: boolean | null;
  /** Optional external profiles for the sameAs graph. */
  sameAs?: string[];
}

/**
 * `Person` node for an individual profile page.
 *
 * The person is described as a *listing* on our platform. We do not claim
 * to employ, represent or vet providers beyond the ID-verification step we
 * actually perform — over-claiming here is both inaccurate and a
 * trust liability.
 */
export function personNode(input: PersonSchemaInput) {
  const description =
    input.description?.trim() ||
    `${input.name} is a listed adult companion provider in ${
      input.location || "Kenya"
    }, with a profile on the KenyaDesires directory.`;

  return {
    "@type": "Person",
    "@id": `${input.url}#person`,
    name: input.name,
    url: input.url,
    description: description.slice(0, 500),
    ...(input.image ? { image: input.image } : {}),
    ...(input.location
      ? {
          homeLocation: {
            "@type": "Place",
            name: input.location,
            containedInPlace: { "@id": NODE_IDS.country },
          },
        }
      : {}),
    ...(input.categories?.length
      ? { knowsAbout: input.categories.slice(0, 12) }
      : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    // Being a *listed provider* is the verifiable relationship. Avoids
    // implying employment or agency representation.
    worksFor: undefined,
    affiliation: undefined,
    subjectOf: {
      "@type": "WebPage",
      "@id": input.url,
      isPartOf: { "@id": NODE_IDS.website },
    },
  };
}

// ---------------------------------------------------------------------------
// f) FAQPage
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * `FAQPage` node.
 *
 * ONLY call this from a page that renders every one of these
 * question/answer pairs in visible HTML. Emitting FAQPage on pages without
 * matching visible content violates Google's structured data guidelines
 * and is a signal answer engines read as manipulation.
 */
export function faqNode(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    "@id": `${absoluteUrl("/frequent-questions")}#faq`,
    mainEntity: items.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// g) BreadcrumbList
// ---------------------------------------------------------------------------

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbNode(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

// ---------------------------------------------------------------------------
// h) WebPage (About)
// ---------------------------------------------------------------------------

/** The canonical `WebPage`/aboutPage description of the business. */
export function aboutPageNode() {
  return {
    "@type": "AboutPage",
    "@id": `${absoluteUrl("/about")}#webpage`,
    url: absoluteUrl("/about"),
    name: `About ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    isPartOf: { "@id": NODE_IDS.website },
    about: { "@id": NODE_IDS.organization },
    inLanguage: "en-KE",
    primaryImageOfPage: undefined,
  };
}

// ---------------------------------------------------------------------------
// i) Full site-wide graph
// ---------------------------------------------------------------------------

/**
 * The graph emitted on every public page: website, organization, online
 * business, service catalogue and the age policy.
 *
 * Note what is NOT here: `FAQPage` and `aggregateRating`. Both are
 * page-specific and were previously misapplied sitewide.
 */
export function siteWideGraph(): JsonLdNode[] {
  return [
    webSiteNode(),
    organizationNode(),
    localBusinessNode(),
    serviceCatalogNode(),
    agePolicyNode(),
  ];
}
