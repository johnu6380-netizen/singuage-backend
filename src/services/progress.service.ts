// backend/src/services/progress.service.ts
// Track learning progress, XP, and streaks

import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface SessionResult {
  songId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  accuracy: number;
  completedLines: number;
  totalLines: number;
  timeSpentMs: number;
}

const XP_REWARDS = {
  easy: 10,
  medium: 20,
  hard: 30,
};

// ============================================================================
// PREMIUM/FREEMIUM CONSTANTS
// ============================================================================
const DAILY_LINE_LIMIT_PER_SONG = 4;

type SongDailyLinesEntry = { date: string; used: number };
type SongDailyLinesMap = Record<string, SongDailyLinesEntry>;

const getServerDayKey = (d: Date = new Date()): string => {
  // Server-time date key: YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Consume typing allowance for a given song for today (server time).
// This is called from an API endpoint whenever the user completes lines.
//
// Rules:
// - If songId === user.firstSongId => unlimited, do not track.
// - Else max 4 lines/day per song.
// - Resets at midnight server time (based on date key).
export const consumeSongLines = async (
  userId: string,
  songId: string,
  linesToConsume: number
): Promise<{
  allowed: boolean;
  isFirstSong: boolean;
  usedToday: number;
  remainingToday: number;
  limit: number;
  date: string;
}> => {
  if (!songId) throw new Error('songId is required');
  if (!Number.isInteger(linesToConsume) || linesToConsume <= 0) {
    throw new Error('lines must be a positive integer');
  }

  // Ensure the song belongs to the user (prevents consuming against others’ songs)
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { id: true, userId: true },
  });

  if (!song || song.userId !== userId) {
    throw new NotFoundError('Song not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstSongId: true,
      songDailyLines: true,
      // Include subscription flag so server can bypass freemium limits for premium users
      hasPremium: true,
    },
  });

  if (!user) throw new NotFoundError('User not found');

  // If the user currently has premium, bypass daily freemium limits entirely.
  // Premium users are allowed unlimited lines for all songs.
  if (user.hasPremium) {
    return {
      allowed: true,
      isFirstSong: false,
      usedToday: 0,
      remainingToday: Number.MAX_SAFE_INTEGER,
      limit: Number.MAX_SAFE_INTEGER,
      date: getServerDayKey(),
    };
  }

  const isFirstSong = !!user.firstSongId && user.firstSongId === songId;

  // First song is fully free
  if (isFirstSong) {
    return {
      allowed: true,
      isFirstSong: true,
      usedToday: 0,
      remainingToday: Number.MAX_SAFE_INTEGER,
      limit: Number.MAX_SAFE_INTEGER,
      date: getServerDayKey(),
    };
  }

  const todayKey = getServerDayKey();

  // Parse JSON safely
  const rawMap = (user.songDailyLines || {}) as any;
  const map: SongDailyLinesMap = typeof rawMap === 'object' && rawMap ? rawMap : {};

  const entry: SongDailyLinesEntry =
    map[songId] && typeof map[songId] === 'object'
      ? map[songId]
      : { date: todayKey, used: 0 };

  // Reset if date changed (server time)
  const usedSoFar = entry.date === todayKey ? Number(entry.used || 0) : 0;
  const nextUsed = usedSoFar + linesToConsume;

  // If user would exceed the limit, block and DO NOT update stored usage
  if (nextUsed > DAILY_LINE_LIMIT_PER_SONG) {
    return {
      allowed: false,
      isFirstSong: false,
      usedToday: usedSoFar,
      remainingToday: Math.max(0, DAILY_LINE_LIMIT_PER_SONG - usedSoFar),
      limit: DAILY_LINE_LIMIT_PER_SONG,
      date: todayKey,
    };
  }

  // Persist updated map
  const newMap: SongDailyLinesMap = {
    ...map,
    [songId]: { date: todayKey, used: nextUsed },
  };

  await prisma.user.update({
    where: { id: userId },
    data: {
      songDailyLines: newMap as any,
    },
  });

  return {
    allowed: true,
    isFirstSong: false,
    usedToday: nextUsed,
    remainingToday: DAILY_LINE_LIMIT_PER_SONG - nextUsed,
    limit: DAILY_LINE_LIMIT_PER_SONG,
    date: todayKey,
  };
};

