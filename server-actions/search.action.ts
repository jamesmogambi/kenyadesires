// app/actions/search.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cache } from "react";
import { convertQueryDocToEscort, Escort } from "./escort.action";

function hasCleanedImages(escort: Escort): boolean {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) return true;
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (meta: any) => meta.status === "completed" && meta.cleanedUrl,
  );
}

const SEARCH_FIELDS = [
  "name",
  "username",
  "about",
  "locations",
  "practices",
  "categories",
  "imagesMetadata",
  "previewPhoto",
  "images",
  "videos",
  "age",
  "county",
  "countyCode",
  "regions",
  "primaryRegion",
  "nationality",
  "rating",
  "totalViews",
  "totalBookings",
  "isActive",
  "isVerified",
  "isFeatured",
  "slug",
  "telephone",
  "whatsappPhone",
  "createdAt",
  "hasCleanedImages",
  "cleanedImages",
];

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

export const searchEscorts = cache(searchEscortsInternal);

async function searchEscortsInternal({
  query,
  limit = 20,
  page = 1,
  filters = {},
}: SearchEscortsOptions) {
  try {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));
    const searchTerm = query.trim().toLowerCase();

    let firestoreQuery: any = adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .where("hasCleanedImages", "==", true);

    if (filters.gender && filters.gender !== "all") {
      firestoreQuery = firestoreQuery.where("gender", "==", filters.gender);
    }

    if (
      filters.county &&
      filters.county !== "all" &&
      /^[0-9]+$/.test(filters.county)
    ) {
      firestoreQuery = firestoreQuery.where("county", "==", filters.county);
    }

    firestoreQuery = firestoreQuery.select(...SEARCH_FIELDS);
    firestoreQuery = firestoreQuery.orderBy("createdAt", "desc");

    const batchSize = Math.max(validLimit * 5, 200);
    let lastDoc: any = null;
    const allFiltered: Escort[] = [];
    let hasMore = false;

    while (allFiltered.length < validLimit) {
      let pageQuery = firestoreQuery;
      if (lastDoc) {
        pageQuery = pageQuery.startAfter(lastDoc);
      }

      const snapshot = await pageQuery.limit(batchSize).get();

      if (snapshot.empty) {
        break;
      }

      const docs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Escort[];
      let filtered = docs;

      if (searchTerm) {
        filtered = filtered.filter((escort: Escort) => {
          const name = escort.name || "";
          const username = escort.username || "";
          const about = escort.about || "";
          const locations = escort.locations || [];
          const practices = escort.practices || [];
          const categories = escort.categories || [];

          return (
            name.toLowerCase().includes(searchTerm) ||
            username.toLowerCase().includes(searchTerm) ||
            about.toLowerCase().includes(searchTerm) ||
            locations.some((loc: any) =>
              loc.town?.toLowerCase().includes(searchTerm),
            ) ||
            locations.some((loc: any) =>
              loc.estate?.toLowerCase().includes(searchTerm),
            ) ||
            practices.some((p: string) => p.toLowerCase().includes(searchTerm)) ||
            categories.some((c: string) => c.toLowerCase().includes(searchTerm))
          );
        });
      }

      if (filters.county && filters.county !== "all") {
        const countyLower = filters.county.toLowerCase();
        filtered = filtered.filter(
          (escort: Escort) =>
            escort.county?.toLowerCase() === countyLower ||
            escort.countyCode?.toLowerCase() === countyLower,
        );
      }

      if (filters.region && filters.region !== "all") {
        const regionLower = filters.region.toLowerCase();
        filtered = filtered.filter(
          (escort: Escort) =>
            escort.primaryRegion?.toLowerCase() === regionLower ||
            (escort.regions || []).some((r: string) =>
              r.toLowerCase() === regionLower,
            ),
        );
      }

      allFiltered.push(...filtered);
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      hasMore = snapshot.size === batchSize;

      if (!hasMore) {
        break;
      }
    }

    const total = allFiltered.length;
    const totalPages = Math.ceil(total / validLimit) || 1;
    const skip = (validPage - 1) * validLimit;
    const paginatedEscorts = allFiltered.slice(skip, skip + validLimit);

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
