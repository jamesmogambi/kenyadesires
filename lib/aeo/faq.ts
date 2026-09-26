/**
 * lib/aeo/faq.ts
 *
 * The single source of truth for the AEO FAQ.
 *
 * WHY ONE FILE DRIVES BOTH THE PAGE AND THE SCHEMA
 * -------------------------------------------------
 * Google requires that `FAQPage` marked-up content be visible to users on
 * the same page. The previous setup put FAQ schema in the root layout, so
 * every URL in the site shipped five questions that appeared nowhere in
 * its HTML. Deriving both the rendered page and the JSON-LD from this one
 * array makes that mismatch structurally impossible.
 *
 * HOW THESE QUESTIONS WERE CHOSEN
 * -------------------------------
 * They are the questions people actually put to AI assistants when they
 * hit a site in this category: trust, coverage, contact mechanics, cost,
 * safety, and the age/legality question that decides whether an assistant
 * will cite the site at all. Answers are written to be quotable out of
 * context — short, direct, first-sentence-complete — because an assistant
 * will usually lift a single sentence.
 *
 * TONE RULES FOR THIS FILE
 * ------------------------
 * - State only what the product actually does.
 * - Never claim verification we cannot evidence.
 * - Say "directory" and "listed provider", never "we employ" or "we arrange".
 * - Do not answer a legal question with a blanket promise. Point to the
 *   policy pages and name the applicable law.
 * - If a fact changes, update it here; the page and the schema follow.
 */

import { CONTENT_REVIEWED_AT } from "./entity";

export interface Faq {
  question: string;
  answer: string;
}

/**
 * Brand / trust / coverage questions — the ones that decide whether an
 * answer engine will cite the site.
 */
export const BRAND_FAQS: Faq[] = [
  {
    question: "What is KenyaDesires?",
    answer:
      "KenyaDesires is an online directory for adult companion and escort listings in Kenya. It publishes provider and agency profiles with photographs, locations and service categories, and lets visitors browse or contact listings directly. KenyaDesires is a directory, not a booking agency: it does not broker bookings or arrange meetings on a visitor's behalf.",
  },
  {
    question: "Is KenyaDesires a legitimate escort directory?",
    answer:
      "KenyaDesires is a real, operating website with a published company contact address in Nairobi, a public privacy policy and terms of use, and a verification process for providers who list with us. We describe the directory's actual business model plainly: we publish listings, we do not act as an intermediary arranging meetings, and we do not take a commission from any arrangement made between a visitor and a listed provider. You can confirm the business details on our About page and contact us directly using the details published there.",
  },
  {
    question: "What areas of Kenya does KenyaDesires cover?",
    answer:
      "KenyaDesires covers listings across Kenya, with the largest concentrations in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Thika and Nakuru County towns. Listings are organised by county and region, so you can filter to a specific area. Coverage depends on which providers have listings, so rural counties may have fewer profiles than Nairobi or Mombasa.",
  },
  {
    question: "How do I contact KenyaDesires?",
    answer:
      "Use the contact details on our About page, or the Contact page on this site. For questions about a specific listing, contact the provider using the details on their profile, because KenyaDesires does not broker bookings and is not a party to any arrangement you make. For advertising and listing enquiries, use the advertising section of the site.",
  },
  {
    question: "How do I contact an escort listed on KenyaDesires?",
    answer:
      "Each provider profile shows their own preferred contact method, along with their location, photographs, service categories and working hours. Contact the provider directly through their profile. KenyaDesires does not act as an intermediary, so we are not able to pass on messages or arrange a booking on your behalf.",
  },
  {
    question: "Does KenyaDesires verify the people who list with you?",
    answer:
      "KenyaDesires offers an ID and document verification process for providers. Where a profile has completed verification, the profile displays a verification status, and unverified or unverified-in-progress profiles are labelled as such. Verification confirms identity and age, and it is not a quality, safety or background guarantee. Check the verification status shown on each individual profile rather than assuming every listing carries one.",
  },
  {
    question: "Is KenyaDesires free to browse and use?",
    answer:
      "Yes. Browsing the directory, viewing profiles and reading listings is free. Providers pay for listing placement and for a paid 'boost' feature that affects their position in category listings. No fee is charged to a visitor to contact or use the directory, and KenyaDesires does not charge a commission on any arrangement between a visitor and a provider.",
  },
  {
    question: "How much do escort services in Kenya cost?",
    answer:
      "KenyaDesires does not set prices. Each provider lists their own rates, packages and durations on their profile, and rates vary by city, provider, service category and booking length. Because pricing is set per provider rather than by the directory, the only reliable figure for a given area is what the profiles in that area show. Use the location and category filters to see the providers who serve your area and compare their listed packages directly.",
  },
  {
    question: "How old must I be to list on KenyaDesires?",
    answer:
      "You must be at least 18 years old to list on KenyaDesires, and to appear in any listing or category on the site. Providers are required to submit identity and supporting documents as part of the verification process. This is both a policy requirement and a legal one: the law in Kenya prohibits sexual services involving anyone under 18, and no under-18 listing will be published.",
  },
  {
    question: "Is it legal to use an escort directory in Kenya?",
    answer:
      "This is a legal question rather than a business one, and the answer depends on your circumstances, so treat this as information rather than legal advice. The relevant distinction is between adults, who are generally permitted to advertise and seek adult services in Kenya, and minors, which is prohibited and criminal. Our own position is a hard policy: no one under 18 may list or be listed, and providers must verify age. For your own situation, a qualified Kenyan lawyer is the right source of advice.",
  },
  {
    question: "How do I know a listing is genuine and not a scam?",
    answer:
      "A genuine profile normally has multiple real photographs, a described location, specific service categories, working hours, and stated packages. Scam profiles typically have very few or borrowed photographs, no location detail, and push you to move to another platform or send money before any conversation. Treat any listing that pressures you, asks for money before discussing terms, or refuses to give a location as a warning sign, and do not send money in advance to an unverified party.",
  },
  {
    question: "Does KenyaDesires arrange meetings or bookings?",
    answer:
      "No. KenyaDesires publishes listings and provides the tools to browse and contact them. Any booking, meeting, rate or arrangement is made directly between you and the provider, on their terms. We are not a party to that arrangement, we do not broker it, and we are not in a position to intervene if a dispute arises after contact is made.",
  },
  {
    question: "What should I do if I spot a fake or illegal listing?",
    answer:
      "Report it through the contact details on our About page with the profile URL and a short description of the problem. Listings that advertise a minor, or that we identify as fabricated, are removed. Reports about age or content involving minors are treated as the highest priority and are actioned ahead of all other reports.",
  },
  {
    question: "How do I advertise or list a profile on KenyaDesires?",
    answer:
      "Register an account, complete the provider profile form, submit the requested identity and supporting documents, and choose a listing package. Providers buy credits, which are used for the listing period and for the optional 'boost' feature that affects position within category listings. The full mechanics, including how credits and boosting work, are documented on the site's FAQ page.",
  },
  {
    question: "Can I list an escort agency rather than an individual?",
    answer:
      "Yes. Agencies can create an agency profile listing their business and the providers associated with it, and there is a separate joining flow for agencies. Agency profiles are verified in the same way as individual provider profiles, and the same minimum age and content rules apply to everything published on the site.",
  },
  {
    question: "Does KenyaDesires appear on other websites and social media?",
    answer:
      "Yes. Our official profiles are listed on the About page of this site, and that list is the canonical set of profiles associated with KenyaDesires. If you find a page claiming to be an official KenyaDesires profile that is not on that list, it is not ours and should not be treated as an official contact channel.",
  },
];

