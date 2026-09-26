/**
 * lib/aeo/entity.ts
 *
 * SINGLE SOURCE OF TRUTH for everything that identifies the KenyaDesires
 * business entity: canonical URL, NAP data (name/address/phone), social
 * profiles, and the service areas we actually operate in.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Answer engines (ChatGPT, Perplexity, AI Overviews) build an entity
 * profile by cross-referencing the same facts across many sources. When a
 * site states a different phone number or social handle in different
 * places, that inconsistency reads as low-authority and the entity gets
 * cited less.
 *
 * Before this file the repo had four conflicting sets of contact data
 * spread across `app/config/structured-data.ts`, `app/girls/seo-utils.ts`,
 * `app/config/metadata.ts` and `public/llms.txt`. Everything now imports
 * from here.
 *
 * WHEN YOU CHANGE A VALUE HERE
 * -----------------------------
 * Update it here, then update the matching row in `docs/entity-profiles.md`
 * so the off-site profiles you control agree with the site.
 */

// ---------------------------------------------------------------------------
// Canonical identity
// ---------------------------------------------------------------------------

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://kenyadesires.xyz"
).replace(/\/$/, "");

export const SITE_NAME = "KenyaDesires";

/** Brand name as users actually type it into an AI tool. */
export const BRAND_ALIASES = [
  "Kenya Desires",
  "KenyaDesires",
  "kenya desires",
  "kenya desires escort directory",
  "kenyadesires.xyz",
];

/**
 * One-sentence, factual, non-promotional description of the business.
 *
 * This exact string is reused verbatim in Organization schema, LocalBusiness
 * schema, /about, the homepage About block, sitemap metadata and llms.txt.
 * Wording consistency across those surfaces is what makes the entity legible
 * to an answer engine.
 */
export const SITE_DESCRIPTION =
  "KenyaDesires is an online directory for adult companion and escort listings in Kenya. It publishes provider and agency profiles, photographs, locations and service categories, and connects visitors with listings directly. KenyaDesires is a directory, not a booking agency, and does not broker or arrange meetings itself.";

/** Shorter variant for meta descriptions and card layouts. */
export const SITE_DESCRIPTION_SHORT =
  "Online directory for adult companion and escort listings in Kenya, with provider profiles, photos, locations and service categories.";

// ---------------------------------------------------------------------------
// NAP — verify these before deploying
// ---------------------------------------------------------------------------
//
// TODO(owner): confirm the values below are the ones you actually want
// quoted by AI tools. The repo previously carried several different
// numbers, so these were consolidated here without a confirmed owner
// decision. Change them in ONE place and they propagate everywhere.

export const CONTACT = {
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254743129621",
  phoneE164: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254743129621",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@kenyadesires.xyz",
  emailSupport: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@kenyadesires.xyz",
  emailPrivacy: "privacy@kenyadesires.xyz",
} as const;

export const ADDRESS = {
  street: undefined as string | undefined, // no public street address on file
  locality: "Nairobi",
  region: "Nairobi",
  postalCode: undefined as string | undefined,
  country: "KE",
  countryName: "Kenya",
} as const;

/**
 * KenyaDesires is a nationwide online directory. The Nairobi locality
 * reflects the operating base / correspondence address, NOT a walk-in
 * location. Keep that distinction — claiming a LocalBusiness storefront
 * we cannot prove is exactly the kind of unverifiable claim that gets an
 * entity discounted by AI tools.
 */
export const GEO = {
  latitude: -1.286389,
  longitude: 36.817223,
} as const;

// ---------------------------------------------------------------------------
// Operating area
// ---------------------------------------------------------------------------

/** Country-level coverage, the primary claim. */
export const AREA_SERVED_COUNTRY = "Kenya";

/**
 * Kenya's 47 counties, which is the level at which listings are actually
 * filtered on the site.
 *
 * Published as prose on /about and in llms.txt rather than as 47 separate
 * `areaServed` nodes: an answer engine reads the county list far more
 * reliably from running text, and shipping 47 near-identical schema nodes
 * on every page bloats the graph for no citation benefit.
 */
export const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale",
  "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya",
  "Taita Taveta", "Tana River", "Tharaka Nithi", "Thika", "Trans Nzoia",
  "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
] as const;

/**
 * Cities and towns with meaningful listing volume, as
 * `schema.org/City` nodes. Deliberately a short, accurate list.
 *
 * An earlier version of this file used one flat array of 40 names and typed
 * every one as `City`. That was wrong: Ruiru, Kikuyu, Ngong, Ongata Rongai,
 * Kitengela and Lamington are Nairobi suburbs, not cities. Emitting a false
 * administrative type is exactly the kind of unverifiable claim that costs
 * an entity its credibility, so suburban areas are separated out below.
 */
export const CITIES = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Kiambu",
  "Malindi",
  "Kitale",
  "Nanyuki",
  "Naivasha",
  "Ukunda",
  "Watamu",
  "Voi",
  "Meru",
  "Nyeri",
  "Embu",
  "Kisii",
  "Kericho",
  "Bungoma",
  "Kakamega",
  "Garissa",
  "Isiolo",
  "Lamu",
  "Kajiado",
] as const;

