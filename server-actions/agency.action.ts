// server-actions/agency.action.ts
"use server";

import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { cache } from "react";
import { IAgency } from "@/types/agency.types";
import { Escort } from "./escort.action";

// ============================================
// CONVERT FIREBASE DOC TO AGENCY
// ============================================
function convertFirebaseDocToAgency(
  doc: QueryDocumentSnapshot<DocumentData>,
): IAgency {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || "",
    slug: data.slug || "",
    description: data.description || "",
    contactEmail: data.contactEmail || "",
    contactPhone: data.contactPhone || "",
    whatsappPhone: data.whatsappPhone,
    website: data.website,
    ownerId: data.ownerId || "",
    country: data.country || "Kenya",
    county: data.county || "",
    countyCode: data.countyCode || "",
    region: data.region || "",
    town: data.town || "",
    estate: data.estate,
    address: data.address,
    street: data.street,
    postalCode: data.postalCode,
    businessType: data.businessType || "agency",
    categories: data.categories || [],
    openingHours: data.openingHours || {
      monday: "9:00 AM - 6:00 PM",
      tuesday: "9:00 AM - 6:00 PM",
      wednesday: "9:00 AM - 6:00 PM",
      thursday: "9:00 AM - 6:00 PM",
      friday: "9:00 AM - 6:00 PM",
      saturday: "9:00 AM - 6:00 PM",
      sunday: "Closed",
    },
    services: data.services || [],
    specialties: data.specialties || [],
    isVerified: data.isVerified || false,
    verificationStatus: data.verificationStatus || "pending",
    verificationDocuments: data.verificationDocuments,
    logo: data.logo,
    coverImage: data.coverImage,
    gallery: data.gallery || [],
    videos: data.videos || [],
    establishmentYear: data.establishmentYear,
    languages: data.languages || ["English"],
    paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
    socialMedia: data.socialMedia,
    plan: data.plan || {
      type: "basic",
      isActive: true,
      features: [],
      maxEmployees: 5,
      maxGalleryImages: 10,
    },
    rating: data.rating || 0,
    totalReviews: data.totalReviews || 0,
    totalBookings: data.totalBookings || 0,
    totalViews: data.totalViews || 0,
    featuredEmployeesCount: data.featuredEmployeesCount || 0,
    isActive: data.isActive !== undefined ? data.isActive : true,
    isFeatured: data.isFeatured || false,
    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
  };
}