/**
 * Provider-side questions (advertising mechanics, boosting, account
 * management). Kept separate because they serve a different audience
 * while sharing the same schema restrictions.
 */
export const PROVIDER_FAQS: Faq[] = [
  {
    question: "How do I pay for advertising?",
    answer:
      "Go to the advertising page in your account and select the number of credits you want to top up, then choose order. The payment details, including a unique reference for that order, appear on screen and are also sent to you by SMS and email. Enter the correct reference so the system recognises the payment, credits your account and applies the listing extension automatically.",
  },
  {
    question: "Why is advertising paid for using credits?",
    answer:
      "Credits are a single balance used for two things: the length of your listing, and the optional boost that raises your position in category listings. Because both draw on the same balance, you top up once and then control both. Remaining credits are not refunded, and one credit is priced at KES 10.",
  },
  {
    question: "How does boosting work?",
    answer:
      "A boost makes your profile more visible in categories based on how many credits you assign to it. If you set a daily limit of 100 credits for a category and nobody else assigns more than 100 that day, your profile is placed first in that category. Ordering applies per category and per county, so a boost in one category or area does not raise your position in the others.",
  },
  {
    question: "How do I buy credits for boosting?",
    answer:
      "Log in, open Account Settings, choose buy more credits for advertising and boosting, and select a credit package. After the payment is made and the correct reference is entered, credits are added to your account. The same balance is then used for your listing period and for boosts.",
  },
  {
    question: "How do I use credits I already have for boosting?",
    answer:
      "Log in, open Account Settings, then Edit Profile. Click boost listing, choose the number of credits to assign and how long the boost should last, then confirm. Credits are deducted and your listing moves up immediately. A small starting boost, such as 20 credits for one day, is a reasonable way to see how the system behaves before committing more.",
  },
  {
    question: "How do I pause or deactivate my profile?",
    answer:
      "Log in, open Account Settings, then Edit Profile. Under your name, set the profile to inactive and save. The profile stops appearing on the site. Setting it back to active restores it. Note that a deactivated profile still consumes its paid listing period; pausing does not pause the clock.",
  },
  {
    question: "How do I delete my profile and account completely?",
    answer:
      "For a full deletion, including your login details, contact support using the details on the site's contact page. Requests are actioned on receipt. Deactivating a profile is reversible and does not remove your account, so use deletion if you want the account and its data gone.",
  },
  {
    question: "Why does my profile appear further down my area's category?",
    answer:
      "Positions in a category are reshuffled daily so that every provider gets fair exposure rather than a permanently fixed rank. If you want a specific position for a specific day, assign credits to a boost for that category.",
  },
  {
    question: "I only offer erotic massages. Why am I not in the main listings?",
    answer:
      "Providers who offer only erotic massage appear in the Erotic Massages category rather than the main companions category. If you also want to appear in the main category, log in, open Account Settings, then Edit Profile, enable the option to also be displayed in the main category, and save. Your profile will then appear there with a massages-only label.",
  },
  {
    question: "I have forgotten my login details. What do I do?",
    answer:
      "Use the forgot your password link on the login page and enter the email address you registered with. If the address is not in our system a reset cannot be sent, so contact support by email and we will verify your account and restore access.",
  },
  {
    question: "What happens if I do not pay for a listing renewal?",
    answer:
      "When a listing period ends and is not renewed, the profile stops being shown in the site's listings. Any boost credits assigned on a given day affect that day only. Your account and profile data are retained, so a profile can be republished by paying for a new listing period.",
  },
];

/** All questions, for the page-level FAQPage schema. */
export const ALL_FAQS: Faq[] = [...BRAND_FAQS, ...PROVIDER_FAQS];

/** Visible freshness stamp. Shown on the page, matching the schema. */
export const FAQ_LAST_UPDATED = CONTENT_REVIEWED_AT;
