// lib/services/agency.service.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
   QueryConstraint,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  increment,
} from "firebase/firestore";
import {
  IAgency,
  CreateAgencyDTO,
  UpdateAgencyDTO,
  GetAgenciesParams,
  GetAgenciesResponse,
} from "@/types/agency.types";
import { slugify } from "@/lib/utils";

const COLLECTION_NAME = "agencies";

export class AgencyService {
  /**
   * Remove undefined values from an object recursively
   */
  private static removeUndefined(obj: any): any {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== "object") return obj;
    if (obj instanceof Date) return obj;
    if (obj instanceof Timestamp) return obj;

    const result: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        if (
          typeof obj[key] === "object" &&
          !(obj[key] instanceof Date) &&
          !(obj[key] instanceof Timestamp)
        ) {
          result[key] = this.removeUndefined(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }
    }
    return result;
  }

  /**
   * Convert Firestore document to IAgency
   */
  private static convertDocToAgency(
    doc: QueryDocumentSnapshot<DocumentData>,
  ): IAgency {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      slug: data.slug,
      description: data.description || "",
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      whatsappPhone: data.whatsappPhone || "",
      website: data.website || "",
      ownerId: data.ownerId,
      country: data.country || "Kenya",
      county: data.county,
      countyCode: data.countyCode,
      region: data.region,
      town: data.town,
      estate: data.estate || "",
      address: data.address || "",
      street: data.street || "",
      postalCode: data.postalCode || "",
      businessType: data.businessType || "agency",
      categories: data.categories || [],
      openingHours: data.openingHours || {
        monday: "09:00-18:00",
        tuesday: "09:00-18:00",
        wednesday: "09:00-18:00",
        thursday: "09:00-18:00",
        friday: "09:00-18:00",
        saturday: "09:00-18:00",
        sunday: "09:00-18:00",
      },
      services: data.services || [],
      specialties: data.specialties || [],
      isVerified: data.isVerified || false,
      verificationStatus: data.verificationStatus || "pending",
      verificationDocuments: data.verificationDocuments,
      logo: data.logo || "",
      coverImage: data.coverImage || "",
      gallery: data.gallery || [],
      videos: data.videos || [],
      establishmentYear: data.establishmentYear,
      languages: data.languages || ["English", "Swahili"],
      paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
      socialMedia: data.socialMedia,
      plan: {
        type: data.plan?.type || "basic",
        isActive: data.plan?.isActive !== false,
        activatedAt: data.plan?.activatedAt?.toDate(),
        expiresAt: data.plan?.expiresAt?.toDate(),
        features: data.plan?.features || [],
        maxEmployees: data.plan?.maxEmployees || 10,
        maxGalleryImages: data.plan?.maxGalleryImages || 20,
      },
      rating: data.rating || 0,
      totalReviews: data.totalReviews || 0,
      totalBookings: data.totalBookings || 0,
      totalViews: data.totalViews || 0,
      featuredEmployeesCount: data.featuredEmployeesCount || 0,
      isActive: data.isActive !== false,
      isFeatured: data.isFeatured || false,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
  }

  /**
   * Create a new agency
   */
  static async createAgency(data: CreateAgencyDTO): Promise<IAgency> {
    try {
      const slug = slugify(data.name);

      // Check if slug already exists
      const existingQuery = query(
        collection(db, COLLECTION_NAME),
        where("slug", "==", slug),
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        throw new Error(`Agency with name "${data.name}" already exists`);
      }

      const now = new Date();
      const agencyId = slug;

      // Build agency object without undefined values
      const agencyData: Partial<IAgency> = {
        name: data.name,
        slug,
        description: data.description || "",
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        ownerId: data.ownerId,
        country: "Kenya",
        county: data.county,
        countyCode: data.county.toLowerCase().replace(/\s+/g, "_"),
        region: data.region,
        town: data.town,
        businessType: data.businessType || "agency",
        categories: data.categories || [],
        openingHours: {
          monday: "09:00-18:00",
          tuesday: "09:00-18:00",
          wednesday: "09:00-18:00",
          thursday: "09:00-18:00",
          friday: "09:00-18:00",
          saturday: "09:00-18:00",
          sunday: "09:00-18:00",
        },
        services: data.services || [],
        specialties: data.specialties || [],
        isVerified: false,
        verificationStatus: "pending",
        logo: "",
        coverImage: "",
        gallery: [],
        videos: [],
        languages: data.languages || ["English", "Swahili"],
        paymentMethods: data.paymentMethods || ["Cash", "M-Pesa"],
        plan: {
          type: "basic",
          isActive: true,
          features: [],
          maxEmployees: 10,
          maxGalleryImages: 20,
        },
        rating: 0,
        totalReviews: 0,
        totalBookings: 0,
        totalViews: 0,
        credits: 100,
        featuredEmployeesCount: 0,
        isActive: true,
        isFeatured: false,
        createdAt: now,
        updatedAt: now,
      };

      // Add optional fields only if they exist
      if (data.whatsappPhone) agencyData.whatsappPhone = data.whatsappPhone;
      if (data.website) agencyData.website = data.website;
      if (data.estate) agencyData.estate = data.estate;
      if (data.address) agencyData.address = data.address;
      if (data.establishmentYear)
        agencyData.establishmentYear = data.establishmentYear;
      if (data.socialMedia) agencyData.socialMedia = data.socialMedia;

      // Convert dates to Timestamps for Firestore
      const firestoreData: any = {
        ...this.removeUndefined(agencyData),
        createdAt: Timestamp.fromDate(agencyData.createdAt!),
        updatedAt: Timestamp.fromDate(agencyData.updatedAt!),
      };

      const agencyRef = doc(db, COLLECTION_NAME, agencyId);
      await setDoc(agencyRef, firestoreData);

      // Return created agency
      const created = await this.getAgencyById(agencyId);
      if (!created) {
        throw new Error("Failed to retrieve created agency");
      }

      return created;
    } catch (error) {
      console.error("Error creating agency:", error);
      throw error;
    }
  }

  /**
   * Get agency by ID
   */
  static async getAgencyById(id: string): Promise<IAgency | null> {
    try {
      const agencyRef = doc(db, COLLECTION_NAME, id);
      const agencyDoc = await getDoc(agencyRef);

      if (!agencyDoc.exists()) {
        return null;
      }

      return this.convertDocToAgency(agencyDoc);
    } catch (error) {
      console.error("Error getting agency:", error);
      throw error;
    }
  }

  /**
   * Get agency by slug
   */
  static async getAgencyBySlug(slug: string): Promise<IAgency | null> {
    try {
      const agenciesRef = collection(db, COLLECTION_NAME);
      const q = query(agenciesRef, where("slug", "==", slug));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return this.convertDocToAgency(snapshot.docs[0]);
    } catch (error) {
      console.error("Error getting agency by slug:", error);
      throw error;
    }
  }

  /**
   * Get agencies by owner
   */
  static async getAgenciesByOwner(ownerId: string): Promise<IAgency[]> {
    try {
      const agenciesRef = collection(db, COLLECTION_NAME);
      const q = query(agenciesRef, where("ownerId", "==", ownerId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => this.convertDocToAgency(doc));
    } catch (error) {
      console.error("Error getting agencies by owner:", error);
      throw error;
    }
  }

  /**
   * Get all agencies with filters
   */
  static async getAgencies(
    params: GetAgenciesParams = {},
  ): Promise<GetAgenciesResponse> {
    try {
      const {
        page = 1,
        limit: pageLimit = 20,
        county,
        region,
        town,
        businessType,
        isVerified,
        isActive = true,
        isFeatured,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = params;

      const constraints: QueryConstraint[] = [];

      if (isActive !== undefined) {
        constraints.push(where("isActive", "==", isActive));
      }

      if (isVerified !== undefined) {
        constraints.push(where("isVerified", "==", isVerified));
      }

      if (isFeatured !== undefined) {
        constraints.push(where("isFeatured", "==", isFeatured));
      }

      if (county) {
        constraints.push(where("county", "==", county));
      }

      if (region) {
        constraints.push(where("region", "==", region));
      }

      if (town) {
        constraints.push(where("town", "==", town));
      }

      if (businessType) {
        constraints.push(where("businessType", "==", businessType));
      }

      // Add sorting
      const validSortFields = [
        "createdAt",
        "updatedAt",
        "name",
        "rating",
        "totalViews",
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      constraints.push(orderBy(sortField, sortOrder));

      // Get total count
      const countQuery = query(collection(db, COLLECTION_NAME), ...constraints);
      const countSnapshot = await getDocs(countQuery);
      const total = countSnapshot.size;

      // Apply pagination
      const startAt = (page - 1) * pageLimit;
      const paginatedQuery = query(
        collection(db, COLLECTION_NAME),
        ...constraints,
        firestoreLimit(pageLimit),
      );
      const snapshot = await getDocs(paginatedQuery);

      let agencies = snapshot.docs.map((doc) => this.convertDocToAgency(doc));

      // Apply search filter client-side (Firestore doesn't support text search well)
      if (search) {
        const searchLower = search.toLowerCase();
        agencies = agencies.filter(
          (agency) =>
            agency.name.toLowerCase().includes(searchLower) ||
            agency.description.toLowerCase().includes(searchLower),
        );
      }

      return {
        agencies,
        total,
        page,
        totalPages: Math.ceil(total / pageLimit),
        hasMore: page * pageLimit < total,
      };
    } catch (error) {
      console.error("Error getting agencies:", error);
      throw error;
    }
  }

  /**
   * Update agency
   */
  static async updateAgency(
    id: string,
    data: UpdateAgencyDTO,
  ): Promise<IAgency> {
    try {
      const agencyRef = doc(db, COLLECTION_NAME, id);
      const agencyDoc = await getDoc(agencyRef);

      if (!agencyDoc.exists()) {
        throw new Error(`Agency with id ${id} not found`);
      }

      const currentData = agencyDoc.data();
      const updateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
      };

      // Handle name and slug update
      if (data.name && data.name !== currentData.name) {
        const newSlug = slugify(data.name);

        // Check if new slug conflicts with existing agency
        const existingQuery = query(
          collection(db, COLLECTION_NAME),
          where("slug", "==", newSlug),
          where("__name__", "!=", id),
        );
        const existingSnapshot = await getDocs(existingQuery);

        if (!existingSnapshot.empty) {
          throw new Error(`Agency with name "${data.name}" already exists`);
        }

        updateData.name = data.name;
        updateData.slug = newSlug;
      }

      // Add other fields if they exist
      const fieldsToUpdate: (keyof UpdateAgencyDTO)[] = [
        "description",
        "contactEmail",
        "contactPhone",
        "whatsappPhone",
        "website",
        "county",
        "region",
        "town",
        "estate",
        "address",
        "businessType",
        "categories",
        "services",
        "specialties",
        "isVerified",
        "isActive",
        "isFeatured",
        "logo",
        "coverImage",
        "gallery",
        "videos",
        "establishmentYear",
        "languages",
        "paymentMethods",
        "socialMedia",
        "openingHours",
        "verificationStatus",
      ];

      for (const field of fieldsToUpdate) {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      }

      // Award 200 credits when verification transitions to approved
      if (data.isVerified === true && currentData.isVerified !== true) {
        updateData.credits = increment(200);
      }

      // Handle county code update
      if (data.county) {
        updateData.countyCode = data.county.toLowerCase().replace(/\s+/g, "_");
      }

      // Remove any undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(agencyRef, updateData);

      // Return updated agency
      const updatedAgency = await this.getAgencyById(id);
      if (!updatedAgency) {
        throw new Error("Failed to retrieve updated agency");
      }

      return updatedAgency;
    } catch (error) {
      console.error("Error updating agency:", error);
      throw error;
    }
  }

  /**
   * Delete agency (soft delete by default)
   */
  static async deleteAgency(
    id: string,
    hardDelete: boolean = false,
  ): Promise<boolean> {
    try {
      const agencyRef = doc(db, COLLECTION_NAME, id);
      const agencyDoc = await getDoc(agencyRef);

      if (!agencyDoc.exists()) {
        throw new Error(`Agency with id ${id} not found`);
      }

      if (hardDelete) {
        await deleteDoc(agencyRef);
      } else {
        await updateDoc(agencyRef, {
          isActive: false,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      return true;
    } catch (error) {
      console.error("Error deleting agency:", error);
      throw error;
    }
  }

  /**
   * Increment agency view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    try {
      const agency = await this.getAgencyById(id);
      if (!agency) return;

      const agencyRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(agencyRef, {
        totalViews: (agency.totalViews || 0) + 1,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  }

  /**
   * Update agency rating
   */
  static async updateRating(id: string, newRating: number): Promise<void> {
    try {
      const agency = await this.getAgencyById(id);
      if (!agency) return;

      const newTotalReviews = (agency.totalReviews || 0) + 1;
      const newAverageRating =
        ((agency.rating || 0) * (agency.totalReviews || 0) + newRating) /
        newTotalReviews;

      const agencyRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(agencyRef, {
        rating: newAverageRating,
        totalReviews: newTotalReviews,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      console.error("Error updating rating:", error);
    }
  }

  /**
   * Get featured agencies
   */
  static async getFeaturedAgencies(
    limitCount: number = 10,
  ): Promise<IAgency[]> {
    try {
      const agenciesRef = collection(db, COLLECTION_NAME);
      const q = query(
        agenciesRef,
        where("isActive", "==", true),
        where("isFeatured", "==", true),
        orderBy("rating", "desc"),
        firestoreLimit(limitCount),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => this.convertDocToAgency(doc));
    } catch (error) {
      console.error("Error getting featured agencies:", error);
      return [];
    }
  }

  /**
   * Get agency statistics
   */
  static async getAgencyStats(): Promise<{
    total: number;
    active: number;
    verified: number;
    featured: number;
    byBusinessType: Record<string, number>;
  }> {
    try {
      const agenciesRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(agenciesRef);

      let total = 0;
      let active = 0;
      let verified = 0;
      let featured = 0;
      const byBusinessType: Record<string, number> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        total++;

        if (data.isActive) active++;
        if (data.isVerified) verified++;
        if (data.isFeatured) featured++;

        const type = data.businessType || "agency";
        byBusinessType[type] = (byBusinessType[type] || 0) + 1;
      });

      return { total, active, verified, featured, byBusinessType };
    } catch (error) {
      console.error("Error getting agency stats:", error);
      return {
        total: 0,
        active: 0,
        verified: 0,
        featured: 0,
        byBusinessType: {},
      };
    }
  }
}

export default AgencyService;
