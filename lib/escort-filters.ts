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

/** `column LIKE $n`, case-insensitive, with `-`/`_` folded to spaces. */
export function normalizedJsonLike(
  column: string,
  placeholder: number,
  prefix = "",
): string {
  const qualified = `${prefix}${column}`;
  return `REPLACE(REPLACE(LOWER(COALESCE(${qualified}, '')), '-', ' '), '_', ' ') LIKE $${placeholder}`;
}

/** Wraps a term for LIKE matching. */
export function likeTerm(value: string): string {
  return `%${value.toLowerCase().trim()}%`;
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
