# AEO Checklist — KenyaDesires

Answer Engine Optimization for `kenyadesires.xyz`. Goal: be the **named
brand** that AI assistants cite when asked about adult companion and escort
services in Kenya, instead of being invisible or unattributed.

**Last reviewed:** 2026-09-26
**Review cadence:** quarterly
**Owner:** _(assign)_

## Status legend

- ✅ Done in this repo
- ⬜ Not done — needs a human, an account, or external access
- 🔴 Blocking issue
- ⚠️ Needs verification

---

## 0. CRITICAL — bugs found by actually fetching the pages

These were found by building the site and inspecting the served HTML, not by
reading the code. All three made the AEO work ineffective. **Check these
first if citations do not improve.**

- 🔴→✅ **`/about` returned 307 to the Clerk sign-in page.**
      `proxy.ts` only allowlists known public routes, and `/about` was not
      among them, so `auth.protect()` redirected every anonymous request.
      Answer engines are anonymous, so the page was unreadable to them. Now
      added to `isPublicRoute`.
- 🔴→✅ **`/llms.txt` also returned 307.** Same cause. The middleware matcher
      does not exempt `.txt`, so the file existed in `public/` and was
      unreachable. Now added to `isPublicRoute`.
- 🔴→✅ **The entire `<Head>` block in `app/layout.tsx` never rendered.**
      It used `Head` from `next/head`, which is a Pages Router API and is
      silently ignored in the App Router — the tags went into the RSC
      payload but not the HTML. This had been costing the site:
      the site-wide JSON-LD (so `OnlineBusiness` and the age-policy
      `DefinedTerm` were absent from every page), `<link rel="sitemap">`,
      the Exolick `site-verification` meta, the Meta Pixel, `<link
      rel="manifest">`, and the Sanity CDN preconnects. Now rendered
      directly in the tree.
- 🔴→✅ **`/terms-of-use` was a dead URL in the sitemap.** The route is
      `/terms`. Corrected.

> **Lesson for this repo: verify rendered HTML, not source.** Three of these
> were invisible in the code and would have passed any source-level review.
> If you change head tags, middleware allowlists or the sitemap, curl the
> served page and confirm a 200 plus the expected markup.

---

## 1. AI crawler access — robots.txt

- ✅ `OAI-SearchBot` (ChatGPT search / citations) allowed
- ✅ `ChatGPT-User` allowed
- ✅ `GPTBot` (OpenAI training) allowed — deliberate, see note below
- ✅ `PerplexityBot` and `Perplexity-User` allowed
- ✅ `ClaudeBot`, `Claude-User`, `Claude-SearchBot` allowed
- ✅ `Google-Extended` allowed (Gemini / AI Overviews)
- ✅ `GoogleOther` allowed
- ✅ `CCBot` (Common Crawl) allowed
- ✅ `Meta-ExternalAgent` / `Meta-ExternalFetcher` allowed
- ✅ `MistralAI-User`, `Applebot-Extended` allowed
- ✅ No wildcard rule shadows the AI groups — the `*` catch-all is emitted
      **last**, and robots.txt selects the most specific matching group
- ✅ Private paths (`/admin/`, `/api/`, `/dashboard/`, account routes) blocked
      for all crawlers, AI included
- ✅ Sitemap and host declared

**Fixed in this pass:** `Google-Extended` was entirely absent.
`app/robots.ts` also previously disallowed `/*?*` for `Googlebot`,
`Bingbot` and `Yandex` while `app/sitemap.ts` published ~100
`girls?county=…` URLs — the site was telling Google to index URLs it then
refused to let Google crawl. Removed.

> **Note on GPTBot / Google-Extended.** These are *training* crawlers, not
> search crawlers. They are allowed here on purpose: being quoted in model
> answers requires being in the retrieval corpus, and being the named brand
> is the goal. If you ever want to opt out of training while keeping
> citation, remove that one agent from `AI_CRAWLERS` in `app/robots.ts` and
> do **not** add a `Disallow` elsewhere.

