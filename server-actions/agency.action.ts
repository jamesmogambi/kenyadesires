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
import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/utils";
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
// GET AGENCY BY OWNER (Clerk user id)
// ============================================
export async function getAgencyByOwnerId(
  ownerId: string,
): Promise<IAgency | null> {
  try {
    if (!ownerId) return null;

    const snapshot = await adminDb
      .collection("agencies")
      .where("ownerId", "==", ownerId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || null,
      plan: {
        ...data.plan,
        activatedAt: data.plan?.activatedAt?.toDate?.() || null,
        expiresAt: data.plan?.expiresAt?.toDate?.() || null,
      },
    } as IAgency;
  } catch (error) {
    console.error("Error fetching agency by owner:", error);
    return null;
  }
}

// ============================================
// CREATE AGENCY
// ============================================
export interface CreateAgencyInput {
  name: string;
  description?: string;
  businessType?: IAgency["businessType"];
  contactEmail: string;
  contactPhone: string;
  whatsappPhone?: string;
  website?: string;
  ownerId: string;
  county: string;
  countyCode?: string;
  region: string;
  town: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;
  categories?: string[];
  services?: string[];
  specialties?: string[];
  languages?: string[];
  paymentMethods?: string[];
  establishmentYear?: number;
  openingHours?: Partial<IAgency["openingHours"]>;
  socialMedia?: IAgency["socialMedia"];
  logo?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  planType?: IAgency["plan"]["type"];
}

const PLAN_LIMITS: Record<
  IAgency["plan"]["type"],
  { maxEmployees: number; maxGalleryImages: number }
> = {
  basic: { maxEmployees: 10, maxGalleryImages: 20 },
  premium: { maxEmployees: 25, maxGalleryImages: 50 },
  enterprise: { maxEmployees: 100, maxGalleryImages: 200 },
};

const DEFAULT_OPENING_HOURS: IAgency["openingHours"] = {
  monday: "09:00-18:00",
  tuesday: "09:00-18:00",
  wednesday: "09:00-18:00",
  thursday: "09:00-18:00",
  friday: "09:00-18:00",
  saturday: "09:00-18:00",
  sunday: "09:00-18:00",
};

// Strip empty social handles so we never store blank keys
function cleanSocialMedia(socialMedia?: IAgency["socialMedia"]) {
  if (!socialMedia) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(socialMedia).filter(([, value]) => !!value?.trim()),
  );

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

// Slug must be unique - agencies are stored under their slug
async function generateUniqueAgencySlug(name: string): Promise<string> {
  const base = slugify(name);
  let slug = base;

  for (let attempt = 2; attempt <= 20; attempt++) {
    const snapshot = await adminDb
      .collection("agencies")
      .where("slug", "==", slug)
      .limit(1)
      .get();

    if (snapshot.empty) return slug;

    slug = `${base}-${attempt}`;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

export async function createAgency(
  data: CreateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    // One agency per owner
    const ownerSnapshot = await adminDb
      .collection("agencies")
      .where("ownerId", "==", data.ownerId)
      .limit(1)
      .get();

    if (!ownerSnapshot.empty) {
      return {
        success: false,
        error: "You already have an agency profile",
      };
    }

    const now = new Date();
    const slug = await generateUniqueAgencySlug(data.name);
    const planType = data.planType || "basic";
    const socialMedia = cleanSocialMedia(data.socialMedia);

    const agency: Omit<IAgency, "id"> = {
      name: data.name,
      slug,
      description: data.description || "",
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      whatsappPhone: data.whatsappPhone || "",
      website: data.website || "",
      ownerId: data.ownerId,
      country: "Kenya",
      county: data.county,
      countyCode:
        data.countyCode || data.county.toLowerCase().replace(/\s+/g, "-"),
      region: data.region,
      town: data.town,
      estate: data.estate || "",
      address: data.address || "",
      street: data.street || "",
      postalCode: data.postalCode || "",
      businessType: data.businessType || "agency",
      categories: data.categories || [],
      openingHours: { ...DEFAULT_OPENING_HOURS, ...(data.openingHours || {}) },
      services: data.services || [],
      specialties: data.specialties || [],
      isVerified: false,
      verificationStatus: "pending",
      logo: data.logo || "",
      coverImage: data.coverImage || "",
      gallery: data.gallery || [],
      videos: data.videos || [],
      establishmentYear: data.establishmentYear,
      languages: data.languages?.length ? data.languages : ["English"],
      paymentMethods: data.paymentMethods?.length
        ? data.paymentMethods
        : ["Cash", "M-Pesa"],
      plan: {
        type: planType,
        isActive: true,
        activatedAt: now,
        features: [],
        ...PLAN_LIMITS[planType],
      },
      rating: 0,
      totalReviews: 0,
      totalBookings: 0,
      totalViews: 0,
      featuredEmployeesCount: 0,
      isActive: true,
      isFeatured: false,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = adminDb.collection("agencies").doc(slug);

    await docRef.set({
      id: docRef.id,
      ...agency,
      ...(socialMedia ? { socialMedia } : {}),
      ...(data.establishmentYear ? {} : { establishmentYear: null }),
    });

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);

    return { success: true, id: docRef.id, slug };
  } catch (error) {
    console.error("Error creating agency:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create agency",
    };
  }
}

// ============================================
// UPDATE AGENCY
// ============================================
export type UpdateAgencyInput = Partial<Omit<CreateAgencyInput, "ownerId">> & {
  ownerId: string;
};

export async function updateAgency(
  id: string,
  data: UpdateAgencyInput,
): Promise<{ success: boolean; id?: string; slug?: string; error?: string }> {
  try {
    if (!data.ownerId) {
      return { success: false, error: "You must be signed in to continue" };
    }

    const docRef = adminDb.collection("agencies").doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return { success: false, error: "Agency profile not found" };
    }

    const existing = snapshot.data() || {};

    if (existing.ownerId !== data.ownerId) {
      return {
        success: false,
        error: "You are not allowed to edit this agency",
      };
    }

    const { ownerId, planType, openingHours, socialMedia, ...rest } = data;
    const payload: Record<string, any> = { ...rest, updatedAt: new Date() };

    if (data.county) {
      payload.countyCode =
        data.countyCode || data.county.toLowerCase().replace(/\s+/g, "-");
    }

    if (openingHours) {
      payload.openingHours = {
        ...DEFAULT_OPENING_HOURS,
        ...(existing.openingHours || {}),
        ...openingHours,
      };
    }

    if (socialMedia) {
      payload.socialMedia = cleanSocialMedia(socialMedia) || {};
    }

    if (planType) {
      payload.plan = {
        ...(existing.plan || {}),
        type: planType,
        ...PLAN_LIMITS[planType],
      };
    }

    if (data.establishmentYear === undefined) {
      delete payload.establishmentYear;
    }

    // Firestore rejects undefined values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });

    await docRef.update(payload);

    const slug = existing.slug || id;

    revalidatePath("/agencies");
    revalidatePath(`/agencies/${slug}`);
    revalidatePath("/agency-profile");

    return { success: true, id, slug };
  } catch (error) {
    console.error("Error updating agency:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update agency",
    };
  }
}

// ============================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================
// These point to the cached versions
export const getAgenciesCount = getCachedAgenciesCount;
export const getFirstAgency = getCachedFirstAgency;
export const getAgencyEscorts = getCachedAgencyEscorts;
