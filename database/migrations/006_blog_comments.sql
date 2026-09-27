-- ============================================================
-- Migration 006: blog_comments — email/clerk_user_id, TEXT content, read index
--
-- Blog comments are moving from Sanity to MySQL. The Sanity client in
-- lib/sanity/client.ts is created without a `token`, so `client.create()` was
-- always unauthenticated and failed with HTTP 403 "Insufficient permissions;
-- permission 'create' required". The project has no Sanity write token in any
-- env file, so the comment feature could not work at all.
--
-- The `blog_comments` table already exists (mapped in lib/neon-firestore.ts) and
-- holds only leftover test rows: Sanity-style ids, NULL author_name, 5-15
-- character bodies, all is_approved = 0. Nothing real is lost by switching.
--
-- `content` is widened to TEXT because it is varchar(191) while a comment is
-- free-form prose. Under STRICT_TRANS_TABLES an over-length comment raises
-- ER_DATA_TOO_LONG and aborts the whole INSERT — the same trap that silently
-- discarded agency profile edits (see migration 005).
--
-- MySQL/MariaDB dialect (runtime DB is MySQL, see lib/db.ts). No DEFAULT on the
-- TEXT column: MySQL rejects a default on TEXT/BLOB (error 1101).
--
-- Re-running raises "Duplicate column name" / "Duplicate key name". That is the
-- intended signal, not a failure: if a column already exists, skip it.
-- ============================================================

ALTER TABLE `blog_comments` ADD COLUMN `email` VARCHAR(191) NULL;

ALTER TABLE `blog_comments` ADD COLUMN `clerk_user_id` VARCHAR(191) NULL;

ALTER TABLE `blog_comments` MODIFY COLUMN `content` TEXT NULL;

-- The read path filters on post_slug + is_approved and orders by created_at;
-- the table had no index beyond its primary key.
CREATE INDEX `idx_blog_comments_post_approved` ON `blog_comments` (`post_slug`, `is_approved`, `created_at`);

-- Verification (expect email, clerk_user_id, and content = text):
--   SELECT COLUMN_NAME, COLUMN_TYPE
--   FROM information_schema.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE()
--     AND TABLE_NAME = 'blog_comments'
--     AND COLUMN_NAME IN ('content', 'email', 'clerk_user_id');
