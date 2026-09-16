import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Pool } from 'pg';
import { readFileSync } from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL || DATABASE_URL.includes('user:password')) {
  console.error('ERROR: DATABASE_URL is not set or is a placeholder');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const serviceAccount = JSON.parse(
  readFileSync('./kenyadivas-ffc51-firebase-adminsdk-fbsvc-db0cdd5da9.json', 'utf8')
);

const firebaseApp = !getApps().length
  ? initializeApp({ credential: cert(serviceAccount) })
  : getApps()[0];

const adminDb = getFirestore(firebaseApp);

const toJson = (val: any) => {
  if (!val) return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") {
    if (val._seconds && val._nanoseconds !== undefined) {
      return new Date(val._seconds * 1000 + val._nanoseconds / 1000000).toISOString();
    }
    if (val.toDate && typeof val.toDate === "function") {
      try {
        return val.toDate().toISOString();
      } catch {
        // ignore
      }
    }
  }
  return val;
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDb() {
  console.log('⏳ Waiting for Neon database...');
  let retries = 30;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ Connected to Neon');
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
  batchSize = 100,
) {
  console.log(`\n📦 Migrating: ${collectionName}`);
  const snapshot = await adminDb.collection(collectionName).get();
  const docs = snapshot.docs;
  console.log(`  Found ${docs.length} documents`);

  if (docs.length === 0) {
    console.log('  Skipped (empty)');
    return;
  }

  let migrated = 0;
  let failed = 0;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);

    try {
      const values: any[] = [];
      const insertSql: string[] = [];

      for (let j = 0; j < batch.length; j++) {
        const data = batch[j].data();
        const id = batch[j].id;
        const rowData = transformFn(data, id);
        const columns = Object.keys(rowData);
        const rowValues = Object.values(rowData);

        const sqlCols = columns.map((c) => `"${c}"`).join(', ');
        const placeholders = columns.map((_, idx) => `$${values.length + idx + 1}`).join(', ');
        insertSql.push(`(${placeholders})`);
        values.push(...rowValues);
      }

      const sqlCols = Object.keys(transformFn(batch[0].data(), batch[0].id)).map((c) => `"${c}"`).join(', ');
      const updateSet = Object.keys(transformFn(batch[0].data(), batch[0].id)).map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');

      const query = `
        INSERT INTO "${collectionName}" (${sqlCols}) VALUES ${insertSql.join(', ')}
        ON CONFLICT (id) DO UPDATE SET ${updateSet}
      `;

      try {
        await pool.query(query, values);
        migrated += batch.length;
      } catch (err: any) {
        // Fall back to individual inserts
        for (let j = 0; j < batch.length; j++) {
          try {
            const data = batch[j].data();
            const id = batch[j].id;
            const rowData = transformFn(data, id);
            const columns = Object.keys(rowData);
            const rowValues = Object.values(rowData);
            const sqlCols = columns.map((c) => `"${c}"`).join(', ');
            const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
            const updateSet = columns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(', ');

            await pool.query(
              `INSERT INTO "${collectionName}" (${sqlCols}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
              rowValues
            );
            migrated++;
          } catch (err2: any) {
            console.error(`  Row ${i + j} error: ${err2.message?.substring(0, 150)}`);
            failed++;
          }
        }
      }

      if ((i / batchSize) % 5 === 0 || i + batch.length >= docs.length) {
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

  console.log('Starting Firestore to Neon migration\n');

  await migrateCollection('counties', (data, id) => ({
    id, name: data.name, code: data.code, description: data.description,
    is_popular: data.isPopular ?? false, population: data.population, area: data.area,
    capital: data.capital, created_at: toJson(data.createdAt) || new Date(), updated_at: toJson(data.updatedAt) || new Date(),
  }), 200);

  await migrateCollection('regions', (data, id) => ({
    id, name: data.name, county_code: data.countyCode, county: data.county,
    county_numeric_code: data.countyNumericCode, county_id: data.countyId, is_active: data.isActive ?? true,
    created_at: toJson(data.createdAt) || new Date(), updated_at: toJson(data.updatedAt) || new Date(),
    town: data.town, estate: data.estate, address: data.address, street: data.street,
    postal_code: data.postalCode, notes: data.notes,
  }), 200);

  await migrateCollection('blogCategories', (data, id) => ({
    id, name: data.name, slug: data.slug, description: data.description,
    icon: data.icon, color: data.color, created_at: toJson(data.createdAt) || new Date(), updated_at: toJson(data.updatedAt) || new Date(),
  }), 200);

  await migrateCollection('escorts', (data, id) => ({
    id, clerk_user_id: data.clerkUserId, name: data.name, username: data.username,
    preview_photo: data.previewPhoto, labels: JSON.stringify(data.labels || []), email: data.email, age: data.age,
    telephone: data.telephone, whatsapp_phone: data.whatsappPhone, images: JSON.stringify(data.images || []), videos: JSON.stringify(data.videos || []),
    about: data.about, availability: JSON.stringify(data.availability || []), ethnicity: data.ethnicity || '', nationality: data.nationality || '',
    bust_size: data.bustSize, weight: data.weight, zodiac_sign: data.zodiacSign, sexual_orientation: data.sexualOrientation,
    gender: data.gender || 'girl', languages: JSON.stringify(data.languages || []), categories: JSON.stringify(data.categories || []), country: data.country || 'Kenya',
    county: data.county, county_code: data.countyCode, regions: JSON.stringify(data.regions || []), primary_region: data.primaryRegion,
    locations: JSON.stringify(data.locations || []), source: data.source || 'custom', practices: JSON.stringify(data.practices || []),
    bdsm: JSON.stringify(data.bdsm || []), massage: JSON.stringify(data.massage || []), extra_services: JSON.stringify(data.extraServices || []), slug: data.slug, role: data.role || 'escort',
    opening_hours: JSON.stringify(data.openingHours || {}), rates: JSON.stringify(data.rates || []), breast_size: data.breastSize || '',
    age_category: data.ageCategory || '', character: data.character || '', hair_color: data.hairColor || '', experience: data.experience || '',
    work_type: data.workType || 'independent', agency_id: data.agencyId, agency_role: data.agencyRole, agency_commission_rate: data.agencyCommissionRate,
    is_agency_featured: data.isAgencyFeatured || false, is_active: data.isActive ?? true, is_verified: data.isVerified ?? false,
    is_featured: data.isFeatured ?? false, verification_status: data.verificationStatus, verification_documents: JSON.stringify(data.verificationDocuments),
    street: data.street, utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign, utm_content: data.utm_content,
    utm_term: data.utm_term, utm_id: data.utm_id, utm_source_platform: data.utm_source_platform, landing_page: data.landing_page,
    first_touch_at: data.first_touch_at, registration_date: data.registration_date, watermark_status: data.watermarkStatus, watermark_error: data.watermarkError,
    last_processed_at: data.lastProcessedAt ? toJson(data.lastProcessedAt) : null, images_metadata: JSON.stringify(data.imagesMetadata || {}),
    total_images_processed: data.totalImagesProcessed, total_images_failed: data.totalImagesFailed, has_cleaned_images: data.hasCleanedImages, cleaned_images: JSON.stringify(data.cleanedImages || []),
    credits: data.credits, plan_type: data.plan?.type, plan_is_active: data.plan?.isActive, plan_features: JSON.stringify(data.plan?.features || []),
    plan_activated_at: data.plan?.activatedAt ? toJson(data.plan.activatedAt) : null, plan_expires_at: data.plan?.expiresAt ? toJson(data.plan.expiresAt) : null,
    total_bookings: data.totalBookings || 0, total_reviews: data.totalReviews || 0, rating: data.rating || 0, total_views: data.totalViews || 0,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(), updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 50);

  await migrateCollection('agencies', (data, id) => ({
    id, name: data.name, slug: data.slug, description: data.description, contact_email: data.contactEmail,
    contact_phone: data.contactPhone, whatsapp_phone: data.whatsappPhone, website: data.website, owner_id: data.ownerId,
    country: data.country || 'Kenya', county: data.county, county_code: data.countyCode, region: data.region, town: data.town,
    regions: JSON.stringify(data.regions || (data.region ? [data.region] : [])), primary_region: data.primaryRegion || data.region,
    estate: data.estate, address: data.address, street: data.street, postal_code: data.postalCode, business_type: data.businessType || 'agency',
    categories: JSON.stringify(data.categories || []), opening_hours: JSON.stringify(data.openingHours || {}), services: JSON.stringify(data.services || []), specialties: JSON.stringify(data.specialties || []),
    is_verified: data.isVerified || false, verification_status: data.verificationStatus || 'pending', verification_documents: JSON.stringify(data.verificationDocuments),
    logo: data.logo, cover_image: data.coverImage, gallery: JSON.stringify(data.gallery || []), videos: JSON.stringify(data.videos || []), establishment_year: data.establishmentYear,
    languages: JSON.stringify(data.languages || ['English']), payment_methods: JSON.stringify(data.paymentMethods || ['Cash', 'M-Pesa']), social_media: JSON.stringify(data.socialMedia),
    plan_type: data.plan?.type, plan_is_active: data.plan?.isActive, plan_activated_at: data.plan?.activatedAt ? toJson(data.plan.activatedAt) : null,
    plan_expires_at: data.plan?.expiresAt ? toJson(data.plan.expiresAt) : null, plan_features: JSON.stringify(data.plan?.features || []), plan_max_employees: data.plan?.maxEmployees || 5,
    plan_max_gallery_images: data.plan?.maxGalleryImages || 10, rating: data.rating || 0, total_reviews: data.totalReviews || 0, total_bookings: data.totalBookings || 0,
    total_views: data.totalViews || 0, featured_employees_count: data.featuredEmployeesCount || 0, credits: data.credits,
    is_active: data.isActive ?? true, is_featured: data.isFeatured || false, utm_source: data.utm_source, utm_medium: data.utm_medium, utm_campaign: data.utm_campaign,
    utm_content: data.utm_content, utm_term: data.utm_term, utm_id: data.utm_id, utm_source_platform: data.utm_source_platform, landing_page: data.landing_page,
    first_touch_at: data.first_touch_at, registration_date: data.registration_date, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 50);

  await migrateCollection('blog', (data, id) => ({
    id, title: data.title, slug: data.slug || data.title?.toLowerCase().replace(/\s+/g, '-'), excerpt: data.excerpt, body: JSON.stringify(data.body || {}),
    main_image: data.mainImage, categories: JSON.stringify(data.categories || []), tags: JSON.stringify(data.tags || []), is_published: data.isPublished ?? true, is_featured: data.isFeatured ?? false,
    author_id: data.authorId, views: data.views || 0, estimated_reading_time: data.estimatedReadingTime, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(), published_at: data.publishedAt ? toJson(data.publishedAt) : null,
  }), 50);

  await migrateCollection('blogComments', (data, id) => ({
    id, post_slug: data.postSlug, author_name: data.authorName, content: data.content, is_approved: data.isApproved || false,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 100);

  await migrateCollection('transactions', (data, id) => ({
    id, checkout_request_id: data.checkoutRequestId, user_id: data.userId, escort_id: data.escortId, agency_id: data.agencyId,
    amount: data.amount, currency: data.currency || 'KES', status: data.status, payment_method: data.paymentMethod, phone_number: data.phoneNumber,
    callback_url: data.callbackUrl, metadata: JSON.stringify(data.metadata || {}), created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 100);

  await migrateCollection('whatsappCampaigns', (data, id) => ({
    id, campaign_id: data.campaignId, name: data.name, phone_number: data.phoneNumber, message: data.message, status: data.status,
    scheduled_at: data.scheduledAt ? toJson(data.scheduledAt) : null, sent_at: data.sentAt ? toJson(data.sentAt) : null, delivered_at: data.deliveredAt ? toJson(data.deliveredAt) : null,
    read_at: data.readAt ? toJson(data.readAt) : null, error_message: data.errorMessage, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 100);

  await migrateCollection('whatsappCampaignContacts', (data, id) => ({
    id, campaign_id: data.campaignId, phone_number: data.phoneNumber, status: data.status, error_message: data.errorMessage,
    sent_at: data.sentAt ? toJson(data.sentAt) : null, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 200);

  await migrateCollection('kyc_verifications', (data, id) => ({
    id, event_id: data.eventId, escort_id: data.escortId, agency_id: data.agencyId, verification_type: data.verificationType, status: data.status,
    document_url: data.documentUrl, details: JSON.stringify(data.details || {}), error_message: data.errorMessage,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(), updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 100);

  await migrateCollection('contactSubmissions', (data, id) => ({
    id, name: data.name, email: data.email, subject: data.subject, message: data.message, phone: data.phone,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 200);

  await migrateCollection('cleaningLogs', (data, id) => ({
    id, escort_id: data.escortId, image_url: data.imageUrl, cleaned_url: data.cleanedUrl, cloudinary_url: data.cloudinaryUrl,
    status: data.status, error_message: data.errorMessage, processed_at: data.processedAt ? toJson(data.processedAt) : null,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 100);

  await migrateCollection('processingQueue', (data, id) => ({
    id, escort_id: data.escortId, action: data.action, status: data.status, error_message: data.errorMessage, retry_count: data.retryCount || 0,
    scheduled_at: data.scheduledAt ? toJson(data.scheduledAt) : null, processed_at: data.processedAt ? toJson(data.processedAt) : null,
    created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 100);

  await migrateCollection('processingLogs', (data, id) => ({
    id, escort_id: data.escortId, action: data.action, status: data.status, message: data.message, timestamp: data.timestamp ? toJson(data.timestamp) : new Date(),
  }), 200);

  await migrateCollection('creditRewards', (data, id) => ({
    id, user_id: data.userId, escort_id: data.escortId, agency_id: data.agencyId, action_type: data.actionType, points: data.points,
    description: data.description, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
  }), 200);

  await migrateCollection('users', (data, id) => ({
    id, clerk_user_id: data.clerkUserId, name: data.name, email: data.email, phone: data.phone, role: data.role || 'user',
    agency_id: data.agencyId, is_active: data.isActive ?? true, created_at: data.createdAt ? toJson(data.createdAt) : new Date(),
    updated_at: data.updatedAt ? toJson(data.updatedAt) : new Date(),
  }), 200);

  const lookupCollections = ['lookup_ages', 'lookup_breast_sizes', 'lookup_practices', 'lookup_bdsm', 'lookup_massage', 'lookup_extra_services', 'lookup_categories'];
  for (const col of lookupCollections) {
    await migrateCollection(col, (data, id) => ({
      id, name: data.name, slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'), value: data.value,
    }), 200);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration complete!');
  console.log('='.repeat(50));
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