/**
 * Record a completed learning session
 */
export const recordSession = async (
  userId: string,
  sessionData: SessionResult
): Promise<{
  xpEarned: number;
  newTotalXp: number;
  newStreak: number;
  leveledUp: boolean;
}> => {
  try {
    console.debug('[recordSession] payload:', { userId, sessionData });
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
        lastPracticeDate: true,
        // Include premium flag so we can enforce freemium limits for vocab reviews
        hasPremium: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Special-case: vocabulary review sessions use a fixed XP and are represented by a per-user Song id.
    const REVIEW_XP = 10;
    const isVocabReview = sessionData.songId === 'vocabulary-review' || sessionData.songId === `vocabulary-review-${userId}`;
    if (isVocabReview) {
      // Use a per-user song id so LearningSession rows can reference a real Song owned by the user.
      const VOCAB_REVIEW_SONG_ID = `vocabulary-review-${userId}`;

      // Make the vocab review recording atomic to avoid race conditions:
      // Re-check today's count inside a transaction, then update user totals and create the learningSession.
      const DAILY_VOCAB_LIMIT = 2;

      if (user.hasPremium) {
        // Premium users bypass limits; perform regular update + create in a transaction for consistency
        const xpEarned = REVIEW_XP;
        const newTotalXp = (user.totalXp || 0) + xpEarned;

        // Compute streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
        if (lastPractice) lastPractice.setHours(0, 0, 0, 0);
        let newStreak = user.currentStreak || 0;
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!lastPractice) newStreak = 1;
        else if (lastPractice.getTime() === yesterday.getTime()) newStreak += 1;
        else if (lastPractice.getTime() === today.getTime()) newStreak = user.currentStreak || 1;
        else newStreak = 1;
        const newLongestStreak = Math.max(user.longestStreak || 0, newStreak);

        await prisma.$transaction(async (tx) => {
          // Ensure a per-user "Vocabulary Review" Song exists so the FK constraint is satisfied.
          await tx.song.upsert({
            where: { id: VOCAB_REVIEW_SONG_ID },
            create: {
              id: VOCAB_REVIEW_SONG_ID,
              userId,
              youtubeVideoId: 'vocabulary-review',
              title: 'Vocabulary Review',
              artist: 'Singuage',
              language: 'en',
              difficultyRating: 0,
              lyricsParsed: {},
            },
            update: {},
          });

          await tx.user.update({
            where: { id: userId },
            data: {
              totalXp: newTotalXp,
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
              // use the zeroed `today` so stored date represents the server day (00:00)
              lastPracticeDate: today,
            },
          });

          await tx.learningSession.create({
            data: {
              userId,
              songId: VOCAB_REVIEW_SONG_ID,
              difficulty: sessionData.difficulty,
              accuracy: sessionData.accuracy,
              completedLines: sessionData.completedLines,
              totalLines: sessionData.totalLines,
              timeSpentMs: sessionData.timeSpentMs,
              xpEarned,
              completedAt: new Date(),
            },
          });
        });

        return {
          xpEarned,
          newTotalXp,
          newStreak,
          leveledUp: Math.floor(newTotalXp / 100) > Math.floor((user.totalXp || 0) / 100),
        };
      }

      // Non-premium: perform atomic check + update
      const result = await prisma.$transaction(async (tx) => {
        // Ensure the per-user vocab review Song exists before counting/creating sessions
        await tx.song.upsert({
          where: { id: VOCAB_REVIEW_SONG_ID },
          create: {
            id: VOCAB_REVIEW_SONG_ID,
            userId,
            youtubeVideoId: 'vocabulary-review',
            title: 'Vocabulary Review',
            artist: 'Singuage',
            language: 'en',
            difficultyRating: 0,
            lyricsParsed: {},
          },
          update: {},
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysCount = await tx.learningSession.count({
          where: {
            userId,
            songId: VOCAB_REVIEW_SONG_ID,
            completedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (todaysCount >= DAILY_VOCAB_LIMIT) {
          throw new AppError('Daily free vocabulary review limit reached. Upgrade to premium to continue.', 402);
        }

        const xpEarned = REVIEW_XP;
        const newTotalXp = (user.totalXp || 0) + xpEarned;

        // Compute streak
        const todayKey = new Date();
        todayKey.setHours(0, 0, 0, 0);
        const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
        if (lastPractice) lastPractice.setHours(0, 0, 0, 0);
        let newStreak = user.currentStreak || 0;
        const yesterday = new Date(todayKey);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!lastPractice) newStreak = 1;
        else if (lastPractice.getTime() === yesterday.getTime()) newStreak += 1;
        else if (lastPractice.getTime() === todayKey.getTime()) newStreak = user.currentStreak || 1;
        else newStreak = 1;
        const newLongestStreak = Math.max(user.longestStreak || 0, newStreak);

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            totalXp: newTotalXp,
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            // use the zeroed `todayKey` so stored date represents the server day (00:00)
            lastPracticeDate: todayKey,
          },
        });

        const created = await tx.learningSession.create({
          data: {
            userId,
            songId: VOCAB_REVIEW_SONG_ID,
            difficulty: sessionData.difficulty,
            accuracy: sessionData.accuracy,
            completedLines: sessionData.completedLines,
            totalLines: sessionData.totalLines,
            timeSpentMs: sessionData.timeSpentMs,
            xpEarned,
            completedAt: new Date(),
          },
        });

        return { xpEarned, newTotalXp, newStreak };
      });

      return {
        xpEarned: result.xpEarned,
        newTotalXp: result.newTotalXp,
        newStreak: result.newStreak,
        leveledUp: Math.floor(result.newTotalXp / 100) > Math.floor((user.totalXp || 0) / 100),
      };
    }

    // Calculate XP earned per-line so it matches the frontend's "XP per line" display.
    // Base XP is awarded per completed line.
    const baseXp = XP_REWARDS[sessionData.difficulty];
    const xpFromLines = baseXp * (sessionData.completedLines || 0);
    // Accuracy bonus scales with number of lines completed as well.
    const accuracyBonus = Math.floor((sessionData.accuracy / 100) * baseXp * (sessionData.completedLines || 0) * 0.5);
    const xpEarned = xpFromLines + accuracyBonus;

    const newTotalXp = (user.totalXp || 0) + xpEarned;
    const oldLevel = Math.floor((user.totalXp || 0) / 100);
    const newLevel = Math.floor(newTotalXp / 100);
    const leveledUp = newLevel > oldLevel;

    // Calculate streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastPractice = user.lastPracticeDate ? new Date(user.lastPracticeDate) : null;
    if (lastPractice) {
      lastPractice.setHours(0, 0, 0, 0);
    }

    let newStreak = user.currentStreak || 0;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastPractice) {
      // First time practicing
      newStreak = 1;
    } else if (lastPractice.getTime() === yesterday.getTime()) {
      // Practiced yesterday, increment streak
      newStreak += 1;
    } else if (lastPractice.getTime() === today.getTime()) {
      // Already practiced today, keep streak
      newStreak = user.currentStreak || 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const newLongestStreak = Math.max(user.longestStreak || 0, newStreak);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: newTotalXp,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        // use the zeroed `today` so stored date represents the server day (00:00)
        lastPracticeDate: today,
      },
    });

    console.debug('[recordSession] song session calculated', { xpEarned, newTotalXp, newStreak });

    // Record session in database
    await prisma.learningSession.create({
      data: {
        userId,
        songId: sessionData.songId,
        difficulty: sessionData.difficulty,
        accuracy: sessionData.accuracy,
        completedLines: sessionData.completedLines,
        totalLines: sessionData.totalLines,
        timeSpentMs: sessionData.timeSpentMs,
        xpEarned,
        completedAt: new Date(),
      },
    });

    return {
      xpEarned,
      newTotalXp,
      newStreak,
      leveledUp,
    };
  } catch (error) {
    console.error('Error recording session:', error);
    // Re-throw the original error so upstream handlers can inspect status codes
    throw error;
  }
};

