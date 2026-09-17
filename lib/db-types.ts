// Database types for Neon DB (PostgreSQL)
// These mirror the Firestore document structures

// ============================================
// ESCORT TYPES
// ============================================

export interface DbEscort {
  id: string;
  name: string;
  username: string;
  preview_photo: string;
  labels: string[];
  email: string;
  age: string;
  telephone: string;
  whatsapp_phone: string;
  images: string[];
  videos: string[];
  about: string;
  availability: string[];
  ethnicity: string;
  nationality: string;
  bust_size: string;
  weight: string;
  zodiac_sign: string;
  sexual_orientation: string;
  gender: string;
  languages: string[];
  categories: string[];
  country: string;
  county: string;
  county_code: string;
  regions: string[];
  primary_region: string;
  locations: DbLocation[];
  source: string;
  practices: string[];
  bdsm: string[];
  massage: string[];
  extra_services: string[];
  slug: string;
  role: string;
  opening_hours: DbOpeningHours;
  rates: DbRate[];
  breast_size: string;
  age_category: string;
  character: string;
  hair_color: string;
  experience: string;
  work_type: string;
  agency_id?: string;
  is_agency_owned?: boolean;
  clerk_user_id?: string;
  is_agency_featured: boolean;
  is_active: boolean;
  is_verified: boolean;
  verification_status?: "pending" | "verified" | "rejected";
  verification_documents?: DbVerificationDocuments;
  is_featured: boolean;
  plan: DbPlan;
  total_bookings: number;
  total_reviews: number;
  rating: number;
  total_views: number;
  credits?: number;
  cleaned_images?: string[];
  created_at: string;
  updated_at: string;
  // Watermark tracking fields
  watermark_status?: "pending" | "processing" | "completed" | "failed";
  watermark_error?: string;
  last_processed_at?: string;
  images_metadata?: Record<string, DbImageMetadata>;
  total_images_processed?: number;
  total_images_failed?: number;
  has_cleaned_images?: boolean;
  street?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  utm_source_platform?: string;
  landing_page?: string;
  first_touch_at?: string;
  registration_date?: string;
}

export interface DbLocation {
  region: string;
  town: string;
  estate: string;
  address: string;
  street: string;
  postal_code: string;
  is_active: boolean;
  notes: string;
  _id?: string;
}

export interface DbOpeningHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface DbRate {
  duration: string;
  incall: string;
  outcall: string;
  _id?: string;
}

export interface DbVerificationDocuments {
  id_proof?: string;
  id_back?: string;
  selfie_with_id?: string;
  police_clearance?: string;
}

export interface DbImageMetadata {
  cleaned_url?: string;
  cloudinary_url?: string;
  status: "pending" | "processing" | "completed" | "failed";
  error_message?: string;
  processed_at?: string;
  file_size?: number;
  mime_type?: string;
}

export interface DbPlan {
  type: string;
  is_active: boolean;
  features: string[];
  max_employees?: number;
  max_gallery_images?: number;
  activated_at?: string;
  expires_at?: string;
}

// ============================================
// AGENCY TYPES
// ============================================

export interface DbAgency {
  id: string;
  name: string;
  slug: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_phone?: string;
  website?: string;
  owner_id: string;
  country: string;
  county: string;
  county_code: string;
  region: string;
  town: string;
  regions: string[];
  primary_region: string;
  estate?: string;
  address?: string;
  street?: string;
  postal_code?: string;
  business_type: "agency" | "independent" | "parlour" | "massage_parlour" | "spa" | "club";
  categories: string[];
  opening_hours: DbOpeningHours;
  services: string[];
  specialties: string[];
  is_verified: boolean;
  verification_status: "pending" | "under_review" | "verified" | "rejected";
  verification_documents?: Record<string, any>;
  logo?: string;
  cover_image?: string;
  gallery: string[];
  videos: string[];
  establishment_year?: number;
  languages: string[];
  payment_methods: string[];
  social_media?: Record<string, string>;
  plan: DbPlan;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  total_views: number;
  featured_employees_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  utm_source_platform?: string;
  landing_page?: string;
  first_touch_at?: string;
  registration_date?: string;
}

