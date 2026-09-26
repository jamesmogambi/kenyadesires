/**
 * app/config/structured-data.ts
 *
 * Compatibility layer. Historically this file held the site's entire
 * JSON-LD graph inline, which caused two problems:
 *
 * 1. It emitted a `FAQPage` node on every URL, including pages that show
 *    no FAQ. That violates Google's structured data policy (marked-up
 *    content must be visible to users) and is a manipulation signal that
 *    answer engines read negatively.
 *
 * 2. It emitted `aggregateRating` (4.8 / 1250 reviews) that no page
 *    actually displays, which is a manual-action trigger.
 *
 * The graph now lives in `lib/aeo/schema.ts` and the entity facts live in
 * `lib/aeo/entity.ts`. This file re-exports the old names so existing
 * imports keep working.
 *
 * Prefer importing from `@/lib/aeo/entity` and `@/lib/aeo/schema` directly.
 */

import { organizationNode, siteWideGraph } from "@/lib/aeo/schema";

/** Site-wide graph. No FAQPage, no aggregateRating. */
export const structuredData = {
  "@context": "https://schema.org",
  "@graph": siteWideGraph(),
};

/**
 * Standalone Organization node. Prefer `organizationNode()` inside a
 * `@graph` so the Organization can be referenced by `@id` from the
 * WebSite, LocalBusiness and OfferCatalog nodes.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  ...organizationNode(),
};