/**
 * Get user progress statistics
 */
export const getUserProgress = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
        lastPracticeDate: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const sessions = await prisma.learningSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const totalSessions = await prisma.learningSession.count({
      where: { userId },
    });

    const avgAccuracy =
      sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length)
        : 0;

    return {
      totalXp: user.totalXp || 0,
      currentLevel: Math.floor((user.totalXp || 0) / 100),
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      lastPracticeDate: user.lastPracticeDate,
      totalSessions,
      recentSessions: sessions,
      averageAccuracy: avgAccuracy,
    };
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw new Error('Failed to fetch progress');
  }
};

/**
 * Get progress for a specific song
 */
export const getSongProgress = async (userId: string, songId: string) => {
  try {
    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        songId,
      },
      orderBy: { completedAt: 'desc' },
    });

    if (sessions.length === 0) {
      return {
        timesCompleted: 0,
        bestAccuracy: 0,
        avgAccuracy: 0,
        totalXpEarned: 0,
        lastCompleted: null,
      };
    }

    const timesCompleted = sessions.length;
    const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy));
    const avgAccuracy = Math.round(sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length);
    const totalXpEarned = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const lastCompleted = sessions[0].completedAt;

    return {
      timesCompleted,
      bestAccuracy,
      avgAccuracy,
      totalXpEarned,
      lastCompleted,
    };
  } catch (error) {
    console.error('Error fetching song progress:', error);
    throw new Error('Failed to fetch song progress');
  }
};

