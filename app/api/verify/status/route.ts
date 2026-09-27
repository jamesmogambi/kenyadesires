import { connection, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { executeQuery } from "@/lib/neon";

/**
 * Statuses the verification UI in app/verify/done/page.tsx knows how to render.
 * The `escorts.verification_status` column stores a smaller vocabulary
 * ("pending" | "verified" | "rejected", plus "under_review" for agencies), so it
 * is normalised here rather than leaking through to the page.
 */
type UiStatus =
  | "not_found"
  | "pending_review"
  | "approved"
  | "declined"
  | "expired"
  | "unknown";

function toUiStatus(
  verificationStatus: string | null,
  isVerified: boolean,
  hasDocuments: boolean,
): UiStatus {
  // `is_verified` is authoritative: rows predating the verification_status
  // column are verified with a NULL status, so status alone would show
  // "Unknown" for already-approved profiles.
  if (isVerified) return "approved";

  switch ((verificationStatus || "").toLowerCase()) {
    case "verified":
    case "approved":
      return "approved";
    case "rejected":
    case "declined":
      return "declined";
    case "expired":
      return "expired";
    case "pending":
    case "under_review":
      return "pending_review";
    default:
      // No recognised status: fall back to whether documents were submitted so a
      // girl who just uploaded files sees "Under review" rather than "Unknown".
      return hasDocuments ? "pending_review" : "not_found";
  }
}

export async function GET() {
  // Request-time only: stops static generation from invoking this handler.
  await connection();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress || null;

    // `submitEscortVerification` takes an escortId, and profiles have been
    // created with the Clerk id or only an email, so try both the same way
    // app/adjustment/page.tsx does.
    //
    // Each `$n` must appear exactly once: executeQuery's `convertParams` rewrites
    // every `$n` to its own `?`, so repeating an index yields more placeholders
    // than values and mysql2 emits a bare `?` (a syntax error). A null email is
    // safe here without an `IS NOT NULL` guard because `email = NULL` is never
    // true.
    const rows: any[] = await executeQuery(
      `SELECT id, verification_status, is_verified, verification_documents, updated_at
       FROM escorts
       WHERE clerk_user_id = $1
          OR email = $2
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, email],
    );

    if (rows.length === 0) {
      return NextResponse.json({
        status: "not_found",
        decision: null,
        verifiedAt: null,
        updatedAt: null,
      });
    }

    const row = rows[0];
    const documents = row.verification_documents;
    const hasDocuments =
      !!documents &&
      (typeof documents === "string"
        ? documents !== "{}" && documents !== "null" && documents !== ""
        : Object.keys(documents).length > 0);

    const status = toUiStatus(
      row.verification_status ?? null,
      Boolean(row.is_verified),
      hasDocuments,
    );

    return NextResponse.json({
      status,
      decision: null,
      verifiedAt:
        status === "approved" && row.updated_at
          ? new Date(row.updated_at).toISOString()
          : null,
      updatedAt: row.updated_at
        ? new Date(row.updated_at).toISOString()
        : null,
    });
  } catch (error: any) {
    console.error("Error fetching verification status:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error?.message },
      { status: 500 },
    );
  }
}
