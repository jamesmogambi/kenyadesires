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
--
-- VARCHAR(191), not TEXT: MySQL rejects a DEFAULT on TEXT/BLOB/JSON
-- columns (error 1101), and VARCHAR(191) is already what the other
-- scalar text columns on `escorts` use (`bust_size`, `weight`,
-- `street`).
--
-- Applying this: MySQL WorkBench reports "0 rows affected" for DDL,
-- which is expected — ALTER TABLE changes no rows. Confirm with the
-- verification query at the bottom.
--
-- Re-running raises "Duplicate column name". That is the intended
-- signal, not a failure: if a column is already present, skip it.
-- ============================================================

ALTER TABLE `escorts` ADD COLUMN `height` VARCHAR(191) NOT NULL DEFAULT '';

ALTER TABLE `escorts` ADD COLUMN `breasts` VARCHAR(191) NOT NULL DEFAULT '';

-- Verification (expect two rows: height, breasts):
--   SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'escorts'
--     AND COLUMN_NAME IN ('height', 'breasts');