/**
 * Get streak calendar data (last 30 days)
 */
export const getStreakCalendar = async (userId: string): Promise<Date[]> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await prisma.learningSession.findMany({
      where: {
        userId,
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        completedAt: true,
      },
      orderBy: {
        completedAt: 'asc',
      },
    });

    // Get unique dates
    const uniqueDates = new Set<string>();
    sessions.forEach((session) => {
      const date = new Date(session.completedAt);
      date.setHours(0, 0, 0, 0);
      uniqueDates.add(date.toISOString());
    });

    return Array.from(uniqueDates).map((dateStr) => new Date(dateStr));
  } catch (error) {
    console.error('Error fetching streak calendar:', error);
    return [];
  }
};

/**
 * Get today's vocabulary review count
 */
export const getTodayVocabReviewCount = async (userId: string): Promise<number> => {
  // Use a per-user vocab review song id so counts match the per-user LearningSession entries.
  const VOCAB_REVIEW_SONG_ID = `vocabulary-review-${userId}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Ensure the Song exists (safe no-op if already present)
  await prisma.song.upsert({
    where: { id: VOCAB_REVIEW_SONG_ID },
    create: {
      id: VOCAB_REVIEW_SONG_ID,
      userId,
      youtubeVideoId: 'vocabulary-review',
      title: 'Vocabulary Review',
      artist: 'Singuage',
      language: 'en',
      difficultyRating: 0,
      lyricsParsed: {},
    },
    update: {},
  });

  const count = await prisma.learningSession.count({
    where: {
      userId,
      songId: VOCAB_REVIEW_SONG_ID,
      completedAt: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return count;
};

/**
 * Get total XP earned by language for a user
 */
export const getXpByLanguage = async (userId: string): Promise<{ language: string; xp: number }[]> => {
  try {
    // Find all learning sessions for the user and include the song's language
    const sessions = await prisma.learningSession.findMany({
      where: { userId },
      select: {
        xpEarned: true,
        song: {
          select: {
            language: true,
          },
        },
      },
    });

    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const lang = (s.song && s.song.language) ? s.song.language : 'unknown';
      const xp = typeof s.xpEarned === 'number' ? s.xpEarned : 0;
      map[lang] = (map[lang] || 0) + xp;
    });

    return Object.keys(map).map((lang) => ({ language: lang, xp: map[lang] }));
  } catch (error) {
    console.error('Error computing XP by language:', error);
    throw new Error('Failed to compute XP by language');
  }
};
