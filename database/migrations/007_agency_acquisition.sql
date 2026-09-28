-- ============================================================
-- Migration 007: Agency Acquisition Campaign 02 tables
-- Adds tables for agency acquisition tracking, CRM sync,
-- and idempotent credit rewards.
-- Safe to run multiple times (IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- 1. AGENCY LEADS (platform-side capture before Zoho push)
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_leads (
    id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    zoho_lead_id            TEXT,
    agency_id               TEXT,
    agency_name             TEXT,
    contact_person          TEXT,
    email                   TEXT,
    phone                   TEXT,
    mobile                  TEXT,
    location                TEXT,
    estimated_profiles      INTEGER,
    profiles_listed         INTEGER DEFAULT 0,
    interested_package      TEXT,
    lead_source             TEXT,
    utm_source              TEXT,
    utm_medium              TEXT,
    utm_campaign            TEXT,
    utm_content             TEXT,
    utm_term                TEXT,
    utm_id                  TEXT,
    utm_source_platform     TEXT,
    landing_page            TEXT,
    campaign                TEXT DEFAULT 'agency_acquisition',
    first_touch_at          TIMESTAMPTZ,
    zoho_status             TEXT DEFAULT 'pending', -- pending, synced, failed
    zoho_error              TEXT,
    zoho_contact_id         TEXT,
    converted_to_contact    BOOLEAN DEFAULT FALSE,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_leads_email ON agency_leads (email);
CREATE INDEX IF NOT EXISTS idx_agency_leads_agency_id ON agency_leads (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_leads_zoho_lead_id ON agency_leads (zoho_lead_id);
CREATE INDEX IF NOT EXISTS idx_agency_leads_zoho_status ON agency_leads (zoho_status);
CREATE INDEX IF NOT EXISTS idx_agency_leads_campaign ON agency_leads (campaign);

-- ============================================================
-- 2. AGENCY ONBOARDING EVENTS (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_events (
    id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_lead_id      TEXT,
    zoho_entity_id      TEXT,
    agency_id           TEXT,
    event_type          TEXT NOT NULL, -- registration, verification_started, verification_complete, profile_added, profile_published, profile_3, profile_5, profile_10, purchase
    event_data          JSONB,
    zoho_updated        BOOLEAN DEFAULT FALSE,
    zoho_error          TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_events_lead ON agency_events (agency_lead_id);
CREATE INDEX IF NOT EXISTS idx_agency_events_agency ON agency_events (agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_events_type ON agency_events (event_type);

-- ============================================================
-- 3. AGENCY CREDIT REWARDS (idempotency)
-- ============================================================
CREATE TABLE IF NOT EXISTS agency_credit_rewards (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id       TEXT NOT NULL,
    reward_type     TEXT NOT NULL, -- 'agency_registration_reward' or 'agency_verification_reward'
    credits         INTEGER NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one reward per agency per reward_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_credit_rewards_unique
    ON agency_credit_rewards (agency_id, reward_type);

CREATE INDEX IF NOT EXISTS idx_agency_credit_rewards_agency ON agency_credit_rewards (agency_id);