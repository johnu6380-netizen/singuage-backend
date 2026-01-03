// backend/src/services/vocabulary_service.ts
// Vocabulary service for database operations

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const vocabularyService = {
  // Add a new word to user's vocabulary
  async addWord(userId: string, data: {
    word: string;
    language: string;
    context?: string;
    translation?: string;
  }) {
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
  async getUserWords(userId: string, filters?: {
    status?: 'learning' | 'learned';
    language?: string;
  }) {
    const where: any = { userId };
    
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
  async updateWord(wordId: string, userId: string, data: {
    translation?: string;
    status?: 'learning' | 'learned';
  }) {
    // Verify ownership
    const word = await prisma.vocabularyWord.findUnique({
      where: { id: wordId },
    });

    if (!word || word.userId !== userId) {
      throw new Error('Word not found or unauthorized');
    }

    const updateData: any = {};
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
  async testWord(wordId: string, userId: string, userAnswer: string) {
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
    const normalizeForComparison = (text: string) => {
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
  async deleteWord(wordId: string, userId: string) {
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
  async getStats(userId: string) {
    const allWords = await prisma.vocabularyWord.findMany({
      where: { userId },
    });

    const stats = {
      total: allWords.length,
      learning: allWords.filter(w => w.status === 'learning').length,
      learned: allWords.filter(w => w.status === 'learned').length,
      byLanguage: [] as { language: string; count: number }[],
    };

    // Group by language
    const languageCounts = allWords.reduce((acc, word) => {
      acc[word.language] = (acc[word.language] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    stats.byLanguage = Object.entries(languageCounts).map(([language, count]) => ({
      language,
      count,
    }));

    return stats;
  },
};
