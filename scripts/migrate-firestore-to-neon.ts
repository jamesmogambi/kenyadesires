import { neon } from '@neondatabase/serverless';
import { adminDb } from '@/lib/firebase-admin';

const sql = neon(process.env.DATABASE_URL!);

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDb() {
  console.log('⏳ Waiting for Neon database...');
  let retries = 30;
  while (retries > 0) {
    try {
      await sql`SELECT 1`;
      console.log('✅ Database connected');
      return;
    } catch {
      retries--;
      console.log(`  Retrying... (${retries} left)`);
      await sleep(2000);
    }
  }
  throw new Error('Could not connect to Neon database');
}

async function migrateCollection(
  collectionName: string,
  transformFn: (doc: any, id: string) => any,
  batchSize = 200,
) {
  console.log(`\n📦 Migrating: ${collectionName}`);
  const snapshot = await adminDb.collection(collectionName).get();
  const docs = snapshot.docs;
  console.log(`  Found ${docs.length} documents`);

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    try {
      for (const doc of batch) {
        const data = doc.data();
        const id = doc.id;
        const rowData = transformFn(data, id);
        const columns = Object.keys(rowData);
        const values = Object.values(rowData);
        const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
        const colNames = columns.join(', ');

        try {
          await sql`INSERT INTO ${sql(rowData.__table || collectionName)} (${sql(colNames)}) VALUES (${sql(...values)})
            ON CONFLICT (id) DO UPDATE SET ${sql(columns.map((c) => `${c} = EXCLUDED.${c}`).join(', '))}`;
          migrated++;
        } catch (err: any) {
          // Fallback: try generic insert
          const sqlCols = columns.map((c) => `"${c}"`).join(', ');
          const sqlVals = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          const updateSet = columns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');
          await sql.raw(
            `INSERT INTO "${collectionName}" (${sqlCols}) VALUES (${sqlVals}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
            ...values,
          );
          migrated++;
        }
      }
      if ((i / batchSize) % 5 === 0) {
        console.log(`  Progress: ${migrated}/${docs.length}`);
      }
    } catch (err: any) {
      console.error(`  Batch error at doc ${i}:`, err.message);
      failed += batch.length;
    }
  }

  console.log(`  ✅ Migrated: ${migrated}, Failed: ${failed}`);
}

async function main() {
  await waitForDb();

  // Create tables (run schema)
  console.log('\n📋 Creating tables...');

  // Counties
  await sql`CREATE TABLE IF NOT EXISTS counties (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, code TEXT, description TEXT, is_popular BOOLEAN DEFAULT FALSE, population INTEGER, area TEXT, capital TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_counties_name ON counties (name)`;

  // Regions
  await sql`CREATE TABLE IF NOT EXISTS regions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, county_code TEXT NOT NULL, county TEXT, county_numeric_code TEXT, county_id TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), town TEXT, estate TEXT, address TEXT, street TEXT, postal_code TEXT, notes TEXT)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_regions_county_code ON regions (county_code)`;

  // Escorts
  await sql`CREATE TABLE IF NOT EXISTS escorts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), clerk_user_id TEXT, name TEXT, username TEXT UNIQUE, preview_photo TEXT, labels TEXT[] DEFAULT '{}', email TEXT, age TEXT, telephone TEXT, whatsapp_phone TEXT, images TEXT[] DEFAULT '{}', videos TEXT[] DEFAULT '{}', about TEXT, availability TEXT[] DEFAULT '{}', ethnicity TEXT DEFAULT '', nationality TEXT DEFAULT '', bust_size TEXT, weight TEXT, zodiac_sign TEXT, sexual_orientation TEXT, gender TEXT DEFAULT 'girl', languages TEXT[] DEFAULT '{}', categories TEXT[] DEFAULT '{}', country TEXT DEFAULT 'Kenya', county TEXT, county_code TEXT, regions TEXT[] DEFAULT '{}', primary_region TEXT, locations JSONB DEFAULT '[]'::jsonb, source TEXT DEFAULT 'custom', practices TEXT[] DEFAULT '{}', bdsm TEXT[] DEFAULT '{}', massage TEXT[] DEFAULT '{}', extra_services TEXT[] DEFAULT '{}', slug TEXT, role TEXT DEFAULT 'escort', opening_hours JSONB DEFAULT '{}'::jsonb, rates JSONB DEFAULT '[]'::jsonb, breast_size TEXT DEFAULT '', age_category TEXT DEFAULT '', character TEXT DEFAULT '', hair_color TEXT DEFAULT '', experience TEXT DEFAULT '', work_type TEXT DEFAULT 'independent', agency_id TEXT, agency_role TEXT, agency_commission_rate NUMERIC(5,2), is_agency_featured BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE, is_verified BOOLEAN DEFAULT FALSE, is_featured BOOLEAN DEFAULT FALSE, verification_status TEXT, verification_documents JSONB, street TEXT, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, utm_id TEXT, utm_source_platform TEXT, landing_page TEXT, first_touch_at TEXT, registration_date TEXT, watermark_status TEXT, watermark_error TEXT, last_processed_at TIMESTAMP WITH TIME ZONE, images_metadata JSONB, total_images_processed INTEGER, total_images_failed INTEGER, has_cleaned_images BOOLEAN, cleaned_images TEXT[] DEFAULT '{}', credits NUMERIC DEFAULT 0, plan_type TEXT DEFAULT 'basic', plan_is_active BOOLEAN DEFAULT TRUE, plan_features TEXT[] DEFAULT '{}', plan_activated_at TIMESTAMP WITH TIME ZONE, plan_expires_at TIMESTAMP WITH TIME ZONE, total_bookings INTEGER DEFAULT 0, total_reviews INTEGER DEFAULT 0, rating NUMERIC(3,2) DEFAULT 0, total_views INTEGER DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_clerk_user_id ON escorts (clerk_user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_username ON escorts (username)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_is_active ON escorts (is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_is_verified ON escorts (is_verified)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_is_featured ON escorts (is_featured)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_gender ON escorts (gender)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_regions ON escorts USING GIN (regions)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_escorts_slug ON escorts (slug)`;

  // Agencies
  await sql`CREATE TABLE IF NOT EXISTS agencies (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, description TEXT, contact_email TEXT, contact_phone TEXT, whatsapp_phone TEXT, website TEXT, owner_id TEXT NOT NULL, country TEXT DEFAULT 'Kenya', county TEXT, county_code TEXT, region TEXT, town TEXT, regions TEXT[] DEFAULT '{}', primary_region TEXT, estate TEXT, address TEXT, street TEXT, postal_code TEXT, business_type TEXT DEFAULT 'agency', categories TEXT[] DEFAULT '{}', opening_hours JSONB DEFAULT '{}'::jsonb, services TEXT[] DEFAULT '{}', specialties TEXT[] DEFAULT '{}', is_verified BOOLEAN DEFAULT FALSE, verification_status TEXT DEFAULT 'pending', verification_documents JSONB, logo TEXT, cover_image TEXT, gallery TEXT[] DEFAULT '{}', videos TEXT[] DEFAULT '{}', establishment_year INTEGER, languages TEXT[] DEFAULT '{"English"}', payment_methods TEXT[] DEFAULT '{"Cash", "M-Pesa"}', social_media JSONB, plan_type TEXT DEFAULT 'basic', plan_is_active BOOLEAN DEFAULT TRUE, plan_activated_at TIMESTAMP WITH TIME ZONE, plan_expires_at TIMESTAMP WITH TIME ZONE, plan_features TEXT[] DEFAULT '{}', plan_max_employees INTEGER DEFAULT 5, plan_max_gallery_images INTEGER DEFAULT 10, rating NUMERIC(3,2) DEFAULT 0, total_reviews INTEGER DEFAULT 0, total_bookings INTEGER DEFAULT 0, total_views INTEGER DEFAULT 0, featured_employees_count INTEGER DEFAULT 0, credits NUMERIC, is_active BOOLEAN DEFAULT TRUE, is_featured BOOLEAN DEFAULT FALSE, utm_source TEXT, utm_medium TEXT, utm_campaign TEXT, utm_content TEXT, utm_term TEXT, utm_id TEXT, utm_source_platform TEXT, landing_page TEXT, first_touch_at TEXT, registration_date TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies (owner_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON agencies (is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies (slug)`;

  // Blog Posts
  await sql`CREATE TABLE IF NOT EXISTS blog_posts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, excerpt TEXT, body JSONB, main_image TEXT, categories TEXT[] DEFAULT '{}', tags TEXT[] DEFAULT '{}', is_published BOOLEAN DEFAULT TRUE, is_featured BOOLEAN DEFAULT FALSE, author_id TEXT, views INTEGER DEFAULT 0, estimated_reading_time INTEGER, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), published_at TIMESTAMP WITH TIME ZONE)`;

  // Blog Comments
  await sql`CREATE TABLE IF NOT EXISTS blog_comments (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), post_slug TEXT NOT NULL, author_name TEXT, content TEXT, is_approved BOOLEAN DEFAULT FALSE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Transactions
  await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), checkout_request_id TEXT UNIQUE NOT NULL, user_id TEXT, escort_id TEXT, agency_id TEXT, amount NUMERIC, currency TEXT DEFAULT 'KES', status TEXT DEFAULT 'pending', payment_method TEXT, phone_number TEXT, callback_url TEXT, metadata JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // WhatsApp Campaigns
  await sql`CREATE TABLE IF NOT EXISTS whatsapp_campaigns (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id TEXT UNIQUE NOT NULL, name TEXT, phone_number TEXT, message TEXT, status TEXT DEFAULT 'pending', scheduled_at TIMESTAMP WITH TIME ZONE, sent_at TIMESTAMP WITH TIME ZONE, delivered_at TIMESTAMP WITH TIME ZONE, read_at TIMESTAMP WITH TIME ZONE, error_message TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // WhatsApp Campaign Contacts
  await sql`CREATE TABLE IF NOT EXISTS whatsapp_campaign_contacts (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id TEXT, phone_number TEXT NOT NULL, status TEXT DEFAULT 'pending', error_message TEXT, sent_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // KYC Verifications
  await sql`CREATE TABLE IF NOT EXISTS kyc_verifications (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), event_id TEXT UNIQUE NOT NULL, escort_id TEXT, agency_id TEXT, verification_type TEXT, status TEXT, document_url TEXT, details JSONB, error_message TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Escort Images
  await sql`CREATE TABLE IF NOT EXISTS escort_images (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), escort_id TEXT NOT NULL, image_url TEXT NOT NULL, cleaned_url TEXT, cloudinary_url TEXT, status TEXT DEFAULT 'pending', error_message TEXT, processed_at TIMESTAMP WITH TIME ZONE, file_size INTEGER, mime_type TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Cleaning Logs
  await sql`CREATE TABLE IF NOT EXISTS cleaning_logs (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), escort_id TEXT NOT NULL, image_url TEXT NOT NULL, cleaned_url TEXT, cloudinary_url TEXT, status TEXT DEFAULT 'pending', error_message TEXT, processed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Image Sync Trackers
  await sql`CREATE TABLE IF NOT EXISTS image_sync_trackers (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), escort_id TEXT NOT NULL, last_synced_at TIMESTAMP WITH TIME ZONE, total_images INTEGER DEFAULT 0, status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Processing Queue
  await sql`CREATE TABLE IF NOT EXISTS processing_queue (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), escort_id TEXT, action TEXT NOT NULL, status TEXT DEFAULT 'pending', error_message TEXT, retry_count INTEGER DEFAULT 0, scheduled_at TIMESTAMP WITH TIME ZONE, processed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Processing Logs
  await sql`CREATE TABLE IF NOT EXISTS processing_logs (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), escort_id TEXT, action TEXT, status TEXT, message TEXT, timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Contact Submissions
  await sql`CREATE TABLE IF NOT EXISTS contact_submissions (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT, message TEXT, phone TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Credit Rewards
  await sql`CREATE TABLE IF NOT EXISTS credit_rewards (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, escort_id TEXT, agency_id TEXT, action_type TEXT NOT NULL, points INTEGER NOT NULL, description TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())`;

  // Lookup Tables
  await sql`CREATE TABLE IF NOT EXISTS lookup_ages (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, value INTEGER)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_breast_sizes (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, value TEXT)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_practices (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_bdsm (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_massage (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_extra_services (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL)`;
  await sql`CREATE TABLE IF NOT EXISTS lookup_categories (id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL)`;

  // Counties
  await migrateCollection('counties', (data, id) => ({
    id, name: data.name, code: data.code, description: data.description,
    is_popular: data.isPopular ?? false, population: data.population, area: data.area,
    capital: data.capital, created_at: data.createdAt || new Date(), updated_at: data.updatedAt || new Date(),
  }));

  // Regions
  await migrateCollection('regions', (data, id) => ({
    id, name: data.name, county_code: data.countyCode, county: data.county,
    county_numeric_code: data.countyNumericCode, county_id: data.countyId, is_active: data.isActive ?? true,
    created_at: data.createdAt || new Date(), updated_at: data.updatedAt || new Date(),
    town: data.town, estate: data.estate, address: data.address, street: data.street,
    postal_code: data.postalCode, notes: data.notes,
  }));

  // Escorts (most complex - needs JSONB conversion)
  await migrateCollection('escorts', (data, id) => {
    const toJson = (val: any) => {
      if (val instanceof Date) return val.toISOString();
      if (val && typeof val === 'object' && val.toDate) return val.toDate().toISOString();
      return val;
    };
    return {
      id, clerk_user_id: data.clerkUserId, name: data.name, username: data.username,
      preview_photo: data.previewPhoto, labels: data.labels || [], email: data.email, age: data.age,
      telephone: data.telephone, whatsapp_phone: data.whatsappPhone, images: data.images || [], videos: data.videos || [],
      about: data.about, availability: data.availability || [], ethnicity: data.ethnicity || '', nationality: data.nationality || '',
      bust_size: data.bustSize, weight: data.weight, zodiac_sign: data.zodiacSign, sexual_orientation: data.sexualOrientation,
      gender: data.gender || 'girl', languages: data.languages || [], categories: data.categories || [], country: data.country || 'Kenya',
      county: data.county, county_code: data.countyCode, regions: data.regions || [], primary_region: data.primaryRegion,
      locations: JSON.stringify(data.locations || []), source: data.source || 'custom', practices: data.practices || [],
      bdsm: data.bdsm || [], massage: data.massage || [], extra_services: data.extraServices || [], slug: data.slug, role: data.role || 'escort',
      opening_hours: JSON.stringify(data.openingHours || {}), rates: JSON.stringify(data.rates || []), breast_size: data.breastSize || '',
      age_category: data.ageCategory || '', character: data.character || '', hair_color: data.hairColor || '', experience: data.experience || '',
      work_type: data.workType || 'independent', agency_id: data.agencyId, agency_role: data.agencyRole, agency_commission_rate: data.agencyCommissionRate,
      is_agency_featured: data.isAgencyFeatured || false, is_active: data.isActive ?? true, is_verified: data.isVerified ?? false,
      is_featured: data.isFeatured ?? false, verification_status: data.verificationStatus, verification_documents: JSON.stringify(data.verificationDocuments),
      street: data.street, utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign, utm_content: data.utm_content,
      utm_term: data.utm_term, utm_id: data.utm_id, utm_source_platform: data.utm_source_platform, landing_page: data.landing_page,
      first_touch_at: data.first_touch_at, registration_date: data.registration_date, watermark_status: data.watermarkStatus, watermark_error: data.watermarkError,
      last_processed_at: data.lastProcessedAt ? toJson(data.lastProcessedAt) : null, images_metadata: JSON.stringify(data.imagesMetadata || {}),
      total_images_processed: data.totalImagesProcessed, total_images_failed: data.totalImagesFailed, has_cleaned_images: data.hasCleanedImages, cleaned_images: data.cleanedImages || [],
      credits: data.credits, plan_type: data.plan?.type, plan_is_active: data.plan?.isActive, plan_features: data.plan?.features || [],
      plan_activated_at: data.plan?.activatedAt ? toJson(data.plan.activatedAt) : null, plan_expires_at: data.plan?.expiresAt ? toJson(data.plan.expiresAt) : null,
      total_bookings: data.totalBookings || 0, total_reviews: data.totalReviews || 0, rating: data.rating || 0, total_views: data.totalViews || 0,
      created_at: data.createdAt ? toJson(data.createdAt) : new Date(), updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
    };
  });

  // Agencies
  await migrateCollection('agencies', (data, id) => ({
    id, name: data.name, slug: data.slug, description: data.description, contact_email: data.contactEmail,
    contact_phone: data.contactPhone, whatsapp_phone: data.whatsappPhone, website: data.website, owner_id: data.ownerId,
    country: data.country || 'Kenya', county: data.county, county_code: data.countyCode, region: data.region, town: data.town,
    regions: data.regions || (data.region ? [data.region] : []), primary_region: data.primaryRegion || data.region,
    estate: data.estate, address: data.address, street: data.street, postal_code: data.postalCode, business_type: data.businessType || 'agency',
    categories: data.categories || [], opening_hours: JSON.stringify(data.openingHours || {}), services: data.services || [], specialties: data.specialties || [],
    is_verified: data.isVerified || false, verification_status: data.verificationStatus || 'pending', verification_documents: JSON.stringify(data.verificationDocuments),
    logo: data.logo, cover_image: data.coverImage, gallery: data.gallery || [], videos: data.videos || [], establishment_year: data.establishmentYear,
    languages: data.languages || ['English'], payment_methods: data.paymentMethods || ['Cash', 'M-Pesa'], social_media: JSON.stringify(data.socialMedia),
    plan_type: data.plan?.type, plan_is_active: data.plan?.isActive, plan_activated_at: data.plan?.activatedAt ? toJson(data.plan.activatedAt) : null,
    plan_expires_at: data.plan?.expiresAt ? toJson(data.plan.expiresAt) : null, plan_features: data.plan?.features || [], plan_max_employees: data.plan?.maxEmployees || 5,
    plan_max_gallery_images: data.plan?.maxGalleryImages || 10, rating: data.rating || 0, total_reviews: data.totalReviews || 0, total_bookings: data.totalBookings || 0,
    total_views: data.totalViews || 0, featured_employees_count: data.featuredEmployeesCount || 0, credits: data.credits,
    is_active: data.isActive ?? true, is_featured: data.isFeatured || false, utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign,
    utm_content: data.utm_content, utm_term: data.utm_term, utm_id: data.utm_id, utm_source_platform: data.utm_source_platform, landing_page: data.landing_page,
    first_touch_at: data.first_touch_at, registration_date: data.registration_date, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }));

  // Blog Posts
  await migrateCollection('blog', (data, id) => ({
    id, title: data.title, slug: data.slug || data.title?.toLowerCase().replace(/\s+/g, '-'), excerpt: data.excerpt, body: JSON.stringify(data.body || {}),
    main_image: data.mainImage, categories: data.categories || [], tags: data.tags || [], is_published: data.isPublished ?? true, is_featured: data.isFeatured ?? false,
    author_id: data.authorId, views: data.views || 0, estimated_reading_time: data.estimatedReadingTime, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(), published_at: data.publishedAt ? toJson(data.publishedAt) : null,
  }));

  // Blog Comments
  await migrateCollection('blogComments', (data, id) => ({
    id, post_slug: data.postSlug, author_name: data.authorName, content: data.content, is_approved: data.isApproved || false,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }));

  // Transactions
  await migrateCollection('transactions', (data, id) => ({
    id, checkout_request_id: data.checkoutRequestId, user_id: data.userId, escort_id: data.escortId, agency_id: data.agencyId,
    amount: data.amount, currency: data.currency || 'KES', status: data.status, payment_method: data.paymentMethod, phone_number: data.phoneNumber,
    callback_url: data.callbackUrl, metadata: JSON.stringify(data.metadata || {}), created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }));

  // WhatsApp Campaigns
  await migrateCollection('whatsappCampaigns', (data, id) => ({
    id, campaign_id: data.campaignId, name: data.name, phone_number: data.phoneNumber, message: data.message, status: data.status,
    scheduled_at: data.scheduledAt ? toJson(data.scheduledAt) : null, sent_at: data.sentAt ? toJson(data.sentAt) : null, delivered_at: data.deliveredAt ? toJson(data.deliveredAt) : null,
    read_at: data.readAt ? toJson(data.readAt) : null, error_message: data.errorMessage, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }));

  // WhatsApp Campaign Contacts
  await migrateCollection('whatsappCampaignContacts', (data, id) => ({
    id, campaign_id: data.campaignId, phone_number: data.phoneNumber, status: data.status, error_message: data.errorMessage,
    sent_at: data.sentAt ? toJson(data.sentAt) : null, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }));

  // KYC Verifications
  await migrateCollection('kyc_verifications', (data, id) => ({
    id, event_id: data.eventId, escort_id: data.escortId, agency_id: data.agencyId, verification_type: data.verificationType, status: data.status,
    document_url: data.documentUrl, details: JSON.stringify(data.details || {}), error_message: data.errorMessage,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(), updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }));

  // Contact Submissions
  await migrateCollection('contactSubmissions', (data, id) => ({
    id, name: data.name, email: data.email, subject: data.subject, message: data.message, phone: data.phone,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }));

  console.log('\n✅ Migration complete!');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