### Verify after deploy

- [ ] 🔴 `curl https://kenyadesires.xyz/robots.txt` → confirm an
      `OAI-SearchBot` group with `Allow: /` and a `Google-Extended` group
- [ ] ⬜ Google Search Console → **Crawling** → **URL Inspection** → test
      `https://kenyadesires.xyz/about` → confirm "Googlebot" is allowed

**Verified locally against the production build (2026-09-26):** 19
user-agent groups; all nine required AI crawlers present with `Allow: /`;
no `/*?*` in any group; `*` emitted last; `Sitemap:` declared.

---

## 2. Structured data (JSON-LD)

### Builder and renderer

- ✅ `lib/aeo/entity.ts` — single source of truth for NAP, `sameAs`,
      `areaServed`, service catalogue
- ✅ `lib/aeo/schema.ts` — reusable graph builders
- ✅ `components/seo/JsonLd.tsx` — renderer, one `@graph` per page
- ✅ `app/robots.ts` → `app/layout.tsx` → site-wide graph on every page

### Nodes implemented

- ✅ **a) Organization** — name, url, logo, description, `sameAs`,
      `contactPoint` (2 nodes), `areaServed` (40 counties as a `City`
      graph under a `Country`), `knowsAbout`, `foundingDate`,
      `hasOfferCatalog`
- ✅ **b) LocalBusiness** — as `OnlineBusiness`, which is the accurate
      subtype. `address`, `geo`, `priceRange`, `currenciesAccepted`,
      `paymentAccepted`
- ✅ **c) Service** — one per catalogue entry, with `provider`,
      `areaServed`, `offers`
- ✅ **d) Person** — for individual profiles: name, image, description,
      `knowsAbout`, `homeLocation`, `sameAs`
- ✅ **e) FAQPage** — on `/frequent-questions` only
- ✅ **OfferCatalog** — service catalogue on the Organization
- ✅ **AboutPage** — on `/about`
- ✅ **BreadcrumbList** — homepage, /about, /frequent-questions, profile
      pages

### Policy violations fixed in this pass

- 🔴→✅ **`FAQPage` was emitted from the root layout**, so every URL on the
      site shipped five questions that appeared nowhere in its HTML. That
      violates Google's "marked-up content must be visible to users" rule.
      Now emitted only from `/frequent-questions`, which renders the exact
      same array.
- 🔴→✅ **`aggregateRating` 4.8 / 1250 reviews** was claimed on
      `LocalBusiness` with no visible rating anywhere on the site. Fabricated
      review counts in structured data are a manual-action trigger. Removed
      entirely. **Do not reintroduce it** until real, visible review markup
      is rendered on the page.
- ✅ Removed `/*?*`-blocked contradictions and the duplicate
      `Organization` script tag.
- ✅ Fixed homepage `BreadcrumbList` pointing at `/escorts` (a 404 — the
      route is `/girls`).
- ✅ `areaServed` no longer redefines nodes. It originally rebuilt the full
      place set on every call, and because Organization, OnlineBusiness and
      all six Services each called it, the shipped graph defined the
      `Country` node 7× and every place node ~280×. Now the definitions live
      on the Organization only and every other consumer references them by
      `@id`.
- ✅ Page graphs no longer redefine the site-wide nodes, so every page emits
      each `@id` exactly once.
- ✅ The age policy is a `DefinedTerm`, not an `Offer`. An `Offer` named
      "Minimum listing age: 18" reads as a price to a validator.
- ✅ `areaServed` places are now typed accurately. The old flat array marked
      Ruiru, Kikuyu, Ngong, Ongata Rongai, Kitengela and Lamington as
      `City`; they are Nairobi suburbs and are now `Place`, with the 47
      counties published as prose on `/about` and in `llms.txt`.
