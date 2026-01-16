/*
  Warnings:

  - A unique constraint covering the columns `[firstSongId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstSongId" TEXT,
ADD COLUMN     "songDailyLines" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE UNIQUE INDEX "User_firstSongId_key" ON "User"("firstSongId");
