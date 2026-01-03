# Database Migration Guide

## New Fields Added

### Users Table
```sql
ALTER TABLE users ADD COLUMN is_adult BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN language_progress JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN social_features_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'private';
ALTER TABLE users ADD COLUMN last_practice_date DATE;
```

### Songs Table
```sql
ALTER TABLE songs ADD COLUMN is_explicit BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN content_rating VARCHAR(20) DEFAULT 'everyone';
ALTER TABLE songs ADD COLUMN total_plays INT DEFAULT 0;
ALTER TABLE songs ADD COLUMN unique_users INT DEFAULT 0;

CREATE INDEX idx_songs_is_explicit ON songs(is_explicit);
```

### Learning Sessions Table
```sql
ALTER TABLE learning_sessions ADD COLUMN xp_earned INT DEFAULT 0;
```

### Song Progress Table
```sql
ALTER TABLE user_song_progress ADD COLUMN mastery_level VARCHAR(20) DEFAULT 'listener';
ALTER TABLE user_song_progress ADD COLUMN mastery_progress INT DEFAULT 0;
```

## New Tables

### Word Lists
```sql
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language CHAR(2) NOT NULL,
  words_learned JSONB DEFAULT '[]',
  words_to_work_on JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, language)
);

CREATE INDEX idx_word_lists_user ON word_lists(user_id);
```

### Daily Reviews
```sql
CREATE TABLE daily_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language CHAR(2) NOT NULL,
  words_reviewed JSONB,
  correct_answers INT,
  incorrect_answers INT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_reviews_user_date ON daily_reviews(user_id, completed_at);
```

## Running Migrations

### Using Prisma
```bash
# 1. Update schema.prisma with new fields
# 2. Generate migration
npx prisma migrate dev --name add_new_features

# 3. Apply migration
npx prisma migrate deploy

# 4. Generate client
npx prisma generate
```

### Manual SQL (if needed)
```bash
psql -U your_username -d singuage_db < migration.sql
```

## Data Migration

### Backfill existing users
```sql
-- Set all existing users as adults (they already registered)
UPDATE users SET is_adult = true WHERE is_adult IS NULL;

-- Initialize language progress for existing users
UPDATE users 
SET language_progress = '{}' 
WHERE language_progress IS NULL OR language_progress = 'null';

-- Create word lists for existing users
INSERT INTO word_lists (user_id, language, words_learned, words_to_work_on)
SELECT 
  id as user_id,
  jsonb_array_elements_text(target_languages::jsonb)->>'code' as language,
  '[]'::jsonb as words_learned,
  '[]'::jsonb as words_to_work_on
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM word_lists WHERE word_lists.user_id = users.id
);
```

## Verification

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('is_adult', 'language_progress', 'social_features_enabled');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('word_lists', 'daily_reviews');

-- Verify data
SELECT COUNT(*) as adult_users FROM users WHERE is_adult = true;
SELECT COUNT(*) as word_lists FROM word_lists;
```

## Rollback (if needed)

```sql
-- Remove new columns
ALTER TABLE users DROP COLUMN IF EXISTS is_adult;
ALTER TABLE users DROP COLUMN IF EXISTS language_progress;
ALTER TABLE users DROP COLUMN IF EXISTS social_features_enabled;
ALTER TABLE users DROP COLUMN IF EXISTS profile_visibility;
ALTER TABLE users DROP COLUMN IF EXISTS last_practice_date;

ALTER TABLE songs DROP COLUMN IF EXISTS is_explicit;
ALTER TABLE songs DROP COLUMN IF EXISTS content_rating;
ALTER TABLE songs DROP COLUMN IF EXISTS total_plays;
ALTER TABLE songs DROP COLUMN IF EXISTS unique_users;

ALTER TABLE learning_sessions DROP COLUMN IF EXISTS xp_earned;

ALTER TABLE user_song_progress DROP COLUMN IF EXISTS mastery_level;
ALTER TABLE user_song_progress DROP COLUMN IF EXISTS mastery_progress;

-- Drop new tables
DROP TABLE IF EXISTS daily_reviews;
DROP TABLE IF EXISTS word_lists;
```