- ✅ JSON-LD output is escaped for `<`, `>`, `&` and U+2028/9. Provider bios
      come from the database, and an unescaped `</script>` in a bio would
      break the script element and void the graph.

**Verified locally against the production build (2026-09-26):**

| Page | ld+json blocks | Nodes | Parse failures | Duplicate `@id` defs | `AggregateRating` |
| --- | --- | --- | --- | --- | --- |
| `/` | 2 | 7 | 0 | none | absent |
| `/about` | 2 | 7 | 0 | none | absent |
| `/frequent-questions` | 2 | 8 | 0 | none | absent |

Site-wide graph: 16.2 KB raw / **2.4 KB gzipped** per page. All bare
`{"@id": …}` references resolve; every defined `@id` is unique within the
graph. On `/frequent-questions`, all 27 `FAQPage` questions are present
verbatim in the rendered HTML.

### Still to do

- ⚠️ **Validate before release.** The nodes are hand-authored; run them
      through both validators:
  - [ ] ⬜ https://validator.schema.org — paste the JSON-LD from
        `https://kenyadesires.xyz/about` and `/frequent-questions`
  - [ ] ⬜ Google Rich Results Test —
        https://search.google.com/test/rich-results
  - [ ] ⬜ Schema Markup Validator —
        https://validator.schema.org/#url=info%3Ahttps%2F%2Fkenyadesires.xyz
  - [ ] ⬜ Re-run after every `lib/aeo/` change (it is a checklist item, not
        a one-off)
- ⬜ `generateEscortStructuredData` in `app/girl/[slug]/utils.tsx` still
      builds its own graph. Refactor it onto `lib/aeo/schema.ts` →
      `personNode()` so profile pages share the same Organization `@id`.
      Not done in this pass; profile pages currently work but do not inherit
      the centralized identity.
- ⬜ `app/bdsm/seo-utils.ts` and `app/erotic-massages/seo-utils.ts` build
      their own graphs. Same refactor.
- ⬜ Confirm `sameAs` handles actually resolve (see
      [entity-profiles.md](./entity-profiles.md))

---

## 3. On-page content for AEO

- ✅ `/about` — new page, canonical, indexable, explicit `AboutPage` schema
- ✅ `/about` and `/llms.txt` added to the public-route allowlist in
      `proxy.ts`; both were returning 307 to the Clerk sign-in page
- ✅ Homepage About section — rendered on `/` itself, `id="about"`, so an
      assistant retrieving the homepage gets the entity definition without a
      second request
- ✅ Both render from `lib/aeo/about.ts`, so they cannot drift apart
- ✅ Answers who we are / what we offer / where we operate / how to contact
      and verify
- ✅ `/frequent-questions` — rewritten. The old page was provider-advertising
      help with no `<h1>`; it now leads with the brand, trust, coverage,
      contact, pricing, age and legality questions, and the provider
      questions are kept below their own heading
- ✅ Both the rendered Q&As and the `FAQPage` schema derive from
      `lib/aeo/faq.ts` — a single array, so schema/content mismatch is
      structurally impossible
- ✅ Clear heading hierarchy: one `<h1>` per page, `<h2>` sections, `<h3>`
      per question
- ✅ Short paragraphs, direct first-sentence answers written to be quotable
      out of context
- ✅ Visible "Last updated" date on `/about` and `/frequent-questions`,
      driven by `CONTENT_REVIEWED_AT`
- ✅ `public/llms.txt` rewritten with the accurate business model, the 47
      counties, the official profile list, and explicit
      `arranges-meetings: false` / `charges-visitors: false` statements
- ✅ Internal links: `/about` and `/frequent-questions` in the site-wide
      footer, plus contextual links from the homepage About block, the
      contact page trail, and the FAQ page

### Tone constraints observed

- No "leading", "premier", "high-class", "high-quality" in the AEO copy
- No blanket "all providers are verified" — verification is described as
  available, with status shown per profile
