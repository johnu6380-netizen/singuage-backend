"use strict";
// src/utils/validators.ts
// Validation helpers using Zod - UPDATED for Features 1-4
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQueryParams = exports.validateBody = exports.paginationSchema = exports.updatePreferencesSchema = exports.grammarProgressUpdateSchema = exports.wordLookupSchema = exports.completeSessionSchema = exports.updateSessionSchema = exports.startSessionSchema = exports.songFiltersSchema = exports.updateSongSchema = exports.createSongSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = exports.youtubeUrlValidator = exports.urlValidator = exports.uuidValidator = exports.languageCodeValidator = exports.passwordValidator = exports.emailValidator = void 0;
const zod_1 = require("zod");
// ============================================================================
// Common Validators
// ============================================================================
exports.emailValidator = zod_1.z.string().email('Invalid email address');
exports.passwordValidator = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');
exports.languageCodeValidator = zod_1.z
    .string()
    .length(2, 'Language code must be 2 characters (ISO 639-1)');
exports.uuidValidator = zod_1.z.string().uuid('Invalid UUID format');
exports.urlValidator = zod_1.z.string().url('Invalid URL format');
exports.youtubeUrlValidator = zod_1.z
    .string()
    .refine((url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
}, { message: 'Invalid YouTube URL' });
// ============================================================================
// Auth Schemas - UPDATED for Feature 1
// ============================================================================
exports.registerSchema = zod_1.z.object({
    email: exports.emailValidator,
    password: exports.passwordValidator,
    displayName: zod_1.z.string().min(1).max(255).optional(),
    nativeLanguage: exports.languageCodeValidator,
    targetLanguages: zod_1.z.array(exports.languageCodeValidator).optional(),
    isAdult: zod_1.z.boolean().optional(), // NEW: Feature 1 - Age verification
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailValidator,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
// ============================================================================
// Song Schemas - UPDATED for Feature 1
// ============================================================================
exports.createSongSchema = zod_1.z.object({
    youtubeUrl: exports.youtubeUrlValidator,
    youtubeVideoId: zod_1.z.string().min(1).max(20),
    title: zod_1.z.string().min(1).max(500),
    artist: zod_1.z.string().max(500).optional(),
    album: zod_1.z.string().max(500).optional(),
    language: exports.languageCodeValidator,
    lyricsPlainText: zod_1.z.string().min(1, 'Lyrics are required'),
    lyricsParsed: zod_1.z.object({
        metadata: zod_1.z.object({
            lineCount: zod_1.z.number().int().positive(),
            totalDurationMs: zod_1.z.number().int().positive(),
            syncQuality: zod_1.z.enum(['high', 'medium', 'low']),
            syncedBy: zod_1.z.enum(['user', 'auto', 'community']),
            syncedAt: zod_1.z.string(),
            offsetMs: zod_1.z.number().int(),
        }),
        lines: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            lineNumber: zod_1.z.number().int().positive(),
            text: zod_1.z.string(),
            startTimeMs: zod_1.z.number().int().nonnegative(),
            endTimeMs: zod_1.z.number().int().positive(),
            isChorus: zod_1.z.boolean(),
            difficulty: zod_1.z.object({
                wpm: zod_1.z.number().int().positive(),
                complexity: zod_1.z.number().int().min(1).max(10),
                hasSpecialChars: zod_1.z.boolean(),
            }),
            words: zod_1.z
                .array(zod_1.z.object({
                word: zod_1.z.string(),
                startOffsetMs: zod_1.z.number().int().nonnegative(),
                durationMs: zod_1.z.number().int().positive(),
            }))
                .optional(),
        })),
    }),
    isExplicit: zod_1.z.boolean().optional(), // NEW: Feature 1 - Explicit content flag
    contentRating: zod_1.z.enum(['everyone', 'teen', 'mature']).optional(), // NEW: Feature 1
});
exports.updateSongSchema = exports.createSongSchema.partial();
exports.songFiltersSchema = zod_1.z.object({
    language: exports.languageCodeValidator.optional(),
    difficultyMin: zod_1.z.number().int().min(1).max(10).optional(),
    difficultyMax: zod_1.z.number().int().min(1).max(10).optional(),
    visibility: zod_1.z.enum(['public', 'private', 'unlisted']).optional(),
    search: zod_1.z.string().optional(),
    excludeExplicit: zod_1.z.boolean().optional(), // NEW: Feature 1 - Filter explicit content
});
// ============================================================================
// Session Schemas
// ============================================================================
exports.startSessionSchema = zod_1.z.object({
    songId: exports.uuidValidator,
    difficultyMode: zod_1.z.enum(['easy', 'medium', 'hard']),
    deviceType: zod_1.z.enum(['mobile', 'tablet', 'desktop']).optional(),
});
exports.updateSessionSchema = zod_1.z.object({
    linesCompleted: zod_1.z.number().int().nonnegative().optional(),
    linesSkipped: zod_1.z.number().int().nonnegative().optional(),
    accuracyPercentage: zod_1.z.number().min(0).max(100).optional(),
    lineAccuracies: zod_1.z
        .array(zod_1.z.object({
        lineNumber: zod_1.z.number().int().positive(),
        accuracy: zod_1.z.number().min(0).max(100),
        timeTakenMs: zod_1.z.number().int().positive(),
        attempts: zod_1.z.number().int().positive(),
        skipped: zod_1.z.boolean().optional(),
    }))
        .optional(),
    pauseCount: zod_1.z.number().int().nonnegative().optional(),
    autoPauseCount: zod_1.z.number().int().nonnegative().optional(),
    manualPauseCount: zod_1.z.number().int().nonnegative().optional(),
    rewindCount: zod_1.z.number().int().nonnegative().optional(),
    wordsClicked: zod_1.z
        .array(zod_1.z.object({
        word: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        lineNumber: zod_1.z.number().int().positive(),
    }))
        .optional(),
    sessionAnalytics: zod_1.z
        .object({
        typingSpeedWpm: zod_1.z.number().nonnegative(),
        peakAccuracy: zod_1.z.number().min(0).max(100),
        struggleLines: zod_1.z.array(zod_1.z.number().int().positive()),
        fastLines: zod_1.z.array(zod_1.z.number().int().positive()),
        timeDistribution: zod_1.z.object({
            typing: zod_1.z.number().int().nonnegative(),
            paused: zod_1.z.number().int().nonnegative(),
            videoPlaying: zod_1.z.number().int().nonnegative(),
        }),
    })
        .optional(),
    xpEarned: zod_1.z.number().int().nonnegative().optional(),
});
exports.completeSessionSchema = exports.updateSessionSchema.extend({
    completedAt: zod_1.z.string().datetime(),
    durationSeconds: zod_1.z.number().int().positive(),
});
// ============================================================================
// Vocabulary Schemas
// ============================================================================
exports.wordLookupSchema = zod_1.z.object({
    word: zod_1.z.string().min(1).max(255),
    language: exports.languageCodeValidator,
    context: zod_1.z.string().optional(),
    songId: exports.uuidValidator.optional(),
});
// ============================================================================
// Grammar Schemas
// ============================================================================
exports.grammarProgressUpdateSchema = zod_1.z.object({
    status: zod_1.z.enum(['not_started', 'in_progress', 'completed', 'mastered']).optional(),
    completionPercentage: zod_1.z.number().int().min(0).max(100).optional(),
    quizScore: zod_1.z.number().min(0).max(100).optional(),
});
// ============================================================================
// User Preferences Schema
// ============================================================================
exports.updatePreferencesSchema = zod_1.z.object({
    theme: zod_1.z.enum(['light', 'dark']).optional(),
    autoPauseThresholdMs: zod_1.z.number().int().min(3000).max(15000).optional(),
    rewindAmountMs: zod_1.z.number().int().min(3000).max(10000).optional(),
    autoResume: zod_1.z.boolean().optional(),
    typoTolerance: zod_1.z.boolean().optional(),
    showTranslations: zod_1.z.boolean().optional(),
    notificationSettings: zod_1.z
        .object({
        email: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        streakReminders: zod_1.z.boolean().optional(),
    })
        .optional(),
});
// ============================================================================
// Pagination Schema
// ============================================================================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ============================================================================
// Helper function to validate request body
// ============================================================================
const validateBody = (schema, data) => {
    return schema.parse(data);
};
exports.validateBody = validateBody;
// ============================================================================
// Helper to transform query params to correct types
// ============================================================================
const parseQueryParams = (query) => {
    const parsed = {};
    for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null)
            continue;
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
exports.parseQueryParams = parseQueryParams;
