// app/actions/county.actions.ts
"use server";

import { db } from "@/lib/firebase";
import { serializeDocs } from "@/lib/firebase-serializer";
import {
  collection,
  query,
  getDocs,
  limit as firestoreLimit,
  orderBy,
} from "firebase/firestore";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
// ✅ Import from the new config file
import { County, CACHE_TAGS } from "@/lib/county.config";
import { ICounty } from "./region.action";

// ✅ Keep ONLY async function exports in this file

// Regular server action without cache wrapper
export async function getPopularCounties(limitCount: number = 15) {
  try {
    console.log(`🔄 Fetching popular counties (limit: ${limitCount})...`);

    const countiesRef = collection(db, "counties");
    const q = query(countiesRef, firestoreLimit(limitCount));
    const snapshot = await getDocs(q);

    const counties: County[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      counties.push({
        id: doc.id,
        name: data.name || "",
        slug: data.slug || "",
      });
    });

    return {
      success: true,
      data: counties,
    };
  } catch (error) {
    console.error("Error fetching counties:", error);
    return {
      success: false,
      data: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch counties",
    };
  }
}

// Server action to revalidate counties
export async function revalidateCounties() {
  "use server";
  revalidatePath("/");
  revalidateTag("counties", "layout");
  return { success: true };
}

// ============================================
// ORIGINAL FUNCTION (RENAMED FOR CACHING)
// ============================================

async function fetchAllCountiesFromDB() {
  try {
    const countiesRef = collection(db, "counties");
    const q = query(countiesRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    const counties = serializeDocs<ICounty>(querySnapshot.docs);

    return {
      success: true,
      data: counties,
      count: counties.length,
    };
  } catch (error) {
    console.error("Error fetching all counties:", error);
    return {
      success: false,
      error: "Failed to fetch counties",
      data: [],
    };
  }
}

// ============================================
// CACHED VERSION - MAIN EXPORT
// ============================================

/**
 * Get all counties with Next.js caching
 * Caches results for 5 minutes by default
 */
export async function getAllCounties() {
  const cachedResult = await unstable_cache(
    async () => {
      console.log("🔄 Fetching counties from Firestore (cache miss)");
      return await fetchAllCountiesFromDB();
    },
    ["all-counties"],
    {
      tags: [CACHE_TAGS.ALL_COUNTIES, CACHE_TAGS.COUNTIES],
      revalidate: 604800, // Revalidate every 7 days (604800 seconds) or 5 minutes (300 seconds) based on your preference
    },
  )();

  return cachedResult;
}
