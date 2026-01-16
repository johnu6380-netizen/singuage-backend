-- Migration: add_username_nullable
-- Adds username column as nullable so existing rows are not blocked.

ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Note: Do not add NOT NULL or UNIQUE constraints in this step.
-- After running this migration, run the backfill script to populate usernames,
-- then apply the follow-up migration that sets NOT NULL and UNIQUE.
