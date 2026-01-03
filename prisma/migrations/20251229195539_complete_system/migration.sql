/*
  Warnings:

  - You are about to drop the `achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `daily_reviews` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grammar_concepts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `learning_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `saved_songs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `songs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_achievements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_grammar_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_song_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vocabulary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `word_lists` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "daily_reviews" DROP CONSTRAINT "daily_reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_sessions" DROP CONSTRAINT "learning_sessions_song_id_fkey";

-- DropForeignKey
ALTER TABLE "learning_sessions" DROP CONSTRAINT "learning_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_songs" DROP CONSTRAINT "saved_songs_song_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_songs" DROP CONSTRAINT "saved_songs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "songs" DROP CONSTRAINT "songs_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_achievement_id_fkey";

-- DropForeignKey
ALTER TABLE "user_achievements" DROP CONSTRAINT "user_achievements_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_grammar_progress" DROP CONSTRAINT "user_grammar_progress_concept_id_fkey";

-- DropForeignKey
ALTER TABLE "user_grammar_progress" DROP CONSTRAINT "user_grammar_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_song_progress" DROP CONSTRAINT "user_song_progress_song_id_fkey";

-- DropForeignKey
ALTER TABLE "user_song_progress" DROP CONSTRAINT "user_song_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vocabulary" DROP CONSTRAINT "vocabulary_user_id_fkey";

-- DropForeignKey
ALTER TABLE "word_lists" DROP CONSTRAINT "word_lists_user_id_fkey";

-- DropTable
DROP TABLE "achievements";

-- DropTable
DROP TABLE "audit_logs";

-- DropTable
DROP TABLE "daily_reviews";

-- DropTable
DROP TABLE "grammar_concepts";

-- DropTable
DROP TABLE "learning_sessions";

-- DropTable
DROP TABLE "saved_songs";

-- DropTable
DROP TABLE "songs";

-- DropTable
DROP TABLE "user_achievements";

-- DropTable
DROP TABLE "user_grammar_progress";

-- DropTable
DROP TABLE "user_sessions";

-- DropTable
DROP TABLE "user_song_progress";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "vocabulary";

-- DropTable
DROP TABLE "word_lists";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "displayName" TEXT,
    "nativeLanguage" TEXT NOT NULL,
    "targetLanguages" JSONB NOT NULL,
    "isAdult" BOOLEAN NOT NULL DEFAULT true,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPracticeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "difficultyRating" INTEGER NOT NULL,
    "isExplicit" BOOLEAN NOT NULL DEFAULT false,
    "contentRating" TEXT,
    "lyricsParsed" JSONB NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "completedLines" INTEGER NOT NULL,
    "totalLines" INTEGER NOT NULL,
    "timeSpentMs" INTEGER NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- AddForeignKey
ALTER TABLE "Song" ADD CONSTRAINT "Song_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
