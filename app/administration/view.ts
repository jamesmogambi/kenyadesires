/**
 * View resolution for the /administration dashboard.
 *
 * Kept out of page.tsx because it is pure, it is the part most likely to be
 * wrong (an unrecognised value must not silently pick a side), and it is the
 * only part of that page that can be tested without an authenticated session.
 */

/** The two account flavours this dashboard can be showing. */
export type AccountView = "provider" | "agency";

/**
 * Resolve `?type=` into a view, or `null` when absent or unrecognised.
 *
 * "escort" is accepted as an alias for "provider" because that is the word the
 * rest of the codebase uses (`getEscortByClerkUserId`, `/edit-profile/[id]`, the
 * `escorts` table), and links pasted from those pages should land on the right
 * tab. Note it normalises to "provider", so an `?type=escort` link still gets
 * rewritten to the canonical `?type=provider` by canonicalDashboardUrl.
 *
 * Anything unrecognised returns null rather than defaulting to one side: the
 * caller treats null as "no opinion" and falls back to the Clerk role, so a
 * typo in a shared URL resolves instead of showing the wrong dashboard.
 */
export function resolveView(
  raw: string | string[] | undefined,
): AccountView | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "provider" || normalized === "escort") return "provider";
  if (normalized === "agency") return "agency";
  return null;
}

/**
 * Build the canonical dashboard URL: the resolved view in `?type=`, with every
 * other incoming param carried over untouched.
 *
 * Rewriting the whole query (rather than appending `?type=`) is what keeps this
 * correct when the page is linked to with tracking params — `?utm_source=…` plus
 * `type` has to collapse into a single `?`, and concatenating strings is how you
 * end up with two. Repeated params are preserved as repeats.
 */
export function canonicalDashboardUrl(
  view: AccountView,
  incoming: Record<string, string | string[] | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(incoming)) {
    if (key === "type") continue;
    if (Array.isArray(value)) {
      for (const entry of value) search.append(key, entry);
    } else if (typeof value === "string") {
      search.set(key, value);
    }
  }
  search.set("type", view);
  return `/administration?${search.toString()}`;
}