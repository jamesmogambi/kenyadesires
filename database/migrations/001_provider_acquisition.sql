-- ============================================================
-- Migration 001: Provider Acquisition Campaign 01 tables
-- Adds tables for Zoho lead capture, TrafficStars postbacks,
-- fallback sync queue, and referral tracking.
-- Safe to run multiple times (IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- 1. PROVIDER LEADS (platform-side capture before Zoho push)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_leads (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_lead_id            TEXT,
    first_name              TEXT NOT NULL,
    last_name               TEXT NOT NULL,
    alias                   TEXT,
    phone                   TEXT,
    mobile                  TEXT,
    email                   TEXT,
    secondary_email         TEXT,
    telegram                TEXT,
    twitter                 TEXT,
    city                    TEXT,
    county                  TEXT,
    consent_whatsapp        BOOLEAN NOT NULL DEFAULT FALSE,
    consent_email           BOOLEAN NOT NULL DEFAULT FALSE,
    age_confirmed           BOOLEAN NOT NULL DEFAULT FALSE,
    utm_source              TEXT,
    utm_medium              TEXT,
    utm_campaign            TEXT,
    click_id                TEXT,
    referral_code           TEXT,
    ga_client_id            TEXT,
    landing_url             TEXT,
    consent_date            TIMESTAMPTZ,
    lead_source             TEXT,
    tier                    TEXT,
    description             TEXT,
    zoho_status             TEXT DEFAULT 'pending', -- pending, synced, failed
    zoho_error              TEXT,
    converted_to_contact    BOOLEAN DEFAULT FALSE,
    zoho_contact_id         TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_leads_email ON provider_leads (email);
CREATE INDEX IF NOT EXISTS idx_provider_leads_click_id ON provider_leads (click_id);
CREATE INDEX IF NOT EXISTS idx_provider_leads_zoho_lead_id ON provider_leads (zoho_lead_id);
CREATE INDEX IF NOT EXISTS idx_provider_leads_zoho_status ON provider_leads (zoho_status);
CREATE INDEX IF NOT EXISTS idx_provider_leads_referral_code ON provider_leads (referral_code);

-- ============================================================
-- 2. TRAFFICSTARS POSTBACKS
-- ============================================================
CREATE TABLE IF NOT EXISTS trafficstars_postbacks (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    click_id        TEXT NOT NULL,
    event           TEXT NOT NULL,            -- registration, profile_complete, verification, paid_upgrade
    value           NUMERIC,
    provider_lead_id TEXT,
    status          TEXT DEFAULT 'pending',   -- pending, sent, failed
    attempts        INTEGER DEFAULT 0,
    last_error      TEXT,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ts_postbacks_click_id ON trafficstars_postbacks (click_id);
CREATE INDEX IF NOT EXISTS idx_ts_postbacks_status ON trafficstars_postbacks (status);
CREATE INDEX IF NOT EXISTS idx_ts_postbacks_event ON trafficstars_postbacks (event);
CREATE INDEX IF NOT EXISTS idx_ts_postbacks_provider_lead_id ON trafficstars_postbacks (provider_lead_id);

-- ============================================================
-- 3. ZOHO SYNC FALLBACK QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS zoho_sync_queue (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     TEXT NOT NULL,            -- lead, contact, deal, campaign
    action          TEXT NOT NULL,            -- create, update, convert
    entity_id       TEXT,                     -- platform-side id (provider_leads.id) or zoho id
    zoho_entity_id  TEXT,                     -- zoho record id when known
    payload         JSONB NOT NULL,
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 10,
    next_retry_at   TIMESTAMPTZ,
    status          TEXT DEFAULT 'pending',   -- pending, processing, done, dead
    last_error      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_sync_queue_status ON zoho_sync_queue (status);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_queue_entity_type ON zoho_sync_queue (entity_type);
CREATE INDEX IF NOT EXISTS idx_zoho_sync_queue_next_retry_at ON zoho_sync_queue (next_retry_at);

-- ============================================================
-- 4. PROVIDER REFERRALS
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_referrals (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_lead_id    TEXT,                    -- provider_leads.id of the referrer
    referrer_zoho_id    TEXT,                    -- zoho lead/contact id of referrer
    referral_code       TEXT NOT NULL UNIQUE,
    referred_lead_id    TEXT,                    -- provider_leads.id of referred
    referred_zoho_id    TEXT,
    status              TEXT DEFAULT 'pending',  -- pending, registered, verified, rewarded
    reward_credits      NUMERIC DEFAULT 0,
    reward_amount_ksh   NUMERIC DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_referrals_code ON provider_referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_referrer ON provider_referrals (referrer_lead_id);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_referred ON provider_referrals (referred_lead_id);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_status ON provider_referrals (status);

-- ============================================================
-- 5. PROVIDER ONBOARDING EVENTS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_events (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_lead_id    TEXT,
    zoho_entity_id      TEXT,
    event_type          TEXT NOT NULL,           -- registration, profile_complete, verification_started, verification_complete, published, paid_upgrade
    event_data          JSONB,
    zoho_updated        BOOLEAN DEFAULT FALSE,
    zoho_error          TEXT,
    postback_fired      BOOLEAN DEFAULT FALSE,
    postback_error      TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_events_lead ON provider_events (provider_lead_id);
CREATE INDEX IF NOT EXISTS idx_provider_events_type ON provider_events (event_type);

-- ============================================================
-- 6. TRIGGERS for auto updated_at
-- ============================================================
CREATE TRIGGER IF NOT EXISTS trigger_provider_leads_updated_at
    BEFORE UPDATE ON provider_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_ts_postbacks_updated_at
    BEFORE UPDATE ON trafficstars_postbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_zoho_sync_queue_updated_at
    BEFORE UPDATE ON zoho_sync_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER IF NOT EXISTS trigger_provider_referrals_updated_at
    BEFORE UPDATE ON provider_referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();