-- ============================================================
-- Migration 005: widen drifted agencies text columns to TEXT
--
-- `database/schema.sql` declares these as TEXT, but the live table
-- has varchar(191) (the utf8mb4 index-friendly length), so any value
-- over 191 characters is rejected with ER_DATA_TOO_LONG. Under
-- STRICT_TRANS_TABLES that aborts the whole UPDATE, so a long agency
-- description silently discarded every other edited field too.
--
-- The form allows a 2000 character description (agencySchema in
-- app/agency-profile/AgencyProfileForm.tsx), hence TEXT rather than
-- a longer VARCHAR.
--
-- MySQL/MariaDB dialect (runtime DB is MySQL, see lib/db.ts).
-- No DEFAULT is declared: MySQL rejects a default on TEXT/BLOB
-- (error 1101). All of these columns are already nullable, so
-- MODIFY ... TEXT preserves their semantics.
--
-- Applying this: MySQL WorkBench reports "0 rows affected" for DDL,
-- which is expected. Confirm with the verification query below.
-- ============================================================

ALTER TABLE `agencies` MODIFY COLUMN `description` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_source` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_medium` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_campaign` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_content` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_term` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_id` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `utm_source_platform` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `landing_page` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `first_touch_at` TEXT NULL;
ALTER TABLE `agencies` MODIFY COLUMN `registration_date` TEXT NULL;

-- Verification (expect COLUMN_TYPE = text for all eleven rows):
--   SELECT COLUMN_NAME, COLUMN_TYPE
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'agencies'
--     AND COLUMN_NAME IN ('description', 'utm_source', 'landing_page');
