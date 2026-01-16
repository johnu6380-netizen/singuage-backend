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
      name: 'achievements.items.first_song.name',
      description: 'achievements.items.first_song.description',
      icon: '🎵',
      category: 'Learning',
      unlocked: totalSessions >= 1,
      progress: Math.min(totalSessions, 1),
      maxProgress: 1,
      unlockedAt: totalSessions >= 1 ? getUnlockedDate(sessions, 0) : undefined,
    },
    {
      id: 'song_enthusiast',
      name: 'achievements.items.song_enthusiast.name',
      description: 'achievements.items.song_enthusiast.description',
      icon: '🎶',
      category: 'Learning',
      unlocked: totalSessions >= 10,
      progress: Math.min(totalSessions, 10),
      maxProgress: 10,
      unlockedAt: totalSessions >= 10 ? getUnlockedDate(sessions, 9) : undefined,
    },
    {
      id: 'song_master',
      name: 'achievements.items.song_master.name',
      description: 'achievements.items.song_master.description',
      icon: '🎼',
      category: 'Learning',
      unlocked: totalSessions >= 50,
      progress: Math.min(totalSessions, 50),
      maxProgress: 50,
      unlockedAt: totalSessions >= 50 ? getUnlockedDate(sessions, 49) : undefined,
    },
    {
      id: 'library_builder',
      name: 'achievements.items.library_builder.name',
      description: 'achievements.items.library_builder.description',
      icon: '📚',
      category: 'Learning',
      unlocked: totalSongsAdded >= 5,
      progress: Math.min(totalSongsAdded, 5),
      maxProgress: 5,
    },

    // Streak Category
    {
      id: 'streak_starter',
      name: 'achievements.items.streak_starter.name',
      description: 'achievements.items.streak_starter.description',
      icon: '🔥',
      category: 'Streak',
      unlocked: longestStreak >= 3,
      progress: Math.min(currentStreak, 3),
      maxProgress: 3,
    },
    {
      id: 'week_warrior',
      name: 'achievements.items.week_warrior.name',
      description: 'achievements.items.week_warrior.description',
      icon: '💪',
      category: 'Streak',
      unlocked: longestStreak >= 7,
      progress: Math.min(currentStreak, 7),
      maxProgress: 7,
    },
    {
      id: 'month_master',
      name: 'achievements.items.month_master.name',
      description: 'achievements.items.month_master.description',
      icon: '🏆',
      category: 'Streak',
      unlocked: longestStreak >= 30,
      progress: Math.min(currentStreak, 30),
      maxProgress: 30,
    },

    // XP Category
    {
      id: 'xp_novice',
      name: 'achievements.items.xp_novice.name',
      description: 'achievements.items.xp_novice.description',
      icon: '⭐',
      category: 'XP',
      unlocked: totalXp >= 100,
      progress: Math.min(totalXp, 100),
      maxProgress: 100,
    },
    {
      id: 'xp_expert',
      name: 'achievements.items.xp_expert.name',
      description: 'achievements.items.xp_expert.description',
      icon: '✨',
      category: 'XP',
      unlocked: totalXp >= 500,
      progress: Math.min(totalXp, 500),
      maxProgress: 500,
    },
    {
      id: 'xp_master',
      name: 'achievements.items.xp_master.name',
      description: 'achievements.items.xp_master.description',
      icon: '💫',
      category: 'XP',
      unlocked: totalXp >= 1000,
      progress: Math.min(totalXp, 1000),
      maxProgress: 1000,
    },

    // Languages Category
    {
      id: 'bilingual',
      name: 'achievements.items.bilingual.name',
      description: 'achievements.items.bilingual.description',
      icon: '🌏',
      category: 'Languages',
      unlocked: uniqueLanguages >= 2,
      progress: Math.min(uniqueLanguages, 2),
      maxProgress: 2,
    },
    {
      id: 'polyglot',
      name: 'achievements.items.polyglot.name',
      description: 'achievements.items.polyglot.description',
      icon: '🌍',
      category: 'Languages',
      unlocked: uniqueLanguages >= 3,
      progress: Math.min(uniqueLanguages, 3),
      maxProgress: 3,
    },
    {
      id: 'language_master',
      name: 'achievements.items.language_master.name',
      description: 'achievements.items.language_master.description',
      icon: '🌎',
      category: 'Languages',
      unlocked: uniqueLanguages >= 5,
      progress: Math.min(uniqueLanguages, 5),
      maxProgress: 5,
    },

    // Mastery Category
    {
      id: 'perfect_score',
      name: 'achievements.items.perfect_score.name',
      description: 'achievements.items.perfect_score.description',
      icon: '💯',
      category: 'Mastery',
      unlocked: perfectSessions.length >= 1,
      progress: Math.min(perfectSessions.length, 1),
      maxProgress: 1,
      unlockedAt: perfectSessions.length >= 1 ? getUnlockedDate(perfectSessions, 0) : undefined,
    },
    {
      id: 'perfectionist',
      name: 'achievements.items.perfectionist.name',
      description: 'achievements.items.perfectionist.description',
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
      name: 'achievements.items.hard_mode_hero.name',
      description: 'achievements.items.hard_mode_hero.description',
      icon: '⚡',
      category: 'Challenge',
      unlocked: hardModeSessions.length >= 1,
      progress: Math.min(hardModeSessions.length, 1),
      maxProgress: 1,
      unlockedAt: hardModeSessions.length >= 1 ? getUnlockedDate(hardModeSessions, 0) : undefined,
    },
    {
      id: 'hard_mode_master',
      name: 'achievements.items.hard_mode_master.name',
      description: 'achievements.items.hard_mode_master.description',
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