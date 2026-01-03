/*
  Warnings:

  - You are about to drop the column `achievement_key` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `criteria` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `is_hidden` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `xp_reward` on the `achievements` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `concept_slug` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_user_id` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `detailed_explanation` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `diagram_url` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty_level` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `is_published` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `prerequisite_concepts` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `short_explanation` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `times_completed` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `times_viewed` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `grammar_concepts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `learning_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `total_lines` on the `learning_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `learning_sessions` table. All the data in the column will be lost.
  - You are about to alter the column `accuracy_percentage` on the `learning_sessions` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to drop the column `difficulty_preference` on the `saved_songs` table. All the data in the column will be lost.
  - You are about to drop the column `folder` on the `saved_songs` table. All the data in the column will be lost.
  - You are about to drop the column `personal_notes` on the `saved_songs` table. All the data in the column will be lost.
  - You are about to drop the column `sort_order` on the `saved_songs` table. All the data in the column will be lost.
  - You are about to drop the column `average_rating` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_wpm` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `genre` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `grammar_prerequisites` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `release_year` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `video_duration_ms` on the `songs` table. All the data in the column will be lost.
  - You are about to drop the column `view_count` on the `songs` table. All the data in the column will be lost.
  - You are about to alter the column `youtube_video_id` on the `songs` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(20)`.
  - You are about to drop the column `created_at` on the `user_achievements` table. All the data in the column will be lost.
  - You are about to drop the column `is_completed` on the `user_achievements` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `user_achievements` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `user_grammar_progress` table. All the data in the column will be lost.
  - You are about to drop the column `first_viewed_at` on the `user_grammar_progress` table. All the data in the column will be lost.
  - You are about to drop the column `grammar_concept_id` on the `user_grammar_progress` table. All the data in the column will be lost.
  - You are about to drop the column `last_reviewed_at` on the `user_grammar_progress` table. All the data in the column will be lost.
  - You are about to drop the column `times_reviewed` on the `user_grammar_progress` table. All the data in the column will be lost.
  - You are about to alter the column `quiz_score` on the `user_grammar_progress` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to drop the column `best_session_id` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `current_difficulty` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `first_attempted_at` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `is_mastered` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `last_attempted_at` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `mastered_at` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `times_attempted` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `times_completed` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `times_skipped` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `user_song_progress` table. All the data in the column will be lost.
  - You are about to alter the column `best_accuracy` on the `user_song_progress` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - You are about to drop the column `conjugation_data` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `correct_count` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `example_sentences` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `first_encountered_at` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `first_seen_in_song_id` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `grammar_notes` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `is_archived` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `is_favorited` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `last_encountered_at` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `mastery_level` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `next_review_date` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `review_count` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `times_clicked` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `times_encountered` on the `vocabulary` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `vocabulary` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `achievements` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[language,concept_key]` on the table `grammar_concepts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,concept_id]` on the table `user_grammar_progress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `achievements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `key` to the `achievements` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `achievements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rarity` on table `achievements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resource_type` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `concept_key` to the `grammar_concepts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `grammar_concepts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `grammar_concepts` table without a default value. This is not possible if the table is not empty.
  - Made the column `line_accuracies` on table `learning_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `difficulty_rating` on table `songs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `earned_at` on table `user_achievements` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `concept_id` to the `user_grammar_progress` table without a default value. This is not possible if the table is not empty.
  - Made the column `translation` on table `vocabulary` required. This step will fail if there are existing NULL values in that column.

*/
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
ALTER TABLE "user_grammar_progress" DROP CONSTRAINT "user_grammar_progress_grammar_concept_id_fkey";

-- DropForeignKey
ALTER TABLE "user_grammar_progress" DROP CONSTRAINT "user_grammar_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "user_song_progress" DROP CONSTRAINT "user_song_progress_song_id_fkey";

-- DropForeignKey
ALTER TABLE "user_song_progress" DROP CONSTRAINT "user_song_progress_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vocabulary" DROP CONSTRAINT "vocabulary_user_id_fkey";

-- DropIndex
DROP INDEX "achievements_achievement_key_idx";

-- DropIndex
DROP INDEX "achievements_achievement_key_key";

-- DropIndex
DROP INDEX "audit_logs_action_created_at_idx";

-- DropIndex
DROP INDEX "audit_logs_resource_type_resource_id_idx";

-- DropIndex
DROP INDEX "audit_logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "grammar_concepts_category_idx";

-- DropIndex
DROP INDEX "grammar_concepts_concept_slug_idx";

-- DropIndex
DROP INDEX "grammar_concepts_concept_slug_key";

-- DropIndex
DROP INDEX "grammar_concepts_difficulty_level_idx";