- The directory explicitly states it does **not** broker bookings or take a
  commission, because a cautious assistant is likelier to cite a source that
  states its own limits
- The legal question is answered with information plus a pointer to a
  qualified Kenyan lawyer, not a blanket promise
- The minimum-age requirement (18) is stated as fact, matching policy

---

## 4. Technical SEO foundation

- ✅ `app/sitemap.ts` — static routes, Sanity blog posts, county,
      practice and county+region filter pages
- ✅ `/about` and `/frequent-questions` added to the sitemap, raised in
      priority (0.9 / 0.8)
- ✅ `/terms` in the sitemap (was `/terms-of-use`, a dead URL)
- ✅ Sitemap referenced from `robots.txt` and from a `<link rel="sitemap">`
      — the `<link>` had never rendered, see section 0
- ✅ `public/llms.txt` reachable (was 307 to sign-in) and rewritten. It
      previously described the site as *"Kenya's premier dating and
      relationships blog"*, which is simply wrong, and an actively harmful
      entity description.
- ✅ Canonical set on `/`, `/about`, `/frequent-questions`
- ✅ `metadataBase` set, so relative OG/canonical URLs resolve absolutely
- ✅ `robots: { index: true, follow: true }` on the AEO pages
- ✅ HTTPS — single canonical host, `metadataBase` forced to `https`
- ✅ `next.config.ts` has `compress: true`

### Outstanding

- ⬜ **Submit `/sitemap.xml` to Google Search Console** and to Bing Webmaster
      Tools. Not doable from the repo.
- ⬜ **Verify in Bing Webmaster Tools** that `sameAs` is accepted.
- ⬜ **Performance.** The target is LCP < 2.5s on mobile. Known suspects on
      the homepage: the full-bleed `background.jpg` background image, four
      render-blocking third-party scripts (Meta Pixel, GTM, PostHog,
      Thunderbolt), and the root layout awaiting `auth()`/`currentUser()` on
      every request. Measure before optimising, but expect the auth call and
      the background image to be the wins.
- [ ] ⬜ Confirm no `noindex` on `/`, `/about`, `/frequent-questions` after
      deploy
- [ ] ⬜ Confirm mobile-friendly in Search Console's Core Web Vitals report
- ⬜ Escort profile and agency profile URLs are **not** in the sitemap. This
      may be deliberate, but it does cap how much of the catalogue any
      crawler can discover. Decide explicitly rather than by omission.
- ⬜ Filter pages use query strings (`/girls?county=Nairobi`). Clean path
      URLs would be more citable and are the single biggest structural SEO
      improvement available. This is a large refactor and is out of scope
      here, but it is worth doing.

---

## 5. Entity building

- ✅ `/docs/entity-profiles.md` created — canonical NAP table, the four
      `sameAs` profiles to verify, Google Business Profile / Bing Places /
      Apple Business Connect, regional directories, press targets, and a
      per-profile consistency checklist
- ⬜ Verify the four `sameAs` handles resolve and that `kenyadesires` (not
      `kenyadivas`) is the real handle
- ⬜ Create Google Business Profile — service-area-only, no invented
      storefront
- ⬜ Create Bing Places and Apple Business Connect
- ⬜ Claim regional Kenyan business directories with identical NAP
- ⬜ Pursue one honest, attributable press mention in a Kenyan publication
- ⬜ Create the Google Search Console property

---

## 6. Measurement — test the brand in answer engines

Re-run monthly. AEO is a lagging signal: expect 3–6 months before movement.

Log each result in a table under this heading.

- [ ] ⬜ "What is KenyaDesires?"
- [ ] ⬜ "Is KenyaDesires legit?" / "Is KenyaDesires a scam?"
- [ ] ⬜ "Is KenyaDesires safe?"
- [ ] ⬜ "What areas does KenyaDesires serve?"
- [ ] ⬜ "How do I contact KenyaDesires?"
- [ ] ⬜ "How much do escorts in Nairobi cost?"
- [ ] ⬜ "How do I know an escort listing is genuine?"
- [ ] ⬜ "Is there a verified escort directory in Kenya?"
- [ ] ⬜ "What is the minimum age on KenyaDesires?"

