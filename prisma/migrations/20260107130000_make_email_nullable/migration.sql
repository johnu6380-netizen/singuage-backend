-- Migration: make_email_nullable
-- Make email column nullable so registrations without email succeed.

ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- Keep UNIQUE constraint; ensure no duplicate emails exist before applying in production.
