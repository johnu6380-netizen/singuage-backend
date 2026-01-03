-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredArtists" TEXT[] DEFAULT ARRAY[]::TEXT[];
