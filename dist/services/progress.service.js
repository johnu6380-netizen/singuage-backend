"use strict";
// backend/src/services/progress.service.ts
// Track learning progress, XP, and streaks
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStreakCalendar = exports.getSongProgress = exports.getUserProgress = exports.recordSession = void 0;
const client_1 = require("@prisma/client");
const errors_1 = require("../utils/errors");
const prisma = new client_1.PrismaClient();
const XP_REWARDS = {
    easy: 10,
    medium: 20,
    hard: 30,
};
/**
 * Record a completed learning session
 */
const recordSession = async (userId, sessionData) => {
    try {
        // Get current user data
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
            throw new errors_1.NotFoundError('User not found');
        }
        // Calculate XP earned
        const baseXp = XP_REWARDS[sessionData.difficulty];
        const accuracyBonus = Math.floor((sessionData.accuracy / 100) * baseXp * 0.5);
        const xpEarned = baseXp + accuracyBonus;
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
        }
        else if (lastPractice.getTime() === yesterday.getTime()) {
            // Practiced yesterday, increment streak
            newStreak += 1;
        }
        else if (lastPractice.getTime() === today.getTime()) {
            // Already practiced today, keep streak
            newStreak = user.currentStreak || 1;
        }
        else {
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
                lastPracticeDate: new Date(),
            },
        });
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
    }
    catch (error) {
        console.error('Error recording session:', error);
        throw new Error('Failed to record session');
    }
};
exports.recordSession = recordSession;
/**
 * Get user progress statistics
 */
const getUserProgress = async (userId) => {
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
            throw new errors_1.NotFoundError('User not found');
        }
        const sessions = await prisma.learningSession.findMany({
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: 10,
        });
        const totalSessions = await prisma.learningSession.count({
            where: { userId },
        });
        const avgAccuracy = sessions.length > 0
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
    }
    catch (error) {
        console.error('Error fetching progress:', error);
        throw new Error('Failed to fetch progress');
    }
};
exports.getUserProgress = getUserProgress;
/**
 * Get progress for a specific song
 */
const getSongProgress = async (userId, songId) => {
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
        const bestAccuracy = Math.max(...sessions.map(s => s.accuracy));
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
    }
    catch (error) {
        console.error('Error fetching song progress:', error);
        throw new Error('Failed to fetch song progress');
    }
};
exports.getSongProgress = getSongProgress;
/**
 * Get streak calendar data (last 30 days)
 */
const getStreakCalendar = async (userId) => {
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
        const uniqueDates = new Set();
        sessions.forEach(session => {
            const date = new Date(session.completedAt);
            date.setHours(0, 0, 0, 0);
            uniqueDates.add(date.toISOString());
        });
        return Array.from(uniqueDates).map(dateStr => new Date(dateStr));
    }
    catch (error) {
        console.error('Error fetching streak calendar:', error);
        return [];
    }
};
exports.getStreakCalendar = getStreakCalendar;
