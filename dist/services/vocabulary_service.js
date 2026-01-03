"use strict";
// backend/src/services/vocabulary_service.ts
// Vocabulary service for database operations
Object.defineProperty(exports, "__esModule", { value: true });
exports.vocabularyService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.vocabularyService = {
    // Add a new word to user's vocabulary
    async addWord(userId, data) {
        const normalizedWord = data.word.toLowerCase().trim();
        // Check if word already exists for this user
        const existing = await prisma.vocabularyWord.findUnique({
            where: {
                userId_word_language: {
                    userId,
                    word: normalizedWord,
                    language: data.language,
                },
            },
        });
        if (existing) {
            throw new Error('Word already in vocabulary');
        }
        return prisma.vocabularyWord.create({
            data: {
                userId,
                word: normalizedWord,
                language: data.language,
                context: data.context,
                translation: data.translation,
                status: 'learning',
            },
        });
    },
    // Get user's vocabulary words with optional filters
    async getUserWords(userId, filters) {
        const where = { userId };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.language) {
            where.language = filters.language;
        }
        return prisma.vocabularyWord.findMany({
            where,
            orderBy: [
                { status: 'asc' },
                { createdAt: 'desc' },
            ],
        });
    },
    // Update a word (translation or status)
    async updateWord(wordId, userId, data) {
        // Verify ownership
        const word = await prisma.vocabularyWord.findUnique({
            where: { id: wordId },
        });
        if (!word || word.userId !== userId) {
            throw new Error('Word not found or unauthorized');
        }
        const updateData = {};
        if (data.translation !== undefined) {
            updateData.translation = data.translation;
        }
        if (data.status !== undefined) {
            updateData.status = data.status;
            if (data.status === 'learned') {
                updateData.learnedAt = new Date();
            }
        }
        return prisma.vocabularyWord.update({
            where: { id: wordId },
            data: updateData,
        });
    },
    // Test if user knows a word (quiz)
    async testWord(wordId, userId, userAnswer) {
        const word = await prisma.vocabularyWord.findUnique({
            where: { id: wordId },
        });
        if (!word || word.userId !== userId) {
            throw new Error('Word not found or unauthorized');
        }
        if (!word.translation) {
            throw new Error('No translation set for this word');
        }
        // Normalize both answers for comparison
        const normalizeForComparison = (text) => {
            return text
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
        };
        const normalizedAnswer = normalizeForComparison(userAnswer);
        const normalizedTranslation = normalizeForComparison(word.translation);
        const isCorrect = normalizedAnswer === normalizedTranslation;
        // If correct, mark as learned
        if (isCorrect) {
            await prisma.vocabularyWord.update({
                where: { id: wordId },
                data: {
                    status: 'learned',
                    learnedAt: new Date(),
                },
            });
        }
        return { correct: isCorrect, word };
    },
    // Delete a word
    async deleteWord(wordId, userId) {
        // Verify ownership
        const word = await prisma.vocabularyWord.findUnique({
            where: { id: wordId },
        });
        if (!word || word.userId !== userId) {
            throw new Error('Word not found or unauthorized');
        }
        return prisma.vocabularyWord.delete({
            where: { id: wordId },
        });
    },
    // Get vocabulary statistics
    async getStats(userId) {
        const allWords = await prisma.vocabularyWord.findMany({
            where: { userId },
        });
        const stats = {
            total: allWords.length,
            learning: allWords.filter(w => w.status === 'learning').length,
            learned: allWords.filter(w => w.status === 'learned').length,
            byLanguage: [],
        };
        // Group by language
        const languageCounts = allWords.reduce((acc, word) => {
            acc[word.language] = (acc[word.language] || 0) + 1;
            return acc;
        }, {});
        stats.byLanguage = Object.entries(languageCounts).map(([language, count]) => ({
            language,
            count,
        }));
        return stats;
    },
};
