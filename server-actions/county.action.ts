// app/actions/county.actions.ts
"use server";

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  getDocs,
  limit as firestoreLimit,
} from "firebase/firestore";
import { revalidatePath, revalidateTag } from "next/cache";

export interface County {
  id: string;
  name: string;
  slug: string;
  [key: string]: any;
}

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
        // Only include fields you need
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
  revalidateTag("counties");
  return { success: true };
}
