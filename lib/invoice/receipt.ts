/**
 * Receipt numbers.
 *
 * The number is derived from the transaction's own id rather than randomly
 * generated, which buys two things that a random value does not:
 *
 *   1. It is stable. A receipt number must never change for a given payment.
 *      Deriving it means a retry, a re-render, a second page load or a
 *      regenerated PDF all reproduce the same number without reading anything
 *      back from the database.
 *   2. It can be backfilled. Rows written before receipts existed have no
 *      stored value, and `receiptNumberFor()` derives one from the id at read
 *      time, so historical invoices become printable without a data migration.
 *
 * Nothing here is a secret and nothing here is a security token — it is a
 * human-facing reference for support and reconciliation, backed by the
 * transaction id that actually matters.
 */

const PREFIX = "RCP";

/**
 * Base-36 from a 32-bit FNV-1a hash of `seed`, in fixed-width uppercase.
 * `seed` is normally a transaction row id (a UUID), so the suffix is spread
 * evenly across the space and collisions are only possible between payments.
 */
function suffixFor(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    // hash *= 16777619, kept in 32-bit range without BigInt.
    hash = (hash + (hash << 1) + (hash << 7) + (hash << 8) + (hash << 24)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(7, "0").slice(-7);
}

function dateStamp(at: Date): string {
  const y = at.getFullYear();
  const m = String(at.getMonth() + 1).padStart(2, "0");
  const d = String(at.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * `RCP-20261003-K4F2P9Q`
 *
 * `seed` should be the transaction id so the number is reproducible.
 * `at` should be when the payment completed; it only sets the date segment.
 */
export function receiptNumberFor(seed: string, at: Date = new Date()): string {
  return `${PREFIX}-${dateStamp(at)}-${suffixFor(String(seed || ""))}`;
}