# Entity Profiles — KenyaDesires

Off-site profiles that establish the KenyaDesires entity for answer engines.
This is the list an AI assistant will use to confirm "is this a real
business with a footprint, or an anonymous site".

## How this list works

Answer engines build an entity by cross-referencing the same facts across
independent sources. A profile is only worth creating if it states the
**same name, the same contact details, and links back to the canonical
domain**. Profiles that disagree with the site actively harm you, so the
`sameAs` array in `lib/aeo/entity.ts` is kept minimal on purpose: only
profiles that genuinely exist and that we control are listed there.

**Adding a URL to `sameAs` before the profile exists is a liability.** A
`sameAs` pointing at a 404 is a broken claim about your own identity.
Create the profile first, then add the URL.

## Canonical values

Change these in `lib/aeo/entity.ts` only, then update this table.

| Field | Value | Source of truth |
| --- | --- | --- |
| Name | KenyaDesires | `lib/aeo/entity.ts` → `SITE_NAME` |
| Domain | kenyadesires.xyz | `NEXT_PUBLIC_SITE_URL` |
| Email | support@kenyadesires.xyz | `lib/aeo/entity.ts` → `CONTACT.email` |
| Phone | +254743129621 | `lib/aeo/entity.ts` → `CONTACT.phone` |
| Address | Nairobi, Nairobi, Kenya | `lib/aeo/entity.ts` → `ADDRESS` |
| Category | Online directory — adult companion & escort listings | `SERVICE_CATALOG` |

> **Action required before deploy.** The phone number and support email were
> consolidated from four conflicting sets in the codebase without a
> confirmed owner decision. Verify them, then set
> `NEXT_PUBLIC_CONTACT_PHONE` / `NEXT_PUBLIC_CONTACT_EMAIL` in the
> environment. See [aeo-checklist.md](./aeo-checklist.md).

## Required: profiles already referenced by `sameAs`

These four are currently in `SOCIAL_PROFILES`. **Verify each resolves to an
account you control**, and that the handle matches the canonical name.

| # | Platform | URL | Status | Verified on | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Facebook | https://www.facebook.com/kenyadesires | ⬜ Unverified | — | Confirm page exists and is not a placeholder. Facebook pages are heavily weighted in this market's entity graph. |
| 2 | Instagram | https://www.instagram.com/kenyadesires | ⬜ Unverified | — | Confirm handle. |
| 3 | X (Twitter) | https://x.com/kenyadesires | ⬜ Unverified | — | Confirm handle resolves. |
| 4 | X (Twitter, legacy) | https://twitter.com/kenyadesires | ⬜ Unverified | — | Legacy domain. Keep only if it redirects; drop it otherwise. |

> The repository previously advertised these handles as `kenyadivas` in
> `app/girls/seo-utils.ts`. If `kenyadivas` is the real brand handle and
> `kenyadesires` is not, this must be fixed before publishing — publishing
> the wrong `sameAs` is worse than publishing none.

## High value: business listings and directories

For a local/regional service business these are the citation sources AI
engines most often draw on. Create the profile, use the canonical NAP
values verbatim, and link to `https://kenyadesires.xyz`.

| # | Platform | URL | Category | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Google Business Profile | — | Local business | ⬜ Not created | Requires a verifiable physical or service-area business. Only claim it if you can actually substantiate it; a service-area-only listing with a Nairobi address is the honest option. Do **not** claim a storefront you cannot evidence. |
| 2 | Bing Places | — | Local business | ⬜ Not created | Imports from Google Business Profile, so do this second. |
| 3 | Apple Business Connect | — | Local business | ⬜ Not created | Feeds Apple Maps and Siri, which is the Apple Intelligence surface. |
| 4 | Yandex Business | — | Local business | ⬜ Not created | Low value here, but cheap. |
| 5 | Apple Podcasts / press | — | Press | ⬜ Not created | Lower priority. A single honest mention in a Kenyan news or culture piece does more for citation than ten directory listings. |

## Medium value: vertical and regional directories

Regional Kenyan directories and adult-industry directories, where the
listing can be factual and self-describing.

| # | Platform | Category | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Kenyan business directories (e.g. business listing aggregators) | Business | ⬜ Not created | Use the canonical NAP values exactly. |
| 2 | Nairobi service directories | Local service | ⬜ Not created | Only if the listing can be factual. |
| 3 | Kenyan tourism / lifestyle sites | Lifestyle | ⬜ Not created | Only if the directory can be described accurately. |
| 4 | Adult-industry directories | Adult | ⬜ Not created | Be selective. Off-site adult directories are frequently scraped and resold; being listed is not the same as being trusted. Verify the operator before listing. |

> **Do not** create listings on sites that require a keyword-stuffed title,
> a link exchange, or a paid "guaranteed top ranking" package. That is the
> black-hat territory this work is explicitly trying to avoid, and
> association with those networks degrades entity trust.

## Press and mentions

The strongest single signal for AEO citation is one honest, attributable
mention in a source an assistant can retrieve. Target:

- [ ] Kenyan mainstream news — a factual piece on the directory or on
      safety/legality of adult services in Kenya.
- [ ] Kenyan online publications that have covered escort directories
      before.
- [ ] Academic or NGO material on sex work in Kenya that can cite the
      directory as a source of provider-side information.
- [ ] A standing policy page for the minimum-age and verification rules,
      quotable by journalists.

## Consistency checklist

Before publishing any profile, confirm all of the following match the table
at the top of this file exactly. Inconsistency is the single most common
reason an entity fails to be cited.

- [ ] Business name spelled identically
- [ ] Domain spelled identically (`kenyadesires.xyz`, no `www` variance in
      the link, no `http://`)
- [ ] Phone in international format, same digits
- [ ] Email address identical
- [ ] Address identical, including whether a street address is claimed
- [ ] Description text matches `SITE_DESCRIPTION` in
      `lib/aeo/entity.ts` — do not rewrite it per-platform
- [ ] Profile links back to the canonical domain with a plain, non-tracked
      URL

## Maintenance

- [ ] Re-verify every profile URL resolves (quarterly, with the content
      review — see `CONTENT_REVIEW_CADENCE` in `lib/aeo/entity.ts`)
- [ ] Add any genuinely new official profile to `SOCIAL_PROFILES` **and**
      to the `sameAs` in `organizationNode()`
- [ ] Remove profiles we no longer control from `sameAs` — a stale claim
      is a liability
- [ ] Keep `/about` in sync with any NAP change made off-site
