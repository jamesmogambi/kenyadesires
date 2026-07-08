// app/actions/search.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { convertQueryDocToEscort, Escort } from "./escort.action";

// ─── Helper: Check if escort has at least one cleaned image ───────────────
function hasCleanedImages(escort: Escort): boolean {
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (meta: any) => meta.status === "completed" && meta.cleanedUrl,
  );
}

// ─── Search Interface ─────────────────────────────────────────────────────────
interface SearchEscortsOptions {
  query: string;
  limit?: number;
  page?: number;
  filters?: {
    county?: string;
    region?: string;
    gender?: string;
  };
}

// ─── Main Search Function ────────────────────────────────────────────────────
export async function searchEscorts({
  query,
  limit = 20,
  page = 1,
  filters = {},
}: SearchEscortsOptions) {
  try {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const searchTerm = query.trim().toLowerCase();

    // 1. Build Firestore query with basic filters
    let firestoreQuery: FirebaseFirestore.Query = adminDb
      .collection("escorts")
      .where("isActive", "==", true);

    if (filters.gender && filters.gender !== "all") {
      firestoreQuery = firestoreQuery.where("gender", "==", filters.gender);
    }

    // County filter – only if it's a numeric ID or code
    if (
      filters.county &&
      filters.county !== "all" &&
      /^[0-9]+$/.test(filters.county)
    ) {
      firestoreQuery = firestoreQuery.where("county", "==", filters.county);
    }

    // 2. Execute query – get ALL documents (no limit) because we need to filter in‑memory
    const snapshot = await firestoreQuery.get();

    // 3. Convert to Escort objects
    // convertQueryDocToEscort may be async, so resolve all promises before proceeding
    const escortPromises: Promise<Escort>[] = snapshot.docs.map((doc) =>
      Promise.resolve(convertQueryDocToEscort(doc)).then((escort) => {
        // If the converted escort already has an id, return it as-is to avoid duplicate 'id' fields.
        if ((escort as any)?.id) return escort as Escort;
        const { id: _unusedId, ...escortWithoutId } = escort as any;
        return { id: doc.id, ...escortWithoutId } as Escort;
      }),
    );

    let allEscorts: Escort[] = await Promise.all(escortPromises);

    // 4. Filter by cleaned images FIRST (early discard)
    allEscorts = allEscorts.filter(hasCleanedImages);

    // 5. Apply text search if provided
    if (searchTerm) {
      allEscorts = allEscorts.filter((escort) => {
        // Safely access fields with fallbacks
        const name = escort.name || "";
        const username = escort.username || "";
        const about = escort.about || "";
        const locations = escort.locations || [];
        const practices = escort.practices || [];
        const categories = escort.categories || [];

        const nameMatch = name.toLowerCase().includes(searchTerm);
        const usernameMatch = username.toLowerCase().includes(searchTerm);
        const aboutMatch = about.toLowerCase().includes(searchTerm);
        const townMatch = locations.some((loc) =>
          loc.town?.toLowerCase().includes(searchTerm),
        );
        const estateMatch = locations.some((loc) =>
          loc.estate?.toLowerCase().includes(searchTerm),
        );
        const practiceMatch = practices.some((p) =>
          p.toLowerCase().includes(searchTerm),
        );
        const categoryMatch = categories.some((c) =>
          c.toLowerCase().includes(searchTerm),
        );

        return (
          nameMatch ||
          usernameMatch ||
          aboutMatch ||
          townMatch ||
          estateMatch ||
          practiceMatch ||
          categoryMatch
        );
      });
    }

    // 6. Apply additional in‑memory filters (county, region) if not already applied by Firestore
    if (filters.county && filters.county !== "all") {
      const countyLower = filters.county.toLowerCase();
      allEscorts = allEscorts.filter(
        (escort) =>
          escort.county?.toLowerCase() === countyLower ||
          escort.countyCode?.toLowerCase() === countyLower,
      );
    }

    if (filters.region && filters.region !== "all") {
      const regionLower = filters.region.toLowerCase();
      allEscorts = allEscorts.filter(
        (escort) =>
          escort.primaryRegion?.toLowerCase() === regionLower ||
          (escort.regions || []).some((r) => r.toLowerCase() === regionLower),
      );
    }

    // 7. Paginate
    const total = allEscorts.length;
    const totalPages = Math.ceil(total / validLimit) || 1;
    const skip = (validPage - 1) * validLimit;
    const paginatedEscorts = allEscorts.slice(skip, skip + validLimit);

    // 8. Return serializable data
    return {
      success: true,
      data: {
        escorts: JSON.parse(JSON.stringify(paginatedEscorts)),
        pagination: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages,
          hasNextPage: validPage < totalPages,
          hasPreviousPage: validPage > 1,
        },
      },
    };
  } catch (error) {
    console.error("Search error:", error);
    return {
      success: false,
      error: "Failed to search escorts. Please try again later.",
    };
  }
}