-- DropIndex
DROP INDEX "learning_sessions_status_idx";

-- DropIndex
DROP INDEX "learning_sessions_user_id_completed_at_idx";

-- DropIndex
DROP INDEX "learning_sessions_user_id_status_completed_at_idx";

-- DropIndex
DROP INDEX "saved_songs_song_id_idx";

-- DropIndex
DROP INDEX "saved_songs_user_id_folder_idx";

-- DropIndex
DROP INDEX "saved_songs_user_id_saved_at_idx";

-- DropIndex
DROP INDEX "songs_created_at_idx";

-- DropIndex
DROP INDEX "songs_created_by_user_id_deleted_at_idx";

-- DropIndex
DROP INDEX "songs_difficulty_rating_deleted_at_idx";

-- DropIndex
DROP INDEX "songs_language_deleted_at_idx";

-- DropIndex
DROP INDEX "songs_visibility_deleted_at_idx";

-- DropIndex
DROP INDEX "user_achievements_user_id_earned_at_idx";

-- DropIndex
DROP INDEX "user_grammar_progress_grammar_concept_id_idx";

-- DropIndex
DROP INDEX "user_grammar_progress_user_id_completed_at_idx";

-- DropIndex
DROP INDEX "user_grammar_progress_user_id_grammar_concept_id_key";

-- DropIndex
DROP INDEX "user_grammar_progress_user_id_status_idx";

-- DropIndex
DROP INDEX "user_song_progress_user_id_is_mastered_idx";

-- DropIndex
DROP INDEX "user_song_progress_user_id_last_attempted_at_idx";

-- DropIndex
DROP INDEX "vocabulary_user_id_is_favorited_idx";

-- DropIndex
DROP INDEX "vocabulary_user_id_last_encountered_at_idx";

-- DropIndex
DROP INDEX "vocabulary_user_id_mastery_level_idx";

-- DropIndex
DROP INDEX "vocabulary_user_id_next_review_date_idx";

-- AlterTable
ALTER TABLE "achievements" DROP COLUMN "achievement_key",
DROP COLUMN "created_at",
DROP COLUMN "criteria",
DROP COLUMN "is_active",
DROP COLUMN "is_hidden",
DROP COLUMN "xp_reward",
ADD COLUMN     "category" VARCHAR(50) NOT NULL,
ADD COLUMN     "key" VARCHAR(100) NOT NULL,
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "rarity" SET NOT NULL;

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "user_agent" TEXT,
ALTER COLUMN "resource_type" SET NOT NULL,
ALTER COLUMN "ip_address" SET DATA TYPE VARCHAR(45);

-- AlterTable
ALTER TABLE "grammar_concepts" DROP COLUMN "category",
DROP COLUMN "concept_slug",
DROP COLUMN "created_at",
DROP COLUMN "created_by_user_id",
DROP COLUMN "detailed_explanation",
DROP COLUMN "diagram_url",
DROP COLUMN "difficulty_level",
DROP COLUMN "is_featured",
DROP COLUMN "is_published",
DROP COLUMN "prerequisite_concepts",
DROP COLUMN "short_explanation",
DROP COLUMN "times_completed",
DROP COLUMN "times_viewed",
DROP COLUMN "updated_at",
DROP COLUMN "video_url",
ADD COLUMN     "concept_key" VARCHAR(100) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "level" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "learning_sessions" DROP COLUMN "created_at",
DROP COLUMN "total_lines",
DROP COLUMN "updated_at",
ALTER COLUMN "accuracy_percentage" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "line_accuracies" SET NOT NULL,
ALTER COLUMN "line_accuracies" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "saved_songs" DROP COLUMN "difficulty_preference",
DROP COLUMN "folder",
DROP COLUMN "personal_notes",
DROP COLUMN "sort_order";

-- AlterTable
ALTER TABLE "songs" DROP COLUMN "average_rating",
DROP COLUMN "deleted_at",
DROP COLUMN "estimated_wpm",
DROP COLUMN "genre",
DROP COLUMN "grammar_prerequisites",
DROP COLUMN "is_featured",
DROP COLUMN "release_year",
DROP COLUMN "video_duration_ms",
DROP COLUMN "view_count",
ADD COLUMN     "average_accuracy" DOUBLE PRECISION,
ADD COLUMN     "content_rating" VARCHAR(20) NOT NULL DEFAULT 'everyone',
ADD COLUMN     "is_explicit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "total_plays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unique_users" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "youtube_video_id" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "difficulty_rating" SET NOT NULL,
ALTER COLUMN "difficulty_rating" SET DEFAULT 5,
ALTER COLUMN "visibility" SET DEFAULT 'public';

