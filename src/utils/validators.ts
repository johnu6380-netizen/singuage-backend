// src/utils/validators.ts
// Validation helpers using Zod - UPDATED for Features 1-4

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

export const emailValidator = z.string().email('Invalid email address');

export const passwordValidator = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const languageCodeValidator = z
  .string()
  .length(2, 'Language code must be 2 characters (ISO 639-1)');

export const uuidValidator = z.string().uuid('Invalid UUID format');

export const urlValidator = z.string().url('Invalid URL format');

export const youtubeUrlValidator = z
  .string()
  .refine(
    (url) => {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      return youtubeRegex.test(url);
    },
    { message: 'Invalid YouTube URL' }
  );

// ============================================================================
// Auth Schemas - UPDATED for Feature 1
// ============================================================================

export const registerSchema = z.object({
  email: emailValidator,
  password: passwordValidator,
  displayName: z.string().min(1).max(255).optional(),
  nativeLanguage: languageCodeValidator,
  targetLanguages: z.array(languageCodeValidator).optional(),
  isAdult: z.boolean().optional(), // NEW: Feature 1 - Age verification
});

export const loginSchema = z.object({
  email: emailValidator,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================================================
// Song Schemas - UPDATED for Feature 1
// ============================================================================

export const createSongSchema = z.object({
  youtubeUrl: youtubeUrlValidator,
  youtubeVideoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  artist: z.string().max(500).optional(),
  album: z.string().max(500).optional(),
  language: languageCodeValidator,
  lyricsPlainText: z.string().min(1, 'Lyrics are required'),
  lyricsParsed: z.object({
    metadata: z.object({
      lineCount: z.number().int().positive(),
      totalDurationMs: z.number().int().positive(),
      syncQuality: z.enum(['high', 'medium', 'low']),
      syncedBy: z.enum(['user', 'auto', 'community']),
      syncedAt: z.string(),
      offsetMs: z.number().int(),
    }),
    lines: z.array(
      z.object({
        id: z.string(),
        lineNumber: z.number().int().positive(),
        text: z.string(),
        startTimeMs: z.number().int().nonnegative(),
        endTimeMs: z.number().int().positive(),
        isChorus: z.boolean(),
        difficulty: z.object({
          wpm: z.number().int().positive(),
          complexity: z.number().int().min(1).max(10),
          hasSpecialChars: z.boolean(),
        }),
        words: z
          .array(
            z.object({
              word: z.string(),
              startOffsetMs: z.number().int().nonnegative(),
              durationMs: z.number().int().positive(),
            })
          )
          .optional(),
      })
    ),
  }),
  isExplicit: z.boolean().optional(), // NEW: Feature 1 - Explicit content flag
  contentRating: z.enum(['everyone', 'teen', 'mature']).optional(), // NEW: Feature 1
});

export const updateSongSchema = createSongSchema.partial();

export const songFiltersSchema = z.object({
  language: languageCodeValidator.optional(),
  difficultyMin: z.number().int().min(1).max(10).optional(),
  difficultyMax: z.number().int().min(1).max(10).optional(),
  visibility: z.enum(['public', 'private', 'unlisted']).optional(),
  search: z.string().optional(),
  excludeExplicit: z.boolean().optional(), // NEW: Feature 1 - Filter explicit content
});

// ============================================================================
// Session Schemas
// ============================================================================

export const startSessionSchema = z.object({
  songId: uuidValidator,
  difficultyMode: z.enum(['easy', 'medium', 'hard']),
  deviceType: z.enum(['mobile', 'tablet', 'desktop']).optional(),
});

export const updateSessionSchema = z.object({
  linesCompleted: z.number().int().nonnegative().optional(),
  linesSkipped: z.number().int().nonnegative().optional(),
  accuracyPercentage: z.number().min(0).max(100).optional(),
  lineAccuracies: z
    .array(
      z.object({
        lineNumber: z.number().int().positive(),
        accuracy: z.number().min(0).max(100),
        timeTakenMs: z.number().int().positive(),
        attempts: z.number().int().positive(),
        skipped: z.boolean().optional(),
      })
    )
    .optional(),
  pauseCount: z.number().int().nonnegative().optional(),
  autoPauseCount: z.number().int().nonnegative().optional(),
  manualPauseCount: z.number().int().nonnegative().optional(),
  rewindCount: z.number().int().nonnegative().optional(),
  wordsClicked: z
    .array(
      z.object({
        word: z.string(),
        timestamp: z.string(),
        lineNumber: z.number().int().positive(),
      })
    )
    .optional(),
  sessionAnalytics: z
    .object({
      typingSpeedWpm: z.number().nonnegative(),
      peakAccuracy: z.number().min(0).max(100),
      struggleLines: z.array(z.number().int().positive()),
      fastLines: z.array(z.number().int().positive()),
      timeDistribution: z.object({
        typing: z.number().int().nonnegative(),
        paused: z.number().int().nonnegative(),
        videoPlaying: z.number().int().nonnegative(),
      }),
    })
    .optional(),
  xpEarned: z.number().int().nonnegative().optional(),
});

export const completeSessionSchema = updateSessionSchema.extend({
  completedAt: z.string().datetime(),
  durationSeconds: z.number().int().positive(),
});

// ============================================================================
// Vocabulary Schemas
// ============================================================================

export const wordLookupSchema = z.object({
  word: z.string().min(1).max(255),
  language: languageCodeValidator,
  context: z.string().optional(),
  songId: uuidValidator.optional(),
});

// ============================================================================
// Grammar Schemas
// ============================================================================

export const grammarProgressUpdateSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed', 'mastered']).optional(),
  completionPercentage: z.number().int().min(0).max(100).optional(),
  quizScore: z.number().min(0).max(100).optional(),
});

// ============================================================================
// User Preferences Schema
// ============================================================================

export const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark']).optional(),
  autoPauseThresholdMs: z.number().int().min(3000).max(15000).optional(),
  rewindAmountMs: z.number().int().min(3000).max(10000).optional(),
  autoResume: z.boolean().optional(),
  typoTolerance: z.boolean().optional(),
  showTranslations: z.boolean().optional(),
  notificationSettings: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      streakReminders: z.boolean().optional(),
    })
    .optional(),
});

// ============================================================================
// Pagination Schema
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Helper function to validate request body
// ============================================================================

export const validateBody = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};

// ============================================================================
// Helper to transform query params to correct types
// ============================================================================

export const parseQueryParams = (query: any): any => {
  const parsed: any = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    
    // Convert string numbers to actual numbers
    if (typeof value === 'string') {
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') {
        parsed[key] = num;
        continue;
      }
      
      // Convert string booleans to actual booleans
      if (value === 'true') {
        parsed[key] = true;
        continue;
      }
      if (value === 'false') {
        parsed[key] = false;
        continue;
      }
    }
    
    parsed[key] = value;
  }
  
  return parsed;
};