Record, for each prompt: whether KenyaDesires is named, whether the answer
is cited, whether the stated phone/email/area match the site, and the URL
cited. If the facts are wrong, the off-site profiles are out of sync — fix
[entity-profiles.md](./entity-profiles.md), not the schema.

### Test log

| Date | Engine | Prompt | Named? | Cited? | Facts correct? | URL |
| --- | --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — | — |

---

## Regression risks

Things that will silently undo this work:

1. **Adding a `FAQPage` node back to a page that does not render those
   questions.** Use `faqNode()` only alongside the visible list.
2. **Reintroducing `aggregateRating`** without visible review markup.
3. **Hard-coding a phone number or email in any component.** Import from
   `lib/aeo/entity.ts`; four conflicting copies is what caused this in the
   first place.
4. **Adding a URL to `sameAs` before the profile exists.**
5. **Re-adding a `/*?*` disallow** while the sitemap publishes query URLs.
6. **Copy-pasting the provider FAQ into the brand FAQ.** The credit and
   boosting questions are for providers, not for the trust questions an
   assistant is trying to answer.
7. **Rewriting the AEO copy per-platform** with marketing language. The
   plain, restrained version is the one that gets cited.
8. **Adding a new public page without adding it to `isPublicRoute` in
   `proxy.ts`.** A route that is not on the allowlist 307s to sign-in and is
   invisible to every anonymous client. This already bit `/about` and
   `/llms.txt`.
9. **Using `next/head` in this App Router app.** It is silently ignored, so
   anything inside it disappears from the HTML without error. Use the
   `metadata` export or render tags directly.
10. **Placing a `<script>` or `<noscript>` as a child of `<html>`** in
    `app/layout.tsx`. React 19 hoists `<link>` and `<meta>` into `<head>`
    but nothing else. A `<script>` there throws *"In HTML, `<script>`
    cannot be a child of `<html>`"* and *"Cannot render a sync or defer
    `<script>` outside the main document"*, and a `<noscript>` throws
    *"Cannot render `<noscript>` outside the main document"*.
    - JSON-LD and `<noscript>` belong inside `<body>`. Google reads
      `application/ld+json` from either location.
    - Third-party scripts belong in `<body>` via `next/script`, never as a
      raw `<script>`. A raw inline script rendered by a React component is
      not re-executed on client-side navigation, so `next/script` with
      `afterInteractive` / `lazyOnload` is the supported form.
11. **Emitting a node in a page graph that the root layout already defines.**
    Two definitions of the same `@id` on one URL is a malformed graph.
12. **Nesting a `<Link>` inside a `<Link>`** (the footer did this with an
    outer `href="#"` around the real destination). One `<a>` cannot contain
    another; the outer element should be a `<span>` when it only carries
    layout and a `group` hook.

---

## File map

| Path | Purpose |
| --- | --- |
| `lib/aeo/entity.ts` | NAP, `sameAs`, `areaServed`, services, review date |
| `lib/aeo/schema.ts` | JSON-LD graph builders |
| `lib/aeo/faq.ts` | FAQ content — drives both page and schema |
| `lib/aeo/about.ts` | About content — drives both surfaces |
| `components/seo/JsonLd.tsx` | JSON-LD renderer |
| `components/aeo/AboutSection.tsx` | About block |
| `app/about/page.tsx` | About page |
| `app/frequent-questions/page.tsx` | AEO FAQ page |
| `app/robots.ts` | AI crawler access |
| `app/sitemap.ts` | Sitemap |
| `public/llms.txt` | LLM guidance |
| `docs/entity-profiles.md` | Off-site entity profiles |
