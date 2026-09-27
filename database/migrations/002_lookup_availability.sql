-- ============================================================
-- Migration 002: lookup_availability
-- Canonical availability options offered by the availability
-- dropdown (app/new-profile/IntroSection.tsx). Seeded with
-- Incall / outcall / Both so the dropdown is prepopulated.
-- MySQL/MariaDB dialect (runtime DB is MySQL, see lib/db.ts).
-- Safe to run multiple times: `IF NOT EXISTS` for the table, `INSERT IGNORE`
-- for the seed. `INSERT IGNORE` rather than `ON DUPLICATE KEY UPDATE` because
-- the `VALUES (...) AS new` row-alias form is MySQL 8.0.19+ only and is a
-- syntax error on MariaDB. Re-running will not overwrite edited seed rows.
-- ============================================================

CREATE TABLE IF NOT EXISTS `lookup_availability` (
  `id` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lookup_availability_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `lookup_availability` (`name`, `slug`, `sort_order`)
VALUES
  ('Incall', 'incall', 1),
  ('outcall', 'outcall', 2),
  ('Both', 'both', 3);
