export interface Escort {
  id: string;
  clerk_user_id: string | null;
  name: string | null;
  username: string | null;
  preview_photo: string | null;
  labels: string[];
  email: string | null;
  age: string | null;
  telephone: string | null;
  whatsapp_phone: string | null;
  images: string[];
  videos: string[];
  about: string | null;
  availability: string[];
  ethnicity: string;
  nationality: string;
  bust_size: string | null;
  weight: string | null;
  zodiac_sign: string | null;
  sexual_orientation: string | null;
  gender: string;
  languages: string[];
  categories: string[];
  country: string;
  county: string | null;
  county_code: string | null;
  regions: string[];
  primary_region: string | null;
  locations: any[];
  source: string;
  practices: string[];
  bdsm: string[];
  massage: string[];
  extra_services: string[];
  slug: string | null;
  role: string;
  opening_hours: any;
  rates: any[];
  breast_size: string;
  age_category: string;
  character: string;
  hair_color: string;
  experience: string;
  work_type: string;
  agency_id: string | null;
  agency_role: string | null;
  agency_commission_rate: number | null;
  is_agency_featured: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_featured: boolean;
  verification_status: string | null;
  verification_documents: any;
  street: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  utm_source_platform: string | null;
  landing_page: string | null;
  first_touch_at: string | null;
  registration_date: string | null;
  watermark_status: string | null;
  watermark_error: string | null;
  last_processed_at: string | null;
  images_metadata: any;
  total_images_processed: number | null;
  total_images_failed: number | null;
  has_cleaned_images: boolean | null;
  cleaned_images: string[];
  credits: number | null;
  plan_type: string | null;
  plan_is_active: boolean | null;
  plan_features: string[];
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  total_bookings: number;
  total_reviews: number;
  rating: number;
  total_views: number;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_phone: string | null;
  website: string | null;
  owner_id: string;
  country: string;
  county: string | null;
  county_code: string | null;
  region: string | null;
  town: string | null;
  regions: string[];
  primary_region: string | null;
  estate: string | null;
  address: string | null;
  street: string | null;
  postal_code: string | null;
  business_type: string;
  categories: string[];
  opening_hours: any;
  services: string[];
  specialties: string[];
  is_verified: boolean;
  verification_status: string;
  verification_documents: any;
  logo: string | null;
  cover_image: string | null;
  gallery: string[];
  videos: string[];
  establishment_year: number | null;
  languages: string[];
  payment_methods: string[];
  social_media: any;
  plan_type: string | null;
  plan_is_active: boolean | null;
  plan_activated_at: string | null;
  plan_expires_at: string | null;
  plan_features: string[];
  plan_max_employees: number;
  plan_max_gallery_images: number;
  rating: number;
  total_reviews: number;
  total_bookings: number;
  total_views: number;
  featured_employees_count: number;
  credits: number | null;
  is_active: boolean;
  is_featured: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  utm_source_platform: string | null;
  landing_page: string | null;
  first_touch_at: string | null;
  registration_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface County {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_popular: boolean;
  population: number | null;
  area: string | null;
  capital: string | null;
  created_at: string;
  updated_at: string;
}

export interface Region {
  id: string;
  name: string;
  county_code: string | null;
  county: string | null;
  county_numeric_code: string | null;
  county_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  town: string | null;
  estate: string | null;
  address: string | null;
  street: string | null;
  postal_code: string | null;
  notes: string | null;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: any;
  main_image: string | null;
  categories: string[];
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
  author_id: string | null;
  views: number;
  estimated_reading_time: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Transaction {
  id: string;
  checkout_request_id: string;
  user_id: string | null;
  escort_id: string | null;
  agency_id: string | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  phone_number: string | null;
  callback_url: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface LookupItem {
  id: string;
  name: string;
  slug: string | null;
  value: string | number | null;
}

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
  minAge?: number;
  maxAge?: number;
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  search?: string;
  minRating?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'age' | 'totalViews' | 'rating' | 'totalBookings';
  sortOrder?: 'asc' | 'desc';
}

export interface GetEscortsResponse {
  escorts: Escort[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}