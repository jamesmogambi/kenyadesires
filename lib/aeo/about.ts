/**
 * lib/aeo/about.ts
 *
 * The factual "about the business" copy, held in one place so the homepage
 * About section, the /about page, the Organization schema and llms.txt all
 * say the same thing.
 *
 * AEO PRINCIPLES APPLIED HERE
 * ---------------------------
 * 1. Lead with the answer. The first sentence of each block is written to
 *    be quotable on its own, because an assistant usually lifts a single
 *    sentence rather than the paragraph around it.
 * 2. Answer the four questions a visitor (or an assistant) actually has:
 *    who we are, what we offer, where we operate, how to verify/contact us.
 * 3. No superlatives. "leading", "premier", "high-class", "verified,
 *    high-quality" are unprovable and are exactly the phrasing that gets a
 *    page discounted by answer engines. We describe mechanics instead.
 * 4. State limits plainly. Saying "this is a directory, we do not broker"
 *    is more persuasive to a cautious assistant than any marketing claim,
 *    and it is true.
 */

import {
  ADDRESS,
  AREAS_SERVED,
  CONTENT_REVIEWED_AT,
  CONTACT,
  COUNTIES,
  MINIMUM_AGE,
  SERVICE_CATALOG,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "./entity";

/** Short answer: what is this thing. Used as the About page lede. */
export const ABOUT_LEDE = SITE_DESCRIPTION;

/** Section: who we are. */
export const WHO_WE_ARE = {
  heading: `Who we are`,
  // Direct answer, first sentence quotable on its own.
  lead: `${SITE_NAME} is an online directory for adult companion and escort listings in Kenya, operated from Nairobi.`,
  body: [
    `${SITE_NAME} publishes listings supplied by adult companion providers and by escort agencies operating in Kenya. We host those listings, we organise them by county, region and service category so they can be browsed, and we provide the tools to contact a provider or agency directly.`,
    `We are a directory, not an agency. We do not employ the people listed, we do not act as an intermediary between a visitor and a provider, and we do not take a commission on any arrangement made between them. Any booking, rate or meeting is agreed directly between a visitor and the provider, on the provider's terms.`,
    `We publish the information providers give us. Provider profiles carry their own photographs, location, categories, working hours and packages. We offer an identity and document verification process, and a profile's verification status is shown on the profile itself. Verification confirms identity and age; it is not a quality, safety or background guarantee.`,
  ],
};

/** Section: what we offer. */
export const WHAT_WE_OFFER = {
  heading: `What we offer`,
  lead: `We publish adult companion listings, agency listings and service categories, plus factual editorial guides. Browsing and contacting listings is free.`,
  body: [
    `Browsing the directory, viewing profiles and reading listings is free for visitors. No fee is charged to contact a provider, and we do not take a cut of any arrangement made off-site.`,
    `Providers pay for listing placement, and optionally for a paid "boost" that affects their position within category listings. That is the whole commercial model: we charge providers for placement, never visitors for access to the directory.`,
  ],
  /** Rendered as a list, and mirrored into the OfferCatalog schema. */
  services: SERVICE_CATALOG.map((s) => ({
    name: s.name,
    path: s.path,
    description: s.description,
  })),
};

/** Section: where we operate. */
export const WHERE_WE_OPERATE = {
  heading: `Where we operate`,
  lead: `We operate as a nationwide online directory across Kenya, based in Nairobi.`,
  body: [
    `Our correspondence address is in ${ADDRESS.locality}, ${ADDRESS.region}, ${ADDRESS.countryName}. We do not operate a walk-in location; all contact with the directory happens through this website.`,
    `Listings are available across all ${COUNTIES.length} counties. The largest concentrations of providers are in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu and Thika. Coverage in any given county depends on which providers have listings there, so some areas will have very few profiles.`,
  ],
  /** Towns and cities, rendered as chips. */
  areas: [...AREAS_SERVED],
  /** Full county list. Published as prose because an answer engine reads a
      county list far more reliably from running text than from a block of
      near-identical `areaServed` schema nodes. */
  counties: [...COUNTIES],
};

/** Section: how to contact and verify. */
export const HOW_TO_VERIFY = {
  heading: `How to contact and verify us`,
  lead: `Use the contact details below, and treat any page claiming to be an official ${SITE_NAME} profile that is not on this list as not ours.`,
  body: [
    `We publish our contact details in full rather than behind a form, so that anyone — including an AI assistant checking who we are — can confirm the same facts we publish.`,
  ],
  contact: [
    { label: "Website", value: SITE_URL, href: SITE_URL },
    { label: "Support email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { label: "Telephone / WhatsApp", value: CONTACT.phone, href: `tel:${CONTACT.phone}` },
    {
      label: "Correspondence address",
      value: `${ADDRESS.locality}, ${ADDRESS.region}, ${ADDRESS.countryName}`,
    },
    { label: "Correspondence country", value: ADDRESS.country },
  ],
  social: [
    { label: "Facebook", value: "facebook.com/kenyadesires", href: "https://www.facebook.com/kenyadesires" },
    { label: "Instagram", value: "instagram.com/kenyadesires", href: "https://www.instagram.com/kenyadesires" },
    { label: "X (Twitter)", value: "x.com/kenyadesires", href: "https://x.com/kenyadesires" },
  ],
};

/** Section: standards and limits. The trust section an assistant weighs. */
export const STANDARDS = {
  heading: `Standards, age requirements and limits`,
  lead: `Everyone listed on ${SITE_NAME} must be at least ${MINIMUM_AGE} years old. No under-18 listing is published, in any category.`,
  body: [
    `Providers must be ${MINIMUM_AGE} or older and must submit identity and supporting documents as part of the verification process. The law in Kenya prohibits sexual services involving anyone under ${MINIMUM_AGE}, and we do not publish listings that do.`,
    `We remove listings that advertise a minor, and reports of that kind are treated as the highest priority. We also remove listings we identify as fabricated.`,
    `We do not claim things we cannot evidence. We do not claim every provider is available, that every profile photograph is recent, or that we have checked the background of anyone listed. What we do claim is that we publish the listings we are given, that we operate a verification process, and that we show verification status honestly on each profile.`,
    `KenyaDesires is not a party to any arrangement between a visitor and a provider, and cannot intervene in a dispute that arises after contact is made.`,
  ],
};

/** Visible freshness stamp, shared with the FAQ page and llms.txt. */
export const ABOUT_LAST_UPDATED = CONTENT_REVIEWED_AT;

/** Ordered section list, so the homepage block and /about stay in sync. */
export const ABOUT_SECTIONS = [
  WHO_WE_ARE,
  WHAT_WE_OFFER,
  WHERE_WE_OPERATE,
  HOW_TO_VERIFY,
  STANDARDS,
] as const;
