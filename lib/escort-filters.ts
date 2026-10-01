/**
 * Shared SQL fragments for filtering escorts.
 *
 * Both listing paths — `getEscorts` (search) and `getEscortsWithCleanedImages`
 * (/girls and the other public listings) — compile their own WHERE clause, so the
 * matching semantics live here to keep them identical.
 *
 * ## Why JSON columns are matched with LIKE and not JSON_TABLE
 *
 * `JSON_TABLE` in a *correlated* subquery does not correlate on MySQL 8.0.46. The
 * same predicate written as a JOIN extracts 24,160 rows from `escorts`, but
 *
 *   EXISTS (SELECT 1 FROM JSON_TABLE(e.practices, '$[*]' COLUMNS (p VARCHAR(255) PATH '$')) AS jt
 *           WHERE LOWER(jt.p) LIKE '%bdsm%')
 *
 * matches nothing, without raising an error. Every service and region filter was
 * originally written that way, so those filters returned an empty result set rather
 * than failing loudly.
 *
 * `JSON_SEARCH` does evaluate, but it compares case-sensitively against JSON string
 * values here (`'%OWO%'` matches 742 rows, `'%owo%'` matches 0), which is too fragile
 * for user-supplied terms.
 *
 * Matching `LIKE` against the lowercased JSON text avoids both problems. `-` and `_`
 * fold to spaces so the stored slug `nairobi_kilimani` matches the display name
 * "Kilimani".
 *
 * Caveat: because this matches the serialised JSON, a term could in principle match
 * across an element boundary. That needs a term containing `","`, which is not a
 * realistic search input.
 */

/** Columns holding a service/practice list on an escort row. */
export const SERVICE_COLUMNS = ["practices", "bdsm", "massage", "extra_services"];

/** Columns a region or town term is matched against. */
export const REGION_COLUMNS = ["primary_region", "regions", "locations"];

/** Columns the free-text `q` term is matched against. */
export const SEARCHABLE_COLUMNS = [
  "name",
  "username",
  "about",
  "county",
  "county_code",
  "nationality",
  "primary_region",
  "regions",
  "locations",
];

/**
 * SQL that lowercases and reduces every run of non-alphanumeric characters
 * (`-`, `_`, spaces, parentheses, commas, `&`, `/`, emoji) to a single space.
 *
 * This is deliberately broader than folding only `-`/`_`. Real practice values in
 * `escorts.practices` carry punctuation — 57 of 99 distinct values do, e.g.
 * `"Erotic massage (incl. Nuru)"`, `"Anal/10k"`, `"CIM (Come in mouth)"` — and a
 * slugified URL cannot reproduce those characters. Normalising *both* the column
 * and the term is what makes `?practice=erotic-massage-incl-nuru` match the row
 * that stores `"Erotic massage (incl. Nuru)"`.
 *
 * Requires MySQL 8.0+ (`REGEXP_REPLACE`); the project targets 8.0.46.
 */
function foldExpr(sqlExpr: string): string {
  return `TRIM(REGEXP_REPLACE(LOWER(COALESCE(${sqlExpr}, '')), '[^a-z0-9]+', ' '))`;
}

/** `column LIKE $n`, case-insensitive, with punctuation and separators folded. */
export function normalizedJsonLike(
  column: string,
  placeholder: number,
  prefix = "",
): string {
  const qualified = `${prefix}${column}`;
  return `${foldExpr(qualified)} LIKE $${placeholder}`;
}

/**
 * Wraps a term for LIKE matching, folded with the same rule the column side uses.
 *
 * Folding the term too is what lets a slugified URL and the raw display name
 * select the same rows — without it the slug's hyphens would never match a
 * stored space.
 */
export function likeTerm(value: string): string {
  return `%${foldTerm(value)}%`;
}

/** Mirrors {@link foldExpr} in JS so params are pre-normalised. */
export function foldTerm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * `column = $n`, case-insensitive, folded on both sides.
 *
 * For the scalar columns where an exact match is correct (county, region,
 * business type) but the stored form disagrees with the URL form — `escorts.county`
 * holds `"Taita Taveta"` while the slug says `taita-taveta`, and `business_type` is
 * underscore-separated (`massage_parlor`) while the URL carries `massage-parlor`.
 */
export function normalizedEquals(
  column: string,
  placeholder: number,
  prefix = "",
): string {
  const qualified = `${prefix}${column}`;
  return `${foldExpr(qualified)} = ${foldExpr(`$${placeholder}`)}`;
}

interface BuiltCondition {
  clause: string;
  params: any[];
  nextIndex: number;
}

/**
 * `(col1 LIKE $n OR col2 LIKE $n ...)` — any of the columns may contain the term.
 */
export function buildAnyColumnCondition(
  columns: string[],
  term: string,
  paramIndex: number,
  prefix = "",
): BuiltCondition {
  const params: any[] = [];
  const clauses: string[] = [];

  for (const column of columns) {
    clauses.push(normalizedJsonLike(column, paramIndex, prefix));
    params.push(likeTerm(term));
    paramIndex++;
  }

  return {
    clause: `(${clauses.join(" OR ")})`,
    params,
    nextIndex: paramIndex,
  };
}
