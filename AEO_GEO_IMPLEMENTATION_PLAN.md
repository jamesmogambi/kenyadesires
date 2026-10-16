# AEO/GEO Implementation Plan - KenyaDesires

## Goal
Implement Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) without breaking existing UI/layout. Focus on making content machine-readable and citation-worthy for AI assistants/answer engines while preserving UX.

## Executive Summary
Current state: Next.js 15 App Router, SEO metadata exists, JSON-LD on some pages, sitemap includes static + dynamic routes, robots.txt exists. Gaps: FAQ structured data missing/fragmented, HowTo/BreadcrumbList inconsistencies, organization/entity JSON-LD, speakable schema, author/aggregateRating coverage, llms.txt, AI crawl hints, internal linking for entities, answer-first content blocks.

## Non-Breaking Principles
- Add <script type="application/ld+json"> only, never change CSS classes/layout/DOM structure
- Extend existing metadata (export const metadata) or generateMetadata; don't replace page shells
- Server components only for new AEO blocks if added; prefer JSON-LD
- Keep existing filters, components, URLs intact
- Validate with schema.org + Google Rich Results/Test-like checks

## Current Assessment (Audit)

### Metadata/SEO
- app/layout.tsx: has metadata base, title template, OpenGraph/Twitter - extend for AI discoverability
- Many listing/profile pages have generateMetadata
- robots.txt: check allow/ai bots? (need to review)
- sitemap.ts: comprehensive (counties, regions, combos, practices) - good

### Structured Data
- Need to inventory: Organization, Website, BreadcrumbList, ItemList, ProfilePage (escort profiles), FAQ, Service, AggregateRating, SpeakableSpecification, Article (blog), CollectionPage

### Content Gaps
- Answer blocks (concise Q+A) for "What is KenyaDesires?", "Is KenyaDesires legit?", location pages
- Entity definitions (Kenya escort directory, counties, regions)
- Clear heading hierarchy (H1/H2) - don't change if OK; ensure question headings
- Internal entity linking

## Implementation Plan (Phased, safe)

### Phase 1: Foundation (Low risk, JSON-LD)
1. **Organization + Website JSON-LD** (app/layout.tsx)
   - Add WebSite with SearchAction (if search exists: /search?q={search_term_string})
   - Add Organization (name, url, logo, sameAs if any, contactPoint)
   - Add Publisher/Brand as appropriate

2. **robots.txt review** (app/robots.ts or public/robots.txt)
   - Explicitly allow common AI user-agents? (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended) or rely on allow-all? Check current; don't block
   - Add Host: https://kenyadesires.xyz
   - Link to sitemap

3. **llms.txt** (public/llms.txt or app/llms.txt/route.ts)
   - Create concise listing of key pages (about, girls, agencies, blog, counties) + brief description
   - Plain markdown, no UI impact

### Phase 2: Entity & Location AEO (County/Region pages)
- Add BreadcrumbList JSON-LD to girls listing with filters (when county/region selected)
- Add CollectionPage with mainEntity (ItemList) for filtered listings
- Add FAQPage for location-specific FAQs if present (e.g. "Escorts in Nairobi?")
- Ensure H1 reflects "Escorts in {County}" etc; only if missing - don't rewrite

### Phase 3: Profile Pages (Escorts/Agencies)
- Add ProfilePage/Person + Service + AggregateRating (if ratings exist)
- Add BreadcrumbList
- Add SpeakableSpecification? (optional, use only if content has clear answer spans)
- Don't expose PII beyond what's public

### Phase 4: Blog AEO
- Article + BreadcrumbList + Organization reference
- FAQ in posts if Q+A blocks
- TableOfContents? UI change - NO, don't add UI; only JSON-LD if TOC exists

### Phase 5: GEO Enhancements
- Add "about" entity linking in JSON-LD
- Add sameAs if social links exist
- Consider "place" references for counties (optional)
- Add explicit datePublished/modified in Article JSON-LD where available

## Files to touch (minimal)
- app/layout.tsx: inject Organization/WebSite JSON-LD (script tag)
- app/robots.ts (if exists) or public/robots.txt
- public/llms.txt (new)
- Per page: app/girls/page.tsx, profile pages, blog/[slug]/page.tsx - add JSON-LD only
- app/sitemap.ts already solid - keep

## Validation
- Schema.org validator
- Google Rich Results Test concepts (not UI)
- Check no layout shifts, no CSS changes

## Next Steps
1. Create llms.txt
2. Add Organization+WebSite JSON-LD to layout
3. Add BreadcrumbList to key listing pages
4. Add FAQ JSON-LD where FAQs exist
5. Add Profile/Service JSON-LD to escort pages if not present

All changes are additive (JSON-LD + new static files). No UI modifications.
