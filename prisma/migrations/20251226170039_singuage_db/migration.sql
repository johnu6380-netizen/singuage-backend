-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" VARCHAR(255),
    "google_id" VARCHAR(255),
    "spotify_id" VARCHAR(255),
    "username" VARCHAR(50),
    "display_name" VARCHAR(255),
    "avatar_url" TEXT,
    "bio" TEXT,
    "native_language" CHAR(2) NOT NULL,
    "target_languages" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" DATE,
    "account_status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "subscription_tier" VARCHAR(20) NOT NULL DEFAULT 'free',
    "subscription_expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_info" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "last_used_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "songs" (
    "id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "youtube_url" TEXT NOT NULL,
    "youtube_video_id" VARCHAR(50) NOT NULL,
    "video_duration_ms" INTEGER,
    "title" VARCHAR(500) NOT NULL,
    "artist" VARCHAR(500),
    "album" VARCHAR(500),
    "release_year" INTEGER,
    "genre" VARCHAR(100),
    "language" CHAR(2) NOT NULL,
    "difficulty_rating" INTEGER,
    "estimated_wpm" INTEGER,
    "lyrics_plain_text" TEXT NOT NULL,
    "lyrics_parsed" JSONB NOT NULL,
    "grammar_prerequisites" JSONB NOT NULL DEFAULT '[]',
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "completion_count" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "difficulty_mode" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),
    "duration_seconds" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "lines_completed" INTEGER NOT NULL DEFAULT 0,
    "lines_skipped" INTEGER NOT NULL DEFAULT 0,
    "total_lines" INTEGER NOT NULL,
    "accuracy_percentage" DECIMAL(5,2),
    "line_accuracies" JSONB,
    "pause_count" INTEGER NOT NULL DEFAULT 0,
    "auto_pause_count" INTEGER NOT NULL DEFAULT 0,
    "manual_pause_count" INTEGER NOT NULL DEFAULT 0,
    "rewind_count" INTEGER NOT NULL DEFAULT 0,
    "words_clicked" JSONB NOT NULL DEFAULT '[]',
    "session_analytics" JSONB,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "device_type" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_song_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "times_attempted" INTEGER NOT NULL DEFAULT 0,
    "times_completed" INTEGER NOT NULL DEFAULT 0,
    "times_skipped" INTEGER NOT NULL DEFAULT 0,
    "best_accuracy" DECIMAL(5,2),
    "best_session_id" UUID,
    "current_difficulty" VARCHAR(20),
    "is_mastered" BOOLEAN NOT NULL DEFAULT false,
    "first_attempted_at" TIMESTAMPTZ(6),
    "last_attempted_at" TIMESTAMPTZ(6),
    "mastered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_song_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grammar_concepts" (
    "id" UUID NOT NULL,
    "concept_slug" VARCHAR(100) NOT NULL,
    "concept_name" VARCHAR(255) NOT NULL,
    "language" CHAR(2) NOT NULL,
    "short_explanation" TEXT NOT NULL,
    "detailed_explanation" TEXT,
    "examples" JSONB NOT NULL,
    "diagram_url" TEXT,
    "video_url" TEXT,
    "category" VARCHAR(50),
    "difficulty_level" INTEGER,
    "prerequisite_concepts" JSONB NOT NULL DEFAULT '[]',
    "times_viewed" INTEGER NOT NULL DEFAULT 0,
    "times_completed" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "created_by_user_id" UUID,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grammar_concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_grammar_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "grammar_concept_id" UUID NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'not_started',
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "quiz_score" DECIMAL(5,2),
    "times_reviewed" INTEGER NOT NULL DEFAULT 0,
    "first_viewed_at" TIMESTAMPTZ(6),
    "last_reviewed_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_grammar_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocabulary" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "word" VARCHAR(255) NOT NULL,
    "language" CHAR(2) NOT NULL,
    "translation" TEXT,
    "part_of_speech" VARCHAR(50),
    "gender" VARCHAR(20),
    "grammar_notes" TEXT,
    "conjugation_data" JSONB,
    "example_sentences" JSONB,
    "mastery_level" INTEGER NOT NULL DEFAULT 0,
    "next_review_date" DATE,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "times_encountered" INTEGER NOT NULL DEFAULT 1,
    "times_clicked" INTEGER NOT NULL DEFAULT 1,
    "first_seen_in_song_id" UUID,
    "is_favorited" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "first_encountered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_encountered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_songs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "song_id" UUID NOT NULL,
    "folder" VARCHAR(255),
    "sort_order" INTEGER,
    "personal_notes" TEXT,
    "difficulty_preference" VARCHAR(20),
    "saved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_songs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" UUID NOT NULL,
    "achievement_key" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "criteria" JSONB NOT NULL,
    "rarity" VARCHAR(20),
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "achievement_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "earned_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "resource_type" VARCHAR(50),
    "resource_id" UUID,
    "details" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_spotify_id_key" ON "users"("spotify_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_deleted_at_idx" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE INDEX "users_username_deleted_at_idx" ON "users"("username", "deleted_at");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_last_activity_date_idx" ON "users"("last_activity_date");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "songs_created_by_user_id_deleted_at_idx" ON "songs"("created_by_user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "songs_language_deleted_at_idx" ON "songs"("language", "deleted_at");

-- CreateIndex
CREATE INDEX "songs_difficulty_rating_deleted_at_idx" ON "songs"("difficulty_rating", "deleted_at");

-- CreateIndex
CREATE INDEX "songs_visibility_deleted_at_idx" ON "songs"("visibility", "deleted_at");

-- CreateIndex
CREATE INDEX "songs_created_at_idx" ON "songs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "songs_youtube_video_id_idx" ON "songs"("youtube_video_id");

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_completed_at_idx" ON "learning_sessions"("user_id", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "learning_sessions_song_id_idx" ON "learning_sessions"("song_id");

-- CreateIndex
CREATE INDEX "learning_sessions_status_idx" ON "learning_sessions"("status");

-- CreateIndex
CREATE INDEX "learning_sessions_user_id_status_completed_at_idx" ON "learning_sessions"("user_id", "status", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "user_song_progress_user_id_idx" ON "user_song_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_song_progress_song_id_idx" ON "user_song_progress"("song_id");

-- CreateIndex
CREATE INDEX "user_song_progress_user_id_is_mastered_idx" ON "user_song_progress"("user_id", "is_mastered");

-- CreateIndex
CREATE INDEX "user_song_progress_user_id_last_attempted_at_idx" ON "user_song_progress"("user_id", "last_attempted_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_song_progress_user_id_song_id_key" ON "user_song_progress"("user_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "grammar_concepts_concept_slug_key" ON "grammar_concepts"("concept_slug");

-- CreateIndex
CREATE INDEX "grammar_concepts_language_idx" ON "grammar_concepts"("language");

-- CreateIndex
CREATE INDEX "grammar_concepts_category_idx" ON "grammar_concepts"("category");

-- CreateIndex
CREATE INDEX "grammar_concepts_difficulty_level_idx" ON "grammar_concepts"("difficulty_level");

-- CreateIndex
CREATE INDEX "grammar_concepts_concept_slug_idx" ON "grammar_concepts"("concept_slug");

-- CreateIndex
CREATE INDEX "user_grammar_progress_user_id_idx" ON "user_grammar_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_grammar_progress_grammar_concept_id_idx" ON "user_grammar_progress"("grammar_concept_id");

-- CreateIndex
CREATE INDEX "user_grammar_progress_user_id_status_idx" ON "user_grammar_progress"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_grammar_progress_user_id_completed_at_idx" ON "user_grammar_progress"("user_id", "completed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_grammar_progress_user_id_grammar_concept_id_key" ON "user_grammar_progress"("user_id", "grammar_concept_id");

-- CreateIndex
CREATE INDEX "vocabulary_user_id_last_encountered_at_idx" ON "vocabulary"("user_id", "last_encountered_at" DESC);

-- CreateIndex
CREATE INDEX "vocabulary_user_id_language_idx" ON "vocabulary"("user_id", "language");

-- CreateIndex
CREATE INDEX "vocabulary_user_id_mastery_level_idx" ON "vocabulary"("user_id", "mastery_level");

-- CreateIndex
CREATE INDEX "vocabulary_user_id_is_favorited_idx" ON "vocabulary"("user_id", "is_favorited");

-- CreateIndex
CREATE INDEX "vocabulary_user_id_next_review_date_idx" ON "vocabulary"("user_id", "next_review_date");

-- CreateIndex
CREATE UNIQUE INDEX "vocabulary_user_id_word_language_key" ON "vocabulary"("user_id", "word", "language");

-- CreateIndex
CREATE INDEX "saved_songs_user_id_saved_at_idx" ON "saved_songs"("user_id", "saved_at" DESC);

-- CreateIndex
CREATE INDEX "saved_songs_user_id_folder_idx" ON "saved_songs"("user_id", "folder");

-- CreateIndex
CREATE INDEX "saved_songs_song_id_idx" ON "saved_songs"("song_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_songs_user_id_song_id_key" ON "saved_songs"("user_id", "song_id");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_achievement_key_key" ON "achievements"("achievement_key");

-- CreateIndex
CREATE INDEX "achievements_achievement_key_idx" ON "achievements"("achievement_key");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- CreateIndex
CREATE INDEX "user_achievements_user_id_earned_at_idx" ON "user_achievements"("user_id", "earned_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "songs" ADD CONSTRAINT "songs_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_song_progress" ADD CONSTRAINT "user_song_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_song_progress" ADD CONSTRAINT "user_song_progress_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_grammar_progress" ADD CONSTRAINT "user_grammar_progress_grammar_concept_id_fkey" FOREIGN KEY ("grammar_concept_id") REFERENCES "grammar_concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_songs" ADD CONSTRAINT "saved_songs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_songs" ADD CONSTRAINT "saved_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "songs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
