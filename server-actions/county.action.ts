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
import { revalidatePath, revalidateTag } from "next/cache";
// ✅ Import from the new config file
import { County } from "@/lib/county.config";
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
// GET ALL COUNTIES - no caching, always fresh
// ============================================

/**
 * Get all counties
 */
export async function getAllCounties() {
  console.log("🔄 Fetching counties from Firestore...");
  return await fetchAllCountiesFromDB();
}
