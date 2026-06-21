"use server";

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { serializeDoc, serializeDocs } from "@/lib/firebase-serializer";

export interface ICounty {
  id: string;
  name: string;
  code: string;
  description?: string;
  isPopular: boolean;
  population?: number;
  area?: string;
  capital?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IRegion {
  id: string;
  name: string;
  countyCode: string;
  county: string;
  countyNumericCode?: string;
  countyId: string;
  isActive: boolean;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Simple in-memory cache
let cachedPopularCounties: {
  data: ICounty[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getPopularCounties(options?: {
  forceRefresh?: boolean;
  limit?: number;
}) {
  try {
    // Build query
    const countiesRef = collection(db, "counties");
    const constraints: any[] = [
      where("isPopular", "==", true),
      orderBy("name", "asc"),
    ];

    const q = query(countiesRef, ...constraints);
    const querySnapshot = await getDocs(q);

    // Serialize the documents (convert Timestamps to ISO strings)
    let popularCounties = serializeDocs<ICounty>(querySnapshot.docs);

    // Apply limit if specified
    if (options?.limit && options.limit > 0) {
      popularCounties = popularCounties.slice(0, options.limit);
    }

    return {
      success: true,
      data: popularCounties,
      count: popularCounties.length,
      fromCache: false,
    };
  } catch (error) {
    console.error("Error fetching popular counties:", error);
    return {
      success: false,
      error: "Failed to fetch popular counties",
      data: [],
    };
  }
}

// ✅ Remove these manual cache variables
// const CACHE_DURATION = 60000;
// let cachedPopularCounties: { data: ICounty[]; timestamp: number } | null = null;

// Optional: Function to clear cache
export async function clearPopularCountiesCache() {
  cachedPopularCounties = null;
  return { success: true, message: "Cache cleared" };
}

export async function getAllCounties() {
  try {
    const countiesRef = collection(db, "counties");
    const q = query(countiesRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    // Serialize the documents (convert Timestamps to ISO strings)
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

// Get county by ID
export async function getCountyById(id: string) {
  try {
    const docRef = doc(db, "counties", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const county = serializeDoc<ICounty>(docSnap);
      return {
        success: true,
        data: county,
      };
    }

    return {
      success: false,
      error: "County not found",
      data: null,
    };
  } catch (error) {
    console.error("Error fetching county:", error);
    return {
      success: false,
      error: "Failed to fetch county",
      data: null,
    };
  }
}

// Get county by code
export async function getCountyByCode(code: string) {
  try {
    const countiesRef = collection(db, "counties");
    const q = query(countiesRef, where("code", "==", code));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const county = serializeDoc<ICounty>(querySnapshot.docs[0]);
      return {
        success: true,
        data: county,
      };
    }

    return {
      success: false,
      error: "County not found",
      data: null,
    };
  } catch (error) {
    console.error("Error fetching county by code:", error);
    return {
      success: false,
      error: "Failed to fetch county",
      data: null,
    };
  }
}

// Get counties with filters
export async function getCountiesWithFilters(filters?: {
  searchTerm?: string;
  isPopular?: boolean;
  minPopulation?: number;
  maxPopulation?: number;
}) {
  try {
    const countiesRef = collection(db, "counties");
    const constraints: any[] = [orderBy("name", "asc")];

    if (filters?.isPopular !== undefined) {
      constraints.push(where("isPopular", "==", filters.isPopular));
    }

    if (filters?.minPopulation !== undefined) {
      constraints.push(where("population", ">=", filters.minPopulation));
    }

    if (filters?.maxPopulation !== undefined) {
      constraints.push(where("population", "<=", filters.maxPopulation));
    }

    const q = query(countiesRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let counties = serializeDocs<ICounty>(querySnapshot.docs);

    // Client-side search (since Firestore doesn't support text search natively)
    if (filters?.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      counties = counties.filter(
        (county) =>
          county.name.toLowerCase().includes(searchLower) ||
          county.description?.toLowerCase().includes(searchLower) ||
          county.capital?.toLowerCase().includes(searchLower),
      );
    }

    return {
      success: true,
      data: counties,
      count: counties.length,
      filters: filters || {},
    };
  } catch (error) {
    console.error("Error fetching counties with filters:", error);
    return {
      success: false,
      error: "Failed to fetch counties",
      data: [],
    };
  }
}

// Search counties by name
export async function searchCounties(searchTerm: string) {
  try {
    const result = await getAllCounties();
    if (!result.success) {
      return result;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = result.data.filter(
      (county) =>
        county.name.toLowerCase().includes(searchLower) ||
        county.description?.toLowerCase().includes(searchLower) ||
        county.capital?.toLowerCase().includes(searchLower),
    );

    return {
      success: true,
      data: filtered,
      count: filtered.length,
      searchTerm,
    };
  } catch (error) {
    console.error("Error searching counties:", error);
    return {
      success: false,
      error: "Failed to search counties",
      data: [],
    };
  }
}

// Get county with regions (joined data)
export async function getCountyWithRegions(countyCode: string) {
  try {
    // Get county
    const countyResult = await getCountyByCode(countyCode);
    if (!countyResult.success || !countyResult.data) {
      return countyResult;
    }

    // Get regions for this county
    const regionsResult = await getRegionsByCountyCode(countyCode);

    return {
      success: true,
      data: {
        ...countyResult.data,
        regions: regionsResult.success ? regionsResult.data : [],
        regionCount: regionsResult.success ? regionsResult.count : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching county with regions:", error);
    return {
      success: false,
      error: "Failed to fetch county with regions",
      data: null,
    };
  }
}

// ============== UPDATED REGION FUNCTIONS ==============

// Get all regions (returns all regions in the new format)
export async function getAllRegions() {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(regionsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    const regions = serializeDocs<IRegion>(querySnapshot.docs);

    return {
      success: true,
      data: regions,
      count: regions.length,
    };
  } catch (error) {
    console.error("Error fetching regions:", error);
    return {
      success: false,
      error: "Failed to fetch regions",
      data: [],
    };
  }
}

// Get regions by county code (using the new countyCode field)
export async function getRegionsByCountyCode(countyCode: string) {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(
      regionsRef,
      where("countyCode", "==", countyCode.toLowerCase()),
      orderBy("name", "asc"),
    );
    const querySnapshot = await getDocs(q);

    const regions = serializeDocs<IRegion>(querySnapshot.docs);

    return {
      success: true,
      data: regions,
      count: regions.length,
      countyCode,
    };
  } catch (error) {
    console.error("Error fetching regions by county code:", error);
    return {
      success: false,
      error: "Failed to fetch regions",
      data: [],
    };
  }
}

// Get regions by county name
export async function getRegionsByCountyName(countyName: string) {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(
      regionsRef,
      where("county", "==", countyName),
      orderBy("name", "asc"),
    );
    const querySnapshot = await getDocs(q);

    const regions = serializeDocs<IRegion>(querySnapshot.docs);

    return {
      success: true,
      data: regions,
      count: regions.length,
      countyName,
    };
  } catch (error) {
    console.error("Error fetching regions by county name:", error);
    return {
      success: false,
      error: "Failed to fetch regions",
      data: [],
    };
  }
}

// Get region by ID (works with new ID format like "nairobi_westlands")
export async function getRegionById(id: string) {
  try {
    const docRef = doc(db, "regions", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const region = serializeDoc<IRegion>(docSnap);
      return {
        success: true,
        data: region,
      };
    }

    return {
      success: false,
      error: "Region not found",
      data: null,
    };
  } catch (error) {
    console.error("Error fetching region:", error);
    return {
      success: false,
      error: "Failed to fetch region",
      data: null,
    };
  }
}

// Get region by name and county
export async function getRegionByNameAndCounty(name: string, county: string) {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(
      regionsRef,
      where("name", "==", name),
      where("county", "==", county),
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const region = serializeDoc<IRegion>(querySnapshot.docs[0]);
      return {
        success: true,
        data: region,
      };
    }

    return {
      success: false,
      error: "Region not found",
      data: null,
    };
  } catch (error) {
    console.error("Error fetching region by name and county:", error);
    return {
      success: false,
      error: "Failed to fetch region",
      data: null,
    };
  }
}

// Get active regions only
export async function getActiveRegions() {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(
      regionsRef,
      where("isActive", "==", true),
      orderBy("name", "asc"),
    );
    const querySnapshot = await getDocs(q);

    const regions = serializeDocs<IRegion>(querySnapshot.docs);

    return {
      success: true,
      data: regions,
      count: regions.length,
    };
  } catch (error) {
    console.error("Error fetching active regions:", error);
    return {
      success: false,
      error: "Failed to fetch active regions",
      data: [],
    };
  }
}

// Get regions with pagination
export async function getRegionsPaginated(
  page: number = 1,
  limit: number = 20,
) {
  try {
    const regionsRef = collection(db, "regions");
    const q = query(regionsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);

    const allRegions = serializeDocs<IRegion>(querySnapshot.docs);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedRegions = allRegions.slice(start, end);

    return {
      success: true,
      data: paginatedRegions,
      total: allRegions.length,
      page,
      limit,
      totalPages: Math.ceil(allRegions.length / limit),
      hasMore: end < allRegions.length,
    };
  } catch (error) {
    console.error("Error fetching paginated regions:", error);
    return {
      success: false,
      error: "Failed to fetch regions",
      data: [],
    };
  }
}

// Search regions by name
export async function searchRegions(searchTerm: string) {
  try {
    const result = await getAllRegions();
    if (!result.success) {
      return result;
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = result.data.filter(
      (region) =>
        region.name.toLowerCase().includes(searchLower) ||
        region.county.toLowerCase().includes(searchLower) ||
        region.town?.toLowerCase().includes(searchLower),
    );

    return {
      success: true,
      data: filtered,
      count: filtered.length,
      searchTerm,
    };
  } catch (error) {
    console.error("Error searching regions:", error);
    return {
      success: false,
      error: "Failed to search regions",
      data: [],
    };
  }
}

// Get popular regions (regions that have escorts)
export async function getPopularRegions(limit: number = 10) {
  try {
    // Get all regions
    const regionsResult = await getAllRegions();
    if (!regionsResult.success) {
      return regionsResult;
    }

    // Get escorts to see which regions have listings
    const escortsRef = collection(db, "escorts");
    const escortsSnapshot = await getDocs(escortsRef);

    // Count escorts per region
    const regionCount: Record<string, number> = {};
    escortsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const regionId = data.regionId;
      if (regionId) {
        regionCount[regionId] = (regionCount[regionId] || 0) + 1;
      }
    });

    // Sort regions by escort count
    const regionsWithCount = regionsResult.data
      .map((region) => ({
        ...region,
        escortCount: regionCount[region.id] || 0,
      }))
      .filter((region) => region.escortCount > 0)
      .sort((a, b) => b.escortCount - a.escortCount)
      .slice(0, limit);

    return {
      success: true,
      data: regionsWithCount,
      count: regionsWithCount.length,
    };
  } catch (error) {
    console.error("Error fetching popular regions:", error);
    return {
      success: false,
      error: "Failed to fetch popular regions",
      data: [],
    };
  }
}
