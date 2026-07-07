// server-actions/cleaned-escorts.action.ts

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Escort, GetEscortsParams, GetEscortsResponse } from "./escort.action";

// ... your types (Escort, Location, Rate, etc.) ...

// ============================================
// GET ESCORTS WITH ONLY CLEANED IMAGES
// ============================================

/**
 * Get escorts that have cleaned images and only return cleaned images
 * This filters out any non-cleaned images from the escort data
 */
export async function getEscortsWithOnlyCleanedImages(
  params: GetEscortsParams = {}
): Promise<GetEscortsResponse> {
  try {
    const {
      page = 1,
      limit = 20,
      county,
      region,
      practice,
      isActive = true,
      isVerified,
      isFeatured,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;

    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit));

    // Build query
    let query: FirebaseFirestore.Query = adminDb.collection("escorts");

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

    const snapshot = await query.get();
    let allDocs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Apply client-side filters
    if (region && region !== "all") {
      allDocs = allDocs.filter((doc: any) => doc.regions?.includes(region));
    }

    if (practice && practice !== "all") {
      allDocs = allDocs.filter((doc: any) => doc.practices?.includes(practice));
    }

    // Filter: Only include escorts with at least one cleaned image
    // AND transform their images to only include cleaned ones
    let escortsWithCleanedImages = allDocs
      .filter((doc: any) => {
        if (!doc.imagesMetadata) return false;
        
        const metadata = doc.imagesMetadata;
        return Object.values(metadata).some((img: any) => 
          img.status === "completed" && img.cleanedUrl
        );
      })
      .map((doc: any) => {
        // Transform the escort data to only include cleaned images
        const cleanedImages: string[] = [];
        const cleanedImagesMetadata: any = {};
        
        if (doc.imagesMetadata) {
          // Extract only cleaned images
          for (const [originalUrl, info] of Object.entries(doc.imagesMetadata)) {
            const imageInfo = info as any;
            if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
              cleanedImages.push(imageInfo.cleanedUrl);
              cleanedImagesMetadata[originalUrl] = {
                ...imageInfo,
                // Keep only cleaned version info
              };
            }
          }
        }
        
        // Return escort with ONLY cleaned images
        return {
          ...doc,
          // Replace original images array with cleaned URLs only
          images: cleanedImages,
          // Keep only cleaned images in metadata
          imagesMetadata: cleanedImagesMetadata,
          // Update preview photo to first cleaned image if available
          previewPhoto: cleanedImages.length > 0 ? cleanedImages[0] : doc.previewPhoto,
          // Update processed counts
          totalImagesProcessed: cleanedImages.length,
        };
      });

    // Apply age filters
    if (params.minAge && params.minAge > 0) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (doc: any) => doc.age && parseInt(doc.age) >= params.minAge!
      );
    }

    if (params.maxAge && params.maxAge > 0) {
      escortsWithCleanedImages = escortsWithCleanedImages.filter(
        (doc: any) => doc.age && parseInt(doc.age) <= params.maxAge!
      );
    }

    // Pagination
    const total = escortsWithCleanedImages.length;
    const startAt = (validPage - 1) * validLimit;
    const paginatedDocs = escortsWithCleanedImages.slice(startAt, startAt + validLimit);

    // Convert to Escort objects
    const escorts = paginatedDocs.map((doc: any) => convertDocToEscortFast(doc));

    return {
      escorts,
      total,
      page: validPage,
      totalPages: Math.ceil(total / validLimit),
      hasMore: validPage * validLimit < total,
    };
  } catch (error) {
    console.error("Error fetching escorts with cleaned images:", error);
    return {
      escorts: [],
      total: 0,
      page: params.page || 1,
      totalPages: 0,
      hasMore: false,
    };
  }
}

/**
 * Get a single escort with ONLY cleaned images
 */
export async function getEscortWithOnlyCleanedImages(id: string): Promise<Escort | null> {
  try {
    if (!id || id.trim() === "") {
      return null;
    }

    const doc = await adminDb.collection("escorts").doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    // Increment view count asynchronously
    adminDb
      .collection("escorts")
      .doc(id)
      .update({
        totalViews: FieldValue.increment(1),
      })
      .catch(() => {});

    // Extract ONLY cleaned images
    const cleanedImages: string[] = [];
    const cleanedImagesMetadata: any = {};
    
    if (data.imagesMetadata) {
      for (const [originalUrl, info] of Object.entries(data.imagesMetadata)) {
        const imageInfo = info as any;
        if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
          cleanedImages.push(imageInfo.cleanedUrl);
          cleanedImagesMetadata[originalUrl] = {
            ...imageInfo,
          };
        }
      }
    }

    // Return escort with ONLY cleaned images
    const escortData = {
      ...data,
      images: cleanedImages,
      imagesMetadata: cleanedImagesMetadata,
      previewPhoto: cleanedImages.length > 0 ? cleanedImages[0] : data.previewPhoto,
      totalImagesProcessed: cleanedImages.length,
    };

    return convertDocToEscortFast({ id: doc.id, ...escortData });
  } catch (error) {
    console.error("Error fetching escort with cleaned images:", error);
    return null;
  }
}

