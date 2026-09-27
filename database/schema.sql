-- ============================================================
-- Neon Postgres Migration Script
-- Converts all Firestore collections to PostgreSQL tables
-- Run this after creating the database and running the schema
-- ============================================================

-- ============================================================
-- 1. CORE LOOKUP TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS counties (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    code        TEXT,
    description TEXT,
    is_popular  BOOLEAN DEFAULT FALSE,
    population  INTEGER,
    area        TEXT,
    capital     TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_counties_name ON counties (name);
CREATE INDEX IF NOT EXISTS idx_counties_code ON counties (code);

CREATE TABLE IF NOT EXISTS regions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    county_code     TEXT NOT NULL,
    county          TEXT,
    county_numeric_code TEXT,
    county_id       TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    town            TEXT,
    estate          TEXT,
    address         TEXT,
    street          TEXT,
    postal_code     TEXT,
    notes           TEXT
);

CREATE INDEX IF NOT EXISTS idx_regions_county_code ON regions (county_code);
CREATE INDEX IF NOT EXISTS idx_regions_name ON regions (name);
CREATE INDEX IF NOT EXISTS idx_regions_county_id ON regions (county_id);

CREATE TABLE IF NOT EXISTS blog_categories (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    icon        TEXT,
    color       TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. MAIN ENTITY TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS escorts (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id           TEXT,
    name                    TEXT,
    username                TEXT UNIQUE,
    preview_photo           TEXT,
    labels                  TEXT[] DEFAULT '{}',
    email                   TEXT,
    age                     TEXT,
    telephone               TEXT,
    whatsapp_phone          TEXT,
    images                  TEXT[] DEFAULT '{}',
    videos                  TEXT[] DEFAULT '{}',
    about                   TEXT,
    availability            TEXT[] DEFAULT '{}',
    ethnicity               TEXT DEFAULT '',
    nationality             TEXT DEFAULT '',
    bust_size               TEXT,
    weight                  TEXT,
    height                  VARCHAR(191) NOT NULL DEFAULT '',
    breasts                 VARCHAR(191) NOT NULL DEFAULT '',
    zodiac_sign             TEXT,
    sexual_orientation      TEXT,
    gender                  TEXT DEFAULT 'girl',
    languages               TEXT[] DEFAULT '{}',
    categories              TEXT[] DEFAULT '{}',
    country                 TEXT DEFAULT 'Kenya',
    county                  TEXT,
    county_code             TEXT,
    regions                 TEXT[] DEFAULT '{}',
    primary_region          TEXT,
    locations               JSONB DEFAULT '[]'::jsonb,
    source                  TEXT DEFAULT 'custom',
    practices               TEXT[] DEFAULT '{}',
    bdsm                    TEXT[] DEFAULT '{}',
    massage                 TEXT[] DEFAULT '{}',
    extra_services          TEXT[] DEFAULT '{}',
    slug                    TEXT,
    role                    TEXT DEFAULT 'escort',
    opening_hours           JSONB DEFAULT '{}'::jsonb,
    rates                   JSONB DEFAULT '[]'::jsonb,
    breast_size             TEXT DEFAULT '',
    age_category            TEXT DEFAULT '',
    character               TEXT DEFAULT '',
    hair_color              TEXT DEFAULT '',
    experience              TEXT DEFAULT '',
    work_type               TEXT DEFAULT 'independent',
    agency_id               TEXT,
    agency_role             TEXT,
    agency_commission_rate  NUMERIC(5,2),
    is_agency_featured      BOOLEAN DEFAULT FALSE,
    is_active               BOOLEAN DEFAULT TRUE,
    is_verified             BOOLEAN DEFAULT FALSE,
    is_featured             BOOLEAN DEFAULT FALSE,
    verification_status     TEXT,
    verification_documents  JSONB,
    street                  TEXT,
    utm_source              TEXT,
    utm_medium              TEXT,
    utm_campaign            TEXT,
    utm_content             TEXT,
    utm_term                TEXT,
    utm_id                  TEXT,
    utm_source_platform     TEXT,
    landing_page            TEXT,
    first_touch_at          TEXT,
    registration_date       TEXT,
    watermark_status        TEXT,
    watermark_error         TEXT,
    last_processed_at       TIMESTAMP WITH TIME ZONE,
    images_metadata         JSONB,
    total_images_processed  INTEGER,
    total_images_failed     INTEGER,
    has_cleaned_images      BOOLEAN,
    cleaned_images          TEXT[] DEFAULT '{}',
    credits                 NUMERIC DEFAULT 0,
    plan_type               TEXT DEFAULT 'basic',
    plan_is_active          BOOLEAN DEFAULT TRUE,
    plan_features           TEXT[] DEFAULT '{}',
    plan_activated_at       TIMESTAMP WITH TIME ZONE,
    plan_expires_at         TIMESTAMP WITH TIME ZONE,
    total_bookings          INTEGER DEFAULT 0,
    total_reviews           INTEGER DEFAULT 0,
    rating                  NUMERIC(3,2) DEFAULT 0,
    total_views             INTEGER DEFAULT 0,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escorts_clerk_user_id ON escorts (clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_escorts_username ON escorts (username);
CREATE INDEX IF NOT EXISTS idx_escorts_is_active ON escorts (is_active);
CREATE INDEX IF NOT EXISTS idx_escorts_is_verified ON escorts (is_verified);
CREATE INDEX IF NOT EXISTS idx_escorts_is_featured ON escorts (is_featured);
CREATE INDEX IF NOT EXISTS idx_escorts_gender ON escorts (gender);
CREATE INDEX IF NOT EXISTS idx_escorts_county ON escorts (county);
CREATE INDEX IF NOT EXISTS idx_escorts_work_type ON escorts (work_type);
CREATE INDEX IF NOT EXISTS idx_escorts_agency_id ON escorts (agency_id);
CREATE INDEX IF NOT EXISTS idx_escorts_primary_region ON escorts (primary_region);
CREATE INDEX IF NOT EXISTS idx_escorts_slug ON escorts (slug);
CREATE INDEX IF NOT EXISTS idx_escorts_regions ON escorts USING GIN (regions);
CREATE INDEX IF NOT EXISTS idx_escorts_locations ON escorts USING GIN (locations);
CREATE INDEX IF NOT EXISTS idx_escorts_images ON escorts USING GIN (images);
CREATE INDEX IF NOT EXISTS idx_escorts_practices ON escorts USING GIN (practices);
CREATE INDEX IF NOT EXISTS idx_escorts_bdsm ON escorts USING GIN (bdsm);
CREATE INDEX IF NOT EXISTS idx_escorts_massage ON escorts USING GIN (massage);
CREATE INDEX IF NOT EXISTS idx_escorts_extra_services ON escorts USING GIN (extra_services);
CREATE INDEX IF NOT EXISTS idx_escorts_categories ON escorts USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_escorts_languages ON escorts USING GIN (languages);

CREATE TABLE IF NOT EXISTS agencies (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL,
    slug                    TEXT UNIQUE NOT NULL,
    description             TEXT,
    contact_email           TEXT,
    contact_phone           TEXT,
    whatsapp_phone          TEXT,
    website                 TEXT,
    owner_id                TEXT NOT NULL,
    country                 TEXT DEFAULT 'Kenya',
    county                  TEXT,
    county_code             TEXT,
    region                  TEXT,
    town                    TEXT,
    regions                 TEXT[] DEFAULT '{}',
    primary_region          TEXT,
    estate                  TEXT,
    address                 TEXT,
    street                  TEXT,
    postal_code             TEXT,
    business_type           TEXT DEFAULT 'agency',
    categories              TEXT[] DEFAULT '{}',
    opening_hours           JSONB DEFAULT '{}'::jsonb,
    services                TEXT[] DEFAULT '{}',
    specialties             TEXT[] DEFAULT '{}',
    is_verified             BOOLEAN DEFAULT FALSE,
    verification_status     TEXT DEFAULT 'pending',
    verification_documents  JSONB,
    logo                    TEXT,
    cover_image             TEXT,
    gallery                 TEXT[] DEFAULT '{}',
    videos                  TEXT[] DEFAULT '{}',
    establishment_year      INTEGER,
    languages               TEXT[] DEFAULT '{"English"}',
    payment_methods         TEXT[] DEFAULT '{"Cash", "M-Pesa"}',
    social_media            JSONB,
    plan_type               TEXT DEFAULT 'basic',
    plan_is_active          BOOLEAN DEFAULT TRUE,
    plan_activated_at       TIMESTAMP WITH TIME ZONE,
    plan_expires_at         TIMESTAMP WITH TIME ZONE,
    plan_features           TEXT[] DEFAULT '{}',
    plan_max_employees      INTEGER DEFAULT 5,
    plan_max_gallery_images INTEGER DEFAULT 10,
    rating                  NUMERIC(3,2) DEFAULT 0,
    total_reviews           INTEGER DEFAULT 0,
    total_bookings          INTEGER DEFAULT 0,
    total_views             INTEGER DEFAULT 0,
    featured_employees_count INTEGER DEFAULT 0,
    credits                 NUMERIC,
    is_active               BOOLEAN DEFAULT TRUE,
    is_featured             BOOLEAN DEFAULT FALSE,
    utm_source              TEXT,
    utm_medium              TEXT,
    utm_campaign            TEXT,
    utm_content             TEXT,
    utm_term                TEXT,
    utm_id                  TEXT,
    utm_source_platform     TEXT,
    landing_page            TEXT,
    first_touch_at          TEXT,
    registration_date       TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agencies_owner_id ON agencies (owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_is_active ON agencies (is_active);
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies (slug);
CREATE INDEX IF NOT EXISTS idx_agencies_county ON agencies (county);
CREATE INDEX IF NOT EXISTS idx_agencies_region ON agencies (region);
CREATE INDEX IF NOT EXISTS idx_agencies_business_type ON agencies (business_type);
CREATE INDEX IF NOT EXISTS idx_agencies_is_verified ON agencies (is_verified);
CREATE INDEX IF NOT EXISTS idx_agencies_is_featured ON agencies (is_featured);

-- ============================================================
-- 3. BLOG TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS blog_posts (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    excerpt         TEXT,
    body            JSONB,
    main_image      TEXT,
    categories    TEXT[] DEFAULT '{}',
    tags            TEXT[] DEFAULT '{}',
    is_published    BOOLEAN DEFAULT TRUE,
    is_featured     BOOLEAN DEFAULT FALSE,
    author_id       TEXT,
    views           INTEGER DEFAULT 0,
    estimated_reading_time INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON blog_posts (is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts USING GIN (categories);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts (author_id);

CREATE TABLE IF NOT EXISTS blog_comments (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug       TEXT NOT NULL,
    author_name     TEXT,
    content         TEXT,
    is_approved     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments (post_slug);

-- ============================================================
-- 4. PAYMENT TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS transactions (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_request_id TEXT UNIQUE NOT NULL,
    user_id             TEXT,
    escort_id           TEXT,
    agency_id           TEXT,
    amount              NUMERIC,
    currency            TEXT DEFAULT 'KES',
    status              TEXT DEFAULT 'pending',
    payment_method      TEXT,
    phone_number        TEXT,
    callback_url        TEXT,
    metadata            JSONB,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_escort ON transactions (escort_id);
CREATE INDEX IF NOT EXISTS idx_transactions_checkout ON transactions (checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);

-- ============================================================
-- 5. WHATSAPP CAMPAIGN TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     TEXT UNIQUE NOT NULL,
    name            TEXT,
    phone_number    TEXT,
    message         TEXT,
    status          TEXT DEFAULT 'pending',
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    sent_at         TIMESTAMP WITH TIME ZONE,
    delivered_at    TIMESTAMP WITH TIME ZONE,
    read_at         TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_campaign_contacts (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id     TEXT,
    phone_number    TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    error_message   TEXT,
    sent_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_campaign ON whatsapp_campaign_contacts (campaign_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_campaign_contacts (phone_number);

-- ============================================================
-- 6. VERIFICATION TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS kyc_verifications (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id            TEXT UNIQUE NOT NULL,
    escort_id           TEXT,
    agency_id           TEXT,
    verification_type   TEXT,
    status              TEXT,
    document_url        TEXT,
    details             JSONB,
    error_message       TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_escort ON kyc_verifications (escort_id);
CREATE INDEX IF NOT EXISTS idx_kyc_event ON kyc_verifications (event_id);

-- ============================================================
-- 7. IMAGE MAINTENANCE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS escort_images (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       TEXT NOT NULL,
    image_url       TEXT NOT NULL,
    cleaned_url     TEXT,
    cloudinary_url  TEXT,
    status          TEXT DEFAULT 'pending',
    error_message   TEXT,
    processed_at    TIMESTAMP WITH TIME ZONE,
    file_size       INTEGER,
    mime_type       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escort_images_escort ON escort_images (escort_id);
CREATE INDEX IF NOT EXISTS idx_escort_images_status ON escort_images (status);

CREATE TABLE IF NOT EXISTS cleaning_logs (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       TEXT NOT NULL,
    image_url       TEXT NOT NULL,
    cleaned_url     TEXT,
    cloudinary_url  TEXT,
    status          TEXT DEFAULT 'pending',
    error_message   TEXT,
    processed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_logs_escort ON cleaning_logs (escort_id);

CREATE TABLE IF NOT EXISTS image_sync_trackers (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       TEXT NOT NULL,
    last_synced_at  TIMESTAMP WITH TIME ZONE,
    total_images    INTEGER DEFAULT 0,
    status          TEXT DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. PROCESSING QUEUE & LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS processing_queue (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       TEXT,
    action          TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    error_message   TEXT,
    retry_count     INTEGER DEFAULT 0,
    scheduled_at    TIMESTAMP WITH TIME ZONE,
    processed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON processing_queue (status);
CREATE INDEX IF NOT EXISTS idx_processing_queue_escort ON processing_queue (escort_id);

CREATE TABLE IF NOT EXISTS processing_logs (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    escort_id       TEXT,
    action          TEXT,
    status          TEXT,
    message         TEXT,
    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 9. CONTACT & MISC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    email           TEXT NOT NULL,
    subject         TEXT,
    message         TEXT,
    phone           TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_rewards (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL,
    escort_id       TEXT,
    agency_id       TEXT,
    action_type     TEXT NOT NULL,
    points          INTEGER NOT NULL,
    description     TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_rewards_user ON credit_rewards (user_id);

-- ============================================================
-- 10. LOOKUP TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS lookup_ages (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    value   INTEGER
);

CREATE TABLE IF NOT EXISTS lookup_availability (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lookup_breast_sizes (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    value   TEXT
);

CREATE TABLE IF NOT EXISTS lookup_practices (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lookup_bdsm (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lookup_massage (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lookup_languages (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name         TEXT NOT NULL,
    slug         TEXT UNIQUE NOT NULL,
    country_code TEXT,
    sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS lookup_extra_services (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lookup_categories (
    id      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name    TEXT NOT NULL,
    slug    TEXT UNIQUE NOT NULL
);

-- ============================================================
-- 11. USER PROFILE TABLE (Clerk users)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id   TEXT UNIQUE NOT NULL,
    name            TEXT,
    email           TEXT,
    phone           TEXT,
    role            TEXT DEFAULT 'user',
    agency_id       TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk ON users (clerk_user_id);

-- ============================================================
-- 12. SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 13. SEARCH INDEX TABLE (for full-text search)
-- ============================================================

CREATE TABLE IF NOT EXISTS escort_search (
    id          TEXT PRIMARY KEY REFERENCES escorts(id) ON DELETE CASCADE,
    name        TEXT,
    username    TEXT,
    about       TEXT,
    town        TEXT,
    estate      TEXT,
    categories  TEXT[],
    practices   TEXT[],
    search_vector TSVECTOR
);

CREATE INDEX IF NOT EXISTS idx_escort_search_vector ON escort_search USING GIN (search_vector);

CREATE OR REPLACE FUNCTION update_escort_search() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO escort_search (id, name, username, about, town, estate, categories, practices, search_vector)
    SELECT
        NEW.id,
        NEW.name,
        NEW.username,
        NEW.about,
        NEW.locations->>'town',
        NEW.locations->>'estate',
        NEW.categories,
        NEW.practices,
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.username, '') || ' ' || COALESCE(NEW.about, '')), 'A') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.locations->>'town', '') || ' ' || COALESCE(NEW.locations->>'estate', '')), 'B') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.categories, ' ')), 'C') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.practices, ' ')), 'D')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        about = EXCLUDED.about,
        town = EXCLUDED.town,
        estate = EXCLUDED.estate,
        categories = EXCLUDED.categories,
        practices = EXCLUDED.practices,
        search_vector = EXCLUDED.search_vector;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_escort_search
    AFTER INSERT OR UPDATE ON escorts
    FOR EACH ROW EXECUTE FUNCTION update_escort_search();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at for all tables
CREATE TRIGGER trigger_escorts_updated_at BEFORE UPDATE ON escorts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_agencies_updated_at BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_kyc_verifications_updated_at BEFORE UPDATE ON kyc_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. ZOHO CRM CONNECTION TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS zoho_connections (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    account_id TEXT,
    refresh_token TEXT NOT NULL,
    access_token TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER trigger_zoho_connections_updated_at BEFORE UPDATE ON zoho_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
