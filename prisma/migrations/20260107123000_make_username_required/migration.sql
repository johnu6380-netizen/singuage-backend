-- Migration: make_username_required
-- Make username NOT NULL and add unique constraint

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- Add unique index/constraint on username (if not already present)
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User" ("username");