// ============================================
// COUNTY TYPES
// ============================================

export interface DbCounty {
  id: string;
  name: string;
  code: string;
  slug: string;
  description?: string;
  is_popular: boolean;
  population?: number;
  area?: string;
  capital?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// REGION TYPES
// ============================================

export interface DbRegion {
  id: string;
  name: string;
  county_code: string;
  county: string;
  county_numeric_code?: string;
  county_id: string;
  is_active: boolean;
  town?: string;
  estate?: string;
  address?: string;
  street?: string;
  postal_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// BLOG TYPES
// ============================================

export interface DbBlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  category_slug: string;
  tags: string[];
  author_id: string;
  author_name?: string;
  is_published: boolean;
  is_featured: boolean;
  views: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  seo_title?: string;
  seo_description?: string;
}

export interface DbBlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// LOOKUP TYPES
// ============================================

export interface DbLookupItem {
  id: string;
  name: string;
  order_index?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// SEARCH/FILTER PARAMS
// ============================================

export interface GetEscortsParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  town?: string;
  estate?: string;
  practice?: string;
  practices?: string[];
  category?: string;
  categories?: string[];
  nationality?: string;
  min_age?: number;
  max_age?: number;
  is_active?: boolean;
  is_verified?: boolean;
  is_featured?: boolean;
  search?: string;
  min_rating?: number;
  sort_by?: "created_at" | "updated_at" | "age" | "total_views" | "rating" | "total_bookings";
  sort_order?: "asc" | "desc";
}

export interface GetEscortsResponse {
  escorts: DbEscort[];
  total: number;
  page: number;
  total_pages: number;
  has_more: boolean;
}

export interface GetAgenciesParams {
  page?: number;
  limit?: number;
  county?: string;
  region?: string;
  business?: string;
  verified?: string;
  featured?: string;
  search?: string;
}

export interface GetAgenciesResponse {
  agencies: DbAgency[];
  total: number;
  page: number;
  total_pages: number;
  has_more: boolean;
}

export interface GetBlogPostsParams {
  page?: number;
  limit?: number;
  category_slug?: string;
  tag?: string;
  author_id?: string;
  featured_only?: boolean;
  search_query?: string;
  sort_by?: "newest" | "popular" | "featured";
}

export interface GetBlogPostsResponse {
  posts: DbBlogPost[];
  categories: DbBlogCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

// ============================================
// TYPE CONVERSION HELPERS (Firestore -> Neon DB format)
// ============================================

/**
 * Converts Firestore timestamp to ISO string
 */
export function firestoreTimestampToIso(timestamp: any): string {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp instanceof Date) return timestamp.toISOString();
  return new Date(timestamp).toISOString();
}

/**
 * Converts Firestore array-like object to array
 */
export function firestoreArrayToArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (val == null) return [];
  if (typeof val === "object") {
    const keys = Object.keys(val).sort((a, b) => {
      const an = parseInt(a), bn = parseInt(b);
      if (isNaN(an) && isNaN(bn)) return 0;
      if (isNaN(an)) return 1;
      if (isNaN(bn)) return -1;
      return an - bn;
    });
    return keys.map((k) => String(val[k]));
  }
  return [String(val)];
}

/**
 * Converts DbEscort to the Escort interface used in the app
 */
