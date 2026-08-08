// types/agency.types.ts
import { Timestamp } from "firebase/firestore";

export interface IAgency {
  id: string;
  name: string;
  slug: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsappPhone?: string;
  website?: string;
  ownerId: string; // Reference to Escort id (must have role='business')

  // Location
  country: string;
  county: string;
  countyCode: string;
  region: string;
  town: string;
  regions?: string[];
  primaryRegion?: string;
  estate?: string;
  address?: string;
  street?: string;
  postalCode?: string;

  // Business Details
  businessType: "agency" | "spa" | "massage_parlor" | "brothel";
  categories: string[];

  // Opening Hours
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };

  // Services
  services: string[];
  specialties: string[];

  // Verification
  isVerified: boolean;
  verificationStatus: "pending" | "under_review" | "verified" | "rejected";
  verificationDocuments?: {
    businessLicense?: string;
    taxCertificate?: string;
    idProof?: string;
    kraPin?: string;
    otherDocuments?: string[];
  };

  // Media
  logo?: string;
  coverImage?: string;
  gallery: string[];
  videos: string[];

  // Agency Features
  establishmentYear?: number;
  languages: string[];
  paymentMethods: string[];

  // Social Media
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    telegram?: string;
  };

  // Subscription Plan
  plan: {
    type: "basic" | "premium" | "enterprise";
    isActive: boolean;
    activatedAt?: string;
    expiresAt?: string;
    features: string[];
    maxEmployees: number;
    maxGalleryImages: number;
  };

  // Statistics
  rating: number;
  totalReviews: number;
  totalBookings: number;
  totalViews: number;
  credits?: number;
  featuredEmployeesCount: number;

  // Status
  isActive: boolean;
  isFeatured: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgencyDTO {
  name: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  whatsappPhone?: string;
  website?: string;
  ownerId: string;
  county: string;
  region: string;
  town: string;
  regions?: string[];
  primaryRegion?: string;
  estate?: string;
  address?: string;
  businessType?: "agency" | "spa" | "massage_parlor" | "brothel";
  categories?: string[];
  services?: string[];
  specialties?: string[];
  languages?: string[];
  paymentMethods?: string[];
  establishmentYear?: number;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    telegram?: string;
  };
}

export interface UpdateAgencyDTO extends Partial<CreateAgencyDTO> {
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
  logo?: string;
  coverImage?: string;
  gallery?: string[];
  videos?: string[];
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

export interface GetAgenciesParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  town?: string;
  businessType?: string;
  isVerified?: boolean;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "name" | "rating" | "totalViews";
  sortOrder?: "asc" | "desc";
}

export interface GetAgenciesResponse {
  agencies: IAgency[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export interface AgenciesResponse {
  success: boolean;
  data: {
    agencies: IAgency[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  };
}
