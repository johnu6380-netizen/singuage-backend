// backend/src/services/achievements.service.ts
// Calculate user achievements based on real data

import { prisma } from '../config/database';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
  unlockedAt?: string;
}

export const getUserAchievements = async (userId: string): Promise<Achievement[]> => {
  // Fetch all necessary user data in parallel
  const [user, sessions, songs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXp: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
      },
    }),
    prisma.learningSession.findMany({
      where: { userId },
      select: {
        accuracy: true,
        difficulty: true,
        completedAt: true,
        song: {
          select: {
            language: true,
          },
        },
      },
      orderBy: {
        completedAt: 'asc',
      },
    }),
    prisma.song.findMany({
      where: { userId },
      select: {
        language: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  // Calculate stats
  const totalSessions = sessions.length;
  const totalXp = user.totalXp || 0;
  const currentStreak = user.currentStreak || 0;
  const longestStreak = user.longestStreak || 0;
  
  const perfectSessions = sessions.filter(s => s.accuracy === 100);
  const hardModeSessions = sessions.filter(s => s.difficulty === 'hard');
  
  // Count unique languages learned
  const languagesFromSessions = new Set(sessions.map(s => s.song.language));
  const uniqueLanguages = languagesFromSessions.size;
  
  // Count total songs added
  const totalSongsAdded = songs.length;
  
  // Helper function to get unlock date
  const getUnlockedDate = (sessions: any[], index: number = 0): string | undefined => {
    if (!sessions[index]) return undefined;
    return new Date(sessions[index].completedAt).toISOString();
  };

  // Define all achievements
  const achievements: Achievement[] = [
    // Learning Category
    {
      id: 'first_song',
      name: 'First Steps',
      description: 'Complete your first song',
      icon: '🎵',
      category: 'Learning',
      unlocked: totalSessions >= 1,
      progress: Math.min(totalSessions, 1),
      maxProgress: 1,
      unlockedAt: totalSessions >= 1 ? getUnlockedDate(sessions, 0) : undefined,
    },
    {
      id: 'song_enthusiast',
      name: 'Song Enthusiast',
      description: 'Complete 10 songs',
      icon: '🎶',
      category: 'Learning',
      unlocked: totalSessions >= 10,
      progress: Math.min(totalSessions, 10),
      maxProgress: 10,
      unlockedAt: totalSessions >= 10 ? getUnlockedDate(sessions, 9) : undefined,
    },
    {
      id: 'song_master',
      name: 'Song Master',
      description: 'Complete 50 songs',
      icon: '🎼',
      category: 'Learning',
      unlocked: totalSessions >= 50,
      progress: Math.min(totalSessions, 50),
      maxProgress: 50,
      unlockedAt: totalSessions >= 50 ? getUnlockedDate(sessions, 49) : undefined,
    },
    {
      id: 'library_builder',
      name: 'Library Builder',
      description: 'Add 5 songs to your library',
      icon: '📚',
      category: 'Learning',
      unlocked: totalSongsAdded >= 5,
      progress: Math.min(totalSongsAdded, 5),
      maxProgress: 5,
    },

    // Streak Category
    {
      id: 'streak_starter',
      name: 'Streak Starter',
      description: 'Maintain a 3-day streak',
      icon: '🔥',
      category: 'Streak',
      unlocked: longestStreak >= 3,
      progress: Math.min(currentStreak, 3),
      maxProgress: 3,
    },
    {
      id: 'week_warrior',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '💪',
      category: 'Streak',
      unlocked: longestStreak >= 7,
      progress: Math.min(currentStreak, 7),
      maxProgress: 7,
    },
    {
      id: 'month_master',
      name: 'Month Master',
      description: 'Maintain a 30-day streak',
      icon: '🏆',
      category: 'Streak',
      unlocked: longestStreak >= 30,
      progress: Math.min(currentStreak, 30),
      maxProgress: 30,
    },

    // XP Category
    {
      id: 'xp_novice',
      name: 'XP Novice',
      description: 'Earn 100 total XP',
      icon: '⭐',
      category: 'XP',
      unlocked: totalXp >= 100,
      progress: Math.min(totalXp, 100),
      maxProgress: 100,
    },
    {
      id: 'xp_expert',
      name: 'XP Expert',
      description: 'Earn 500 total XP',
      icon: '✨',
      category: 'XP',
      unlocked: totalXp >= 500,
      progress: Math.min(totalXp, 500),
      maxProgress: 500,
    },
    {
      id: 'xp_master',
      name: 'XP Master',
      description: 'Earn 1000 total XP',
      icon: '💫',
      category: 'XP',
      unlocked: totalXp >= 1000,
      progress: Math.min(totalXp, 1000),
      maxProgress: 1000,
    },

    // Languages Category
    {
      id: 'bilingual',
      name: 'Bilingual',
      description: 'Learn songs in 2 different languages',
      icon: '🌏',
      category: 'Languages',
      unlocked: uniqueLanguages >= 2,
      progress: Math.min(uniqueLanguages, 2),
      maxProgress: 2,
    },
    {
      id: 'polyglot',
      name: 'Polyglot',
      description: 'Learn songs in 3 different languages',
      icon: '🌍',
      category: 'Languages',
      unlocked: uniqueLanguages >= 3,
      progress: Math.min(uniqueLanguages, 3),
      maxProgress: 3,
    },
    {
      id: 'language_master',
      name: 'Language Master',
      description: 'Learn songs in 5 different languages',
      icon: '🌎',
      category: 'Languages',
      unlocked: uniqueLanguages >= 5,
      progress: Math.min(uniqueLanguages, 5),
      maxProgress: 5,
    },

    // Mastery Category
    {
      id: 'perfect_score',
      name: 'Perfect Score',
      description: 'Complete a song with 100% accuracy',
      icon: '💯',
      category: 'Mastery',
      unlocked: perfectSessions.length >= 1,
      progress: Math.min(perfectSessions.length, 1),
      maxProgress: 1,
      unlockedAt: perfectSessions.length >= 1 ? getUnlockedDate(perfectSessions, 0) : undefined,
    },
    {
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Complete 5 songs with 100% accuracy',
      icon: '🎯',
      category: 'Mastery',
      unlocked: perfectSessions.length >= 5,
      progress: Math.min(perfectSessions.length, 5),
      maxProgress: 5,
      unlockedAt: perfectSessions.length >= 5 ? getUnlockedDate(perfectSessions, 4) : undefined,
    },

    // Challenge Category
    {
      id: 'hard_mode_hero',
      name: 'Hard Mode Hero',
      description: 'Complete a song in hard mode',
      icon: '⚡',
      category: 'Challenge',
      unlocked: hardModeSessions.length >= 1,
      progress: Math.min(hardModeSessions.length, 1),
      maxProgress: 1,
      unlockedAt: hardModeSessions.length >= 1 ? getUnlockedDate(hardModeSessions, 0) : undefined,
    },
    {
      id: 'hard_mode_master',
      name: 'Hard Mode Master',
      description: 'Complete 10 songs in hard mode',
      icon: '💥',
      category: 'Challenge',
      unlocked: hardModeSessions.length >= 10,
      progress: Math.min(hardModeSessions.length, 10),
      maxProgress: 10,
      unlockedAt: hardModeSessions.length >= 10 ? getUnlockedDate(hardModeSessions, 9) : undefined,
    },
  ];

  return achievements;
};