export function dbEscortToAppEscort(db: DbEscort): any {
  return {
    ...db,
    // Convert snake_case to camelCase for app compatibility
    previewPhoto: db.preview_photo,
    whatsappPhone: db.whatsapp_phone,
    bustSize: db.bust_size,
    zodiacSign: db.zodiac_sign,
    sexualOrientation: db.sexual_orientation,
    countyCode: db.county_code,
    primaryRegion: db.primary_region,
    extraServices: db.extra_services,
    isAgencyOwned: db.is_agency_owned,
    clerkUserId: db.clerk_user_id,
    isAgencyFeatured: db.is_agency_featured,
    isActive: db.is_active,
    isVerified: db.is_verified,
    verificationStatus: db.verification_status,
    verificationDocuments: db.verification_documents,
    isFeatured: db.is_featured,
    totalBookings: db.total_bookings,
    totalReviews: db.total_reviews,
    totalViews: db.total_views,
    cleanedImages: db.cleaned_images,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    watermarkStatus: db.watermark_status,
    watermarkError: db.watermark_error,
    lastProcessedAt: db.last_processed_at,
    imagesMetadata: db.images_metadata,
    totalImagesProcessed: db.total_images_processed,
    totalImagesFailed: db.total_images_failed,
    hasCleanedImages: db.has_cleaned_images,
    utm_source: db.utm_source,
    utm_medium: db.utm_medium,
    utm_campaign: db.utm_campaign,
    utm_content: db.utm_content,
    utm_term: db.utm_term,
    utm_id: db.utm_id,
    utm_source_platform: db.utm_source_platform,
    landing_page: db.landing_page,
    first_touch_at: db.first_touch_at,
    registration_date: db.registration_date,
  };
}

/**
 * Converts DbAgency to the IAgency interface used in the app
 */
export function dbAgencyToAppAgency(db: DbAgency): any {
  return {
    ...db,
    contactEmail: db.contact_email,
    contactPhone: db.contact_phone,
    whatsappPhone: db.whatsapp_phone,
    ownerId: db.owner_id,
    countyCode: db.county_code,
    primaryRegion: db.primary_region,
    businessType: db.business_type,
    isVerified: db.is_verified,
    verificationStatus: db.verification_status,
    verificationDocuments: db.verification_documents,
    coverImage: db.cover_image,
    establishmentYear: db.establishment_year,
    paymentMethods: db.payment_methods,
    socialMedia: db.social_media,
    isActive: db.is_active,
    isFeatured: db.is_featured,
    featuredEmployeesCount: db.featured_employees_count,
    totalReviews: db.total_reviews,
    totalBookings: db.total_bookings,
    totalViews: db.total_views,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    utm_source: db.utm_source,
    utm_medium: db.utm_medium,
    utm_campaign: db.utm_campaign,
    utm_content: db.utm_content,
    utm_term: db.utm_term,
    utm_id: db.utm_id,
    utm_source_platform: db.utm_source_platform,
    landing_page: db.landing_page,
    first_touch_at: db.first_touch_at,
    registration_date: db.registration_date,
  };
}

/**
 * Converts DbCounty to the ICounty interface used in the app
 */
export function dbCountyToAppCounty(db: DbCounty): any {
  return {
    ...db,
    isPopular: db.is_popular,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Converts DbRegion to the IRegion interface used in the app
 */
export function dbRegionToAppRegion(db: DbRegion): any {
  return {
    ...db,
    countyCode: db.county_code,
    countyNumericCode: db.county_numeric_code,
    countyId: db.county_id,
    isActive: db.is_active,
    postalCode: db.postal_code,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/**
 * Converts DbBlogPost to the app blog post format
 */
export function dbBlogPostToAppPost(db: DbBlogPost): any {
  return {
    ...db,
    coverImage: db.cover_image,
    categorySlug: db.category_slug,
    authorId: db.author_id,
    authorName: db.author_name,
    isPublished: db.is_published,
    isFeatured: db.is_featured,
    publishedAt: db.published_at,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    seoTitle: db.seo_title,
    seoDescription: db.seo_description,
  };
}

/**
 * Converts DbBlogCategory to the app blog category format
 */
export function dbBlogCategoryToAppCategory(db: DbBlogCategory): any {
  return {
    ...db,
    orderIndex: db.order_index,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}