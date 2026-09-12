// app/actions/get-escorts.ts
"use server";

import { adminDb } from "@/lib/firebase-admin";
import { cache } from "react";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

const TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "joinedDate",
  "lastProcessedAt",
];

function convertDocToEscortFast(doc: any): Escort {
  const data = doc.data();
  const result: any = {
    id: doc.id,
    ...data,
  };

  const normalizeArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (val == null) return [];
    if (typeof val === "object") {
      const keys = Object.keys(val).sort((a, b) => {
        const an = parseInt(a), bn = parseInt(b);
        if (isNaN(an) && isNaN(bn)) return 0;
        if (isNaN(an)) return 1;
        if (isNaN(bn)) return -1;
        return an - bn;
      });
      return keys.map((k) => String(val[k]));
    }
    return [String(val)];
  };

  for (const field of [
    "regions", "practices", "bdsm", "massage", "extraServices",
      "categories", "images", "videos", "labels", "availability", "languages",
      "cleanedImages",
  ]) {
    if (!Array.isArray(result[field])) {
      result[field] = normalizeArray(result[field]);
    }
  }

  for (const field of TIMESTAMP_FIELDS) {
    if (result[field] && typeof result[field]?.toDate === "function") {
      result[field] = result[field].toDate().toISOString();
    }
  }

  return result as Escort;
}

function hasCleanedImages(escort: Escort): boolean {
  if (escort.cleanedImages && escort.cleanedImages.length > 0) return true;
  if (!escort.imagesMetadata) return false;
  return Object.values(escort.imagesMetadata).some(
    (metadata: any) => metadata.status === "completed" && (metadata.cleanedUrl || metadata.cloudinaryUrl),
  );
}

const LISTING_FIELDS = [
  "name",
  "username",
  "previewPhoto",
  "images",
  "videos",
  "imagesMetadata",
  "age",
  "county",
  "regions",
  "primaryRegion",
  "locations",
  "practices",
  "categories",
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

async function fetchSpecializedEscorts(
  params: GetEscortsParams,
  filterFn: (doc: Escort) => boolean,
): Promise<GetEscortsResponse> {
  const {
    page = 1,
    limit = 20,
    county,
    region,
    isActive = true,
    isVerified,
    isFeatured,
    sortBy = "createdAt",
    sortOrder = "desc",
    minAge,
    maxAge,
  } = params;

  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));

  let query: any = adminDb.collection("escorts");
  query = query.where("hasCleanedImages", "==", true);

  if (isActive !== undefined) {
    query = query.where("isActive", "==", isActive);
  }
  if (isVerified !== undefined) {
    query = query.where("isVerified", "==", isVerified);
  }
  if (isFeatured !== undefined) {
    query = query.where("isFeatured", "==", isFeatured);
  }
  if (county && county !== "all") {
    query = query.where("county", "==", county);
  }

  const validSortFields = [
    "createdAt",
    "updatedAt",
    "rating",
    "totalViews",
    "totalBookings",
  ];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
  query = query.orderBy(sortField, sortOrder);
  query = query.select(...LISTING_FIELDS);

  const batchSize = Math.max(validLimit * 5, 200);
  let lastDoc: any = null;
  const allFiltered: Escort[] = [];
  let hasMore = false;

  while (allFiltered.length < validLimit) {
    let pageQuery = query;
    if (lastDoc) {
      pageQuery = pageQuery.startAfter(lastDoc);
    }

    const snapshot = await pageQuery.limit(batchSize).get();

    if (snapshot.empty) {
      break;
    }

    const docs = snapshot.docs.map(convertDocToEscortFast);
    let filtered = docs;

    if (region && region !== "all") {
      filtered = filtered.filter((e: Escort) => e.regions?.includes(region));
    }

    filtered = filtered.filter(filterFn);

    if (minAge && minAge > 0) {
      filtered = filtered.filter(
        (e: Escort) => parseInt(e.age || "0") >= minAge,
      );
    }
    if (maxAge && maxAge > 0) {
      filtered = filtered.filter(
        (e: Escort) => parseInt(e.age || "0") <= maxAge,
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
  const startIndex = (validPage - 1) * validLimit;
  const endIndex = Math.min(startIndex + validLimit, total);
  const paginatedEscorts = allFiltered.slice(startIndex, endIndex);

  return {
    escorts: paginatedEscorts,
    total,
    page: validPage,
    totalPages: Math.max(1, Math.ceil(total / validLimit)),
    hasMore: endIndex < total || hasMore,
  };
}

// Helper to check if practice is BDSM
function isBDMSPractice(practice: string): boolean {
  const bdsmTerms = [
    "BDSM",
    "bdsm",
    "Domination",
    "domination",
    "Submission",
    "submission",
    "Bondage",
    "bondage",
    "Discipline",
    "discipline",
    "Sadomasochism",
    "sadomasochism",
    "Dominatrix",
    "dominatrix",
    "Mistress",
    "mistress",
    "Slave",
    "slave",
    "Master",
    "master",
    "Kinky",
    "kinky",
    "Fetish",
    "fetish",
    "Spanking",
    "spanking",
    "Whipping",
    "whipping",
    "Role play",
    "role play",
    "Roleplay",
    "roleplay",
    "Leather",
    "leather",
    "Latex",
    "latex",
    "Pegging",
    "pegging",
    "Strap-on",
    "strap-on",
  ];

  const lowerPractice = practice.toLowerCase();
  return bdsmTerms.some((term) => lowerPractice.includes(term.toLowerCase()));
}

/**
 * Get BDSM escorts with cleaned images
 */
async function fetchBDSMEscorts(
  params: GetEscortsParams = {},
): Promise<GetEscortsResponse> {
  try {
    return await fetchSpecializedEscorts(params, (doc) => {
      if (!doc.practices || doc.practices.length === 0) return false;
      return doc.practices.some((practice) => isBDMSPractice(practice));
    });
  } catch (error) {
    console.error("Error fetching BDSM escorts:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

export const getBDSMEscorts = cache(fetchBDSMEscorts);
