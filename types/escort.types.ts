// types/escort.types.ts
import { Timestamp } from "firebase/firestore";

export interface IEscort {
  id: string;
  agencyId?: string; // Reference to agency if belongs to one
  isAgencyOwned: boolean; // true if belongs to agency, false if independent

  // Basic Info
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  whatsapp?: string;

  // Personal Info
  age: number;
  gender: "male" | "female" | "transgender" | "non-binary";
  ethnicity: string[];
  nationality: string;
  languages: string[];

  // Physical Attributes
  height: number; // in cm
  weight: number; // in kg
  bust?: number; // in cm
  waist?: number; // in cm
  hips?: number; // in cm
  hairColor: string;
  eyeColor: string;
  bodyType: string;
  tattoos: boolean;
  piercings: boolean;

  // Professional Info
  experience: number; // years
  services: string[];
  specialties: string[];
  availability: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };

  // Location
  country: string;
  county: string;
  region: string;
  town: string;

  // Pricing
  pricing: {
    incall: {
      hour: number;
      twoHours: number;
      overnight: number;
    };
    outcall: {
      hour: number;
      twoHours: number;
      overnight: number;
    };
  };

  // Media
  profileImage: string;
  gallery: string[];
  videos: string[];

  // Verification
  isVerified: boolean;
  verificationStatus: "pending" | "verified" | "rejected";
  verificationDocuments?: {
    idProof?: string;
    idBack?: string;
    selfieWithId?: string;
    policeClearance?: string;
  };

  // Statistics
  rating: number;
  totalReviews: number;
  totalBookings: number;
  totalViews: number;

  // Status
  isActive: boolean;
  isFeatured: boolean;
  isAvailable: boolean;

  // Timestamps
  joinedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEscortDTO {
  name: string;
  email?: string;
  phone?: string;
  age: number;
  gender?: "male" | "female" | "transgender" | "non-binary";
  ethnicity?: string[];
  nationality?: string;
  languages?: string[];
  height?: number;
  weight?: number;
  hairColor?: string;
  eyeColor?: string;
  services?: string[];
  pricing?: {
    incall: { hour: number; twoHours: number; overnight: number };
    outcall: { hour: number; twoHours: number; overnight: number };
  };
  country?: string;
  county?: string;
  region?: string;
  town?: string;
  profileImage?: string;
  gallery?: string[];
}

export interface UpdateEscortDTO extends Partial<CreateEscortDTO> {
  isActive?: boolean;
  isAvailable?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  gallery?: string[];
  videos?: string[];
  agencyId?: string;
  isAgencyOwned?: boolean;
  availability?: {
    monday?: { start: string; end: string; available: boolean };
    tuesday?: { start: string; end: string; available: boolean };
    wednesday?: { start: string; end: string; available: boolean };
    thursday?: { start: string; end: string; available: boolean };
    friday?: { start: string; end: string; available: boolean };
    saturday?: { start: string; end: string; available: boolean };
    sunday?: { start: string; end: string; available: boolean };
  };
}

export interface GetEscortsParams {
  page?: number;
  limit?: number;
  agencyId?: string;
  isAvailable?: boolean;
  isVerified?: boolean;
  minAge?: number;
  maxAge?: number;
  services?: string[];
  minPrice?: number;
  maxPrice?: number;
  county?: string;
  region?: string;
  town?: string;
  isAgencyOwned?: boolean;
  sortBy?: "rating" | "age" | "price" | "createdAt" | "totalViews";
  sortOrder?: "asc" | "desc";
}

export interface Address {
  street?: string;
  city?: string;
  region?: string;
  postcode?: string;
  fullAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}
