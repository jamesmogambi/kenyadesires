-- ============================================================
-- Migration 004: escorts.height / escorts.breasts
-- The "About me" section in app/new-profile/AboutMeForm.tsx collects
-- Age, Weight, Height and Breasts. Age and Weight already had columns,
-- but `height` and `breasts` had none, so those two inputs were
-- silently discarded: NewEscortProfileInput carried them and every
-- edit page hardcoded `height: ""`.
--
-- `breasts` is a free-text measurement entered in About me. It is
-- distinct from the existing `bust_size` / `breast_size` columns,
-- which are the cup-size options selected in SettingsForm.
--
-- MySQL/MariaDB dialect (runtime DB is MySQL, see lib/db.ts).
-- Safe to run multiple times: the guards check for the column first
-- because CREATE TABLE IF NOT EXISTS does not help for ALTER TABLE.
-- ============================================================

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'escorts'
    AND COLUMN_NAME = 'height'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE `escorts` ADD COLUMN `height` TEXT DEFAULT ''''',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'escorts'
    AND COLUMN_NAME = 'breasts'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE `escorts` ADD COLUMN `breasts` TEXT DEFAULT ''''',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