// ============================================
// GET CACHED AGENCIES ✅ CACHED
// ============================================
export const getCachedAgencies = cache(
  async (page: number = 1, limitCount: number = 24) => {
    try {
      console.log(`🔄 Fetching agencies from Firestore (page ${page})...`);

      const agenciesRef = collection(db, "agencies");
      const constraints: QueryConstraint[] = [
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      ];

      const q = query(agenciesRef, ...constraints);
      const snapshot = await getDocs(q);

      const agencies: IAgency[] = [];
      snapshot.forEach((doc) => {
        agencies.push(convertFirebaseDocToAgency(doc));
      });

      const countQuery = query(agenciesRef, where("isActive", "==", true));
      const countSnapshot = await getDocs(countQuery);
      const total = countSnapshot.docs.length;

      const totalPages = Math.ceil(total / limitCount);

      return {
        success: true,
        data: {
          agencies,
          total,
          page,
          totalPages,
          hasMore: page < totalPages,
        },
      };
    } catch (error) {
      console.error("Error fetching agencies:", error);
      return {
        success: false,
        data: {
          agencies: [],
          total: 0,
          page: 1,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  },
);

// ============================================
// GET AGENCY BY SLUG ✅ CACHED
// ============================================
export const getCachedAgencyBySlug = cache(async (slug: string) => {
  try {
    console.log(`🔄 Fetching agency by slug: ${slug}`);

    const agenciesRef = collection(db, "agencies");
    const q = query(
      agenciesRef,
      where("slug", "==", slug),
      where("isActive", "==", true),
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return {
        success: false,
        data: null,
      };
    }

    const agency = convertFirebaseDocToAgency(snapshot.docs[0]);

    return {
      success: true,
      data: agency,
    };
  } catch (error) {
    console.error("Error fetching agency by slug:", error);
    return {
      success: false,
      data: null,
    };
  }
});

// ============================================
// GET AGENCIES COUNT ✅ CACHED
// ============================================
export const getCachedAgenciesCount = cache(
  async (filters?: { county?: string; region?: string; business?: string }) => {
    try {
      const agenciesRef = collection(db, "agencies");
      const constraints: QueryConstraint[] = [where("isActive", "==", true)];

      if (filters?.county && filters.county !== "all") {
        constraints.push(where("county", "==", filters.county));
      }
      if (filters?.region && filters.region !== "all") {
        constraints.push(where("region", "==", filters.region));
      }
      if (filters?.business && filters.business !== "all") {
        constraints.push(where("businessType", "==", filters.business));
      }

      const q = query(agenciesRef, ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.length;
    } catch (error) {
      console.error("Error getting agencies count:", error);
      return 0;
    }
  },
);

// ============================================
// GET FIRST AGENCY (for metadata) ✅ CACHED
// ============================================
export const getCachedFirstAgency = cache(
  async (filters?: { county?: string; region?: string; business?: string }) => {
    try {
      const agenciesRef = collection(db, "agencies");
      const constraints: QueryConstraint[] = [
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(1),
      ];

      if (filters?.county && filters.county !== "all") {
        constraints.push(where("county", "==", filters.county));
      }
      if (filters?.region && filters.region !== "all") {
        constraints.push(where("region", "==", filters.region));
      }
      if (filters?.business && filters.business !== "all") {
        constraints.push(where("businessType", "==", filters.business));
      }

      const q = query(agenciesRef, ...constraints);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return convertFirebaseDocToAgency(snapshot.docs[0]);
    } catch (error) {
      console.error("Error getting first agency:", error);
      return null;
    }
  },
);

// ============================================
// GET AGENCY ESCORTS ✅ CACHED
// ============================================
export const getCachedAgencyEscorts = cache(
  async (agencyId: string, page: number = 1, limitCount: number = 20) => {
    try {
      console.log(`🔄 Fetching escorts for agency: ${agencyId}`);

      const escortsRef = collection(db, "escorts");
      const constraints: QueryConstraint[] = [
        where("agencyId", "==", agencyId),
        where("isActive", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      ];

      const q = query(escortsRef, ...constraints);
      const snapshot = await getDocs(q);

      const escorts: Escort[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        escorts.push({
          id: doc.id,
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
          country: data.country || "Kenya",
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
          role: data.role || "escort",
          openingHours: data.openingHours || {
            monday: "",
            tuesday: "",
            wednesday: "",
            thursday: "",
            friday: "",
            saturday: "",
            sunday: "",
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
          plan: data.plan || {
            type: "basic",
            isActive: true,
            features: [],
            maxEmployees: 0,
            maxGalleryImages: 0,
          },
          totalBookings: data.totalBookings || 0,
          totalReviews: data.totalReviews || 0,
          rating: data.rating || 0,
          totalViews: data.totalViews || 0,
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
        });
      });

      const countConstraints: QueryConstraint[] = [
        where("agencyId", "==", agencyId),
        where("isActive", "==", true),
      ];
      const countQ = query(escortsRef, ...countConstraints);
      const countSnapshot = await getDocs(countQ);
      const total = countSnapshot.docs.length;

      return {
        success: true,
        data: escorts,
        total,
        page,
        totalPages: Math.ceil(total / limitCount),
        hasMore: page < Math.ceil(total / limitCount),
      };
    } catch (error) {
      console.error("Error fetching agency escorts:", error);
      return {
        success: false,
        data: [],
        error:
          error instanceof Error ? error.message : "Failed to fetch escorts",
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false,
      };
    }
  },
);

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
// These point to the cached versions
export const getAgenciesCount = getCachedAgenciesCount;
export const getFirstAgency = getCachedFirstAgency;
export const getAgencyEscorts = getCachedAgencyEscorts;