/**
 * Nairobi areas with listing volume. Typed as `Place`, not `City`, because
 * that is what they are.
 */
export const NAIROBI_AREAS = [
  "Westlands",
  "Kilimani",
  "Parklands",
  "Lavington",
  "Glenmaris",
  "Laru",
  "Rongai",
  "Ruiru",
  "Kikuyu",
  "Ngong",
  "Ongata Rongai",
  "Kitengela",
  "Embakasi",
  "Ruaraka",
  "South B",
  "South C",
] as const;

/** Every place we have listings in, for prose and for the /about page. */
export const AREAS_SERVED = [
  ...CITIES,
  ...NAIROBI_AREAS,
] as const;

// ---------------------------------------------------------------------------
// Service catalogue
// ---------------------------------------------------------------------------

export const SERVICE_CATALOG = [
  {
    id: "companion-directory",
    name: "Adult companion and escort directory",
    path: "/girls",
    description:
      "A browsable, filterable directory of adult companion and escort profiles in Kenya, organised by county, region and service category, with photographs and profile details.",
  },
  {
    id: "agency-directory",
    name: "Escort agency listings",
    path: "/agencies",
    description:
      "A directory of escort agencies operating in Kenya, with agency profiles and the listings associated with each agency.",
  },
  {
    id: "erotic-massage",
    name: "Erotic massage listings",
    path: "/erotic-massages",
    description:
      "Listings for providers offering erotic and sensual massage services in Kenya.",
  },
  {
    id: "bdsm",
    name: "BDSM and fetish service listings",
    path: "/bdsm",
    description:
      "Listings for providers and agencies offering BDSM, fetish and roleplay services in Kenya.",
  },
  {
    id: "guides",
    name: "Editorial guides and articles",
    path: "/blog",
    description:
      "Factual articles and guides on adult companion services in Kenya, written for visitors and providers.",
  },
] as const;

// ---------------------------------------------------------------------------
// Off-site entity profiles (sameAs)
// ---------------------------------------------------------------------------
//
// TODO(owner): verify each of these resolves to a profile you control and
// that the handle matches. A sameAs URL that 404s is worse than no URL —
// it is a broken claim about your own identity.
// Track status in docs/entity-profiles.md.

export const SOCIAL_PROFILES = [
  "https://www.facebook.com/kenyadesires",
  "https://www.instagram.com/kenyadesires",
  "https://x.com/kenyadesires",
  "https://twitter.com/kenyadesires",
] as const;

// ---------------------------------------------------------------------------
// Editorial metadata
// ---------------------------------------------------------------------------

/**
 * Dates the AEO surface was last reviewed. Surfaced visibly on /about and
 * the FAQ page. Answer engines weight recency, and a visible, honest
 * freshness date is a signal we control.
 */
export const CONTENT_REVIEWED_AT = "2026-09-26";

/** How often the /about and /faq content is re-checked. */
export const CONTENT_REVIEW_CADENCE = "quarterly";

/** Minimum adult age across the platform, stated in machine-readable form. */
export const MINIMUM_AGE = 18;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Stable @id fragment for a served place. */
export function placeId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${SITE_URL}/#place-${slug}`;
}

/**
 * Full `areaServed` definitions: one `Country` node, one `City` node per
 * city, one `Place` node per Nairobi area.
 *
 * EMIT THIS EXACTLY ONCE PER GRAPH, on the Organization.
 *
 * An earlier version of this file built the whole set on every call, and
 * because Organization, OnlineBusiness and all six Services each call it,
 * the shipped graph ended up defining the Country node 7 times and every
 * City node roughly 280 times. A graph that redefines the same `@id` many
 * times is one Google discards, so the definitions now live here and every
 * other consumer references them by `@id` via `areaServedReferences()`.
 */
export function areaServedDefinitions() {
  const countryRef = { "@id": `${SITE_URL}/#country` };

  return [
    {
      "@type": "Country",
      "@id": `${SITE_URL}/#country`,
      name: AREA_SERVED_COUNTRY,
    },
    ...CITIES.map((name) => ({
      "@type": "City",
      "@id": placeId(name),
      name,
      containedInPlace: countryRef,
    })),
    ...NAIROBI_AREAS.map((name) => ({
      // Not "City" — these are sub-locations within Nairobi.
      "@type": "Place",
      "@id": placeId(name),
      name,
      containedInPlace: { "@id": placeId("Nairobi") },
    })),
  ];
}

/**
 * Bare `{"@id": ...}` references to the nodes defined by
 * `areaServedDefinitions()`. Use for every consumer other than the
 * Organization, so the definitions stay unique within the graph.
 */
export function areaServedReferences() {
  return [
    { "@id": `${SITE_URL}/#country` },
    ...CITIES.map((name) => ({ "@id": placeId(name) })),
    ...NAIROBI_AREAS.map((name) => ({ "@id": placeId(name) })),
  ];
}