/**
 * Get ONLY the cleaned images for an escort (without any other data)
 */
export async function getCleanedImagesForEscort(id: string): Promise<string[]> {
  try {
    const doc = await adminDb.collection("escorts").doc(id).get();
    if (!doc.exists) return [];
    
    const data = doc.data();
    if (!data || !data.imagesMetadata) return [];
    
    const cleanedImages: string[] = [];
    
    for (const [originalUrl, info] of Object.entries(data.imagesMetadata)) {
      const imageInfo = info as any;
      if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
        cleanedImages.push(imageInfo.cleanedUrl);
      }
    }
    
    return cleanedImages;
  } catch (error) {
    console.error("Error fetching cleaned images:", error);
    return [];
  }
}

/**
 * Get all escorts with cleaned images (simple list)
 */
export async function getSimpleEscortsWithCleanedImages(
  limit: number = 20
): Promise<Array<{ id: string; name: string; previewPhoto: string; cleanedImages: string[] }>> {
  try {
    const snapshot = await adminDb
      .collection("escorts")
      .where("isActive", "==", true)
      .limit(limit)
      .get();

    const results: Array<{ id: string; name: string; previewPhoto: string; cleanedImages: string[] }> = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const cleanedImages: string[] = [];
      
      if (data.imagesMetadata) {
        for (const [originalUrl, info] of Object.entries(data.imagesMetadata)) {
          const imageInfo = info as any;
          if (imageInfo.status === "completed" && imageInfo.cleanedUrl) {
            cleanedImages.push(imageInfo.cleanedUrl);
          }
        }
      }
      
      // Only include if there are cleaned images
      if (cleanedImages.length > 0) {
        results.push({
          id: doc.id,
          name: data.name || "",
          previewPhoto: cleanedImages[0] || data.previewPhoto || "",
          cleanedImages,
        });
      }
    });

    return results;
  } catch (error) {
    console.error("Error fetching simple escorts with cleaned images:", error);
    return [];
  }
}

// Helper function for fast conversion (internal)
function convertDocToEscortFast(doc: any): Escort {
  const data = doc.data ? doc.data() : doc;
  return {
    id: doc.id || data.id || "",
    name: data.name || "",
    username: data.username || "",
    previewPhoto: data.previewPhoto || "",
    labels: data.labels || [],
    email: data.email || "",
    age: data.age || "",
    telephone: data.telephone || "",
    whatsappPhone: data.whatsappPhone || "",
    images: data.images || [],
    videos: data.videos || [],
    about: data.about || "",
    availability: data.availability || [],
    ethnicity: data.ethnicity || "",
    nationality: data.nationality || "",
    bustSize: data.bustSize || "",
    weight: data.weight || "",
    zodiacSign: data.zodiacSign || "",
    sexualOrientation: data.sexualOrientation || "",
    gender: data.gender || "",
    languages: data.languages || [],
    categories: data.categories || [],
    country: data.country || "",
    county: data.county || "",
    countyCode: data.countyCode || "",
    regions: data.regions || [],
    primaryRegion: data.primaryRegion || "",
    locations: data.locations || [],
    source: data.source || "",
    practices: data.practices || [],
    bdsm: data.bdsm || [],
    massage: data.massage || [],
    extraServices: data.extraServices || [],
    slug: data.slug || "",
    role: data.role || "",
    openingHours: data.openingHours || {
      monday: "Not Specified",
      tuesday: "Not Specified",
      wednesday: "Not Specified",
      thursday: "Not Specified",
      friday: "Not Specified",
      saturday: "Not Specified",
      sunday: "Not Specified",
    },
    rates: data.rates || [],
    breastSize: data.breastSize || "",
    ageCategory: data.ageCategory || "",
    character: data.character || "",
    hairColor: data.hairColor || "",
    experience: data.experience || "",
    workType: data.workType || "",
    isAgencyFeatured: data.isAgencyFeatured || false,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isVerified: data.isVerified || false,
    isFeatured: data.isFeatured || false,
    plan: data.plan || { type: "free", isActive: true, features: [] },
    totalBookings: data.totalBookings || 0,
    totalReviews: data.totalReviews || 0,
    rating: data.rating || 0,
    totalViews: data.totalViews || 0,
    cleaningHistory: data.cleaningHistory || [],
    imagesMetadata: data.imagesMetadata || {},
    totalImagesProcessed: data.totalImagesProcessed || 0,
    totalImagesFailed: data.totalImagesFailed || 0,
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
  };
}