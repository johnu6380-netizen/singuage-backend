// backend/src/controllers/vocabulary_controller.ts
// HTTP request handlers for vocabulary endpoints

import { Request, Response } from 'express';
import { vocabularyService } from '../services/vocabulary_service';

// Add a word to vocabulary
export const addWord = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { word, language, context, translation } = req.body;

    if (!word || !language) {
      return res.status(400).json({ error: 'Word and language are required' });
    }

    const vocabularyWord = await vocabularyService.addWord(userId, {
      word,
      language,
      context,
      translation,
    });

    res.status(201).json({ word: vocabularyWord });
  } catch (error: any) {
    if (error.message === 'Word already in vocabulary') {
      return res.status(409).json({ error: error.message });
    }
    console.error('Error adding word:', error);
    res.status(500).json({ error: 'Failed to add word' });
  }
};

// Get user's vocabulary words
export const getUserWords = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, language } = req.query;

    const words = await vocabularyService.getUserWords(userId, {
      status: status as 'learning' | 'learned' | undefined,
      language: language as string | undefined,
    });

    res.json({ words });
  } catch (error) {
    console.error('Error getting words:', error);
    res.status(500).json({ error: 'Failed to get words' });
  }
};

// Update a word
export const updateWord = async (req: Request<{ id: string }>, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { translation, status } = req.body;

    const word = await vocabularyService.updateWord(id, userId, {
      translation,
      status,
    });

    res.json({ word });
  } catch (error: any) {
    if (error.message === 'Word not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error updating word:', error);
    res.status(500).json({ error: 'Failed to update word' });
  }
};

// Test if user knows a word
export const testWord = async (req: Request<{ id: string }>, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { userAnswer } = req.body;

    if (!userAnswer) {
      return res.status(400).json({ error: 'Answer is required' });
    }

    const result = await vocabularyService.testWord(id, userId, userAnswer);

    res.json(result);
  } catch (error: any) {
    if (error.message === 'Word not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'No translation set for this word') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error testing word:', error);
    res.status(500).json({ error: 'Failed to test word' });
  }
};

// Delete a word
export const deleteWord = async (req: Request<{ id: string }>, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await vocabularyService.deleteWord(id, userId);

    res.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Word not found or unauthorized') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error deleting word:', error);
    res.status(500).json({ error: 'Failed to delete word' });
  }
};

// Get vocabulary statistics
export const getStats = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const stats = await vocabularyService.getStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};