-- AlterTable
ALTER TABLE "user_achievements" DROP COLUMN "created_at",
DROP COLUMN "is_completed",
DROP COLUMN "progress",
ALTER COLUMN "earned_at" SET NOT NULL,
ALTER COLUMN "earned_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "user_grammar_progress" DROP COLUMN "completed_at",
DROP COLUMN "first_viewed_at",
DROP COLUMN "grammar_concept_id",
DROP COLUMN "last_reviewed_at",
DROP COLUMN "times_reviewed",
ADD COLUMN     "concept_id" UUID NOT NULL,
ALTER COLUMN "quiz_score" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "user_song_progress" DROP COLUMN "best_session_id",
DROP COLUMN "created_at",
DROP COLUMN "current_difficulty",
DROP COLUMN "first_attempted_at",
DROP COLUMN "is_mastered",
DROP COLUMN "last_attempted_at",
DROP COLUMN "mastered_at",
DROP COLUMN "times_attempted",
DROP COLUMN "times_completed",
DROP COLUMN "times_skipped",
DROP COLUMN "updated_at",
ADD COLUMN     "average_accuracy" DOUBLE PRECISION,
ADD COLUMN     "completion_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "easy_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "first_started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "hard_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_practiced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "mastery_level" VARCHAR(20) NOT NULL DEFAULT 'listener',
ADD COLUMN     "mastery_progress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "medium_completed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_time_spent" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "best_accuracy" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_adult" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language_progress" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "last_practice_date" DATE,
ADD COLUMN     "profile_visibility" VARCHAR(20) NOT NULL DEFAULT 'private',
ADD COLUMN     "social_features_enabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "vocabulary" DROP COLUMN "conjugation_data",
DROP COLUMN "correct_count",
DROP COLUMN "example_sentences",
DROP COLUMN "first_encountered_at",
DROP COLUMN "first_seen_in_song_id",
DROP COLUMN "gender",
DROP COLUMN "grammar_notes",
DROP COLUMN "is_archived",
DROP COLUMN "is_favorited",
DROP COLUMN "last_encountered_at",
DROP COLUMN "mastery_level",
DROP COLUMN "next_review_date",
DROP COLUMN "review_count",
DROP COLUMN "times_clicked",
DROP COLUMN "times_encountered",
DROP COLUMN "updated_at",
ADD COLUMN     "context" TEXT,
ADD COLUMN     "example_sentence" TEXT,
ADD COLUMN     "from_line" TEXT,
ADD COLUMN     "from_song_id" UUID,
ADD COLUMN     "last_looked_up_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lookup_count" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "translation" SET NOT NULL;

-- CreateTable
CREATE TABLE "word_lists" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "language" CHAR(2) NOT NULL,
    "words_learned" JSONB NOT NULL DEFAULT '[]',
    "words_to_work_on" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "word_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reviews" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "language" CHAR(2) NOT NULL,
    "words_reviewed" JSONB NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "incorrect_answers" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "word_lists_user_id_language_key" ON "word_lists"("user_id", "language");

-- CreateIndex
CREATE INDEX "daily_reviews_user_id_completed_at_idx" ON "daily_reviews"("user_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_key_key" ON "achievements"("key");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "grammar_concepts_language_concept_key_key" ON "grammar_concepts"("language", "concept_key");

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_status_idx" ON "learning_sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "learning_sessions_started_at_idx" ON "learning_sessions"("started_at");

-- CreateIndex
CREATE INDEX "saved_songs_user_id_idx" ON "saved_songs"("user_id");

-- CreateIndex
CREATE INDEX "songs_language_idx" ON "songs"("language");

-- CreateIndex
CREATE INDEX "songs_created_by_user_id_idx" ON "songs"("created_by_user_id");

-- CreateIndex
CREATE INDEX "songs_visibility_idx" ON "songs"("visibility");

-- CreateIndex
CREATE INDEX "songs_is_explicit_idx" ON "songs"("is_explicit");

-- CreateIndex
CREATE UNIQUE INDEX "user_grammar_progress_user_id_concept_id_key" ON "user_grammar_progress"("user_id", "concept_id");

-- CreateIndex
CREATE INDEX "users_social_features_enabled_idx" ON "users"("social_features_enabled");

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "word_lists" ADD CONSTRAINT "word_lists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reviews" ADD CONSTRAINT "daily_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_song_progress" ADD CONSTRAINT "user_song_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_song_progress" ADD CONSTRAINT "user_song_progress_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_songs" ADD CONSTRAINT "saved_songs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_songs" ADD CONSTRAINT "saved_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "grammar_concepts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
