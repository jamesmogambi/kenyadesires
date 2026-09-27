-- ============================================================
-- Migration 003: lookup_languages
-- Canonical language options offered by the languages
-- checkboxes (app/new-profile/SelectPackagesForm.tsx).
-- Replaces the hardcoded fixtures/setting.ts list so the
-- options are prepopulated from the database like the other
-- lookup tables.
-- MySQL/MariaDB dialect (runtime DB is MySQL, see lib/db.ts).
-- Safe to run multiple times: `IF NOT EXISTS` for the table, `INSERT IGNORE`
-- for the seed. `INSERT IGNORE` rather than `ON DUPLICATE KEY UPDATE` because
-- the `VALUES (...) AS new` row-alias form is MySQL 8.0.19+ only and is a
-- syntax error on MariaDB. Re-running will not overwrite edited seed rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS `lookup_languages` (
  `id` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `country_code` VARCHAR(2) COLLATE utf8mb4_bin DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lookup_languages_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `lookup_languages` (`name`, `slug`, `country_code`, `sort_order`)
VALUES
  ('English', 'english', 'GB', 1),
  ('Swahili', 'swahili', 'KE', 2),
  ('Arabic', 'arabic', 'SA', 3),
  ('French', 'french', 'FR', 4),
  ('Japanese', 'japanese', 'JP', 5);
