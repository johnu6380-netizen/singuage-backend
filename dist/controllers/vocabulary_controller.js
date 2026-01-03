"use strict";
// backend/src/controllers/vocabulary_controller.ts
// HTTP request handlers for vocabulary endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = exports.deleteWord = exports.testWord = exports.updateWord = exports.getUserWords = exports.addWord = void 0;
const vocabulary_service_1 = require("../services/vocabulary_service");
// Add a word to vocabulary
const addWord = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { word, language, context, translation } = req.body;
        if (!word || !language) {
            return res.status(400).json({ error: 'Word and language are required' });
        }
        const vocabularyWord = await vocabulary_service_1.vocabularyService.addWord(userId, {
            word,
            language,
            context,
            translation,
        });
        res.status(201).json({ word: vocabularyWord });
    }
    catch (error) {
        if (error.message === 'Word already in vocabulary') {
            return res.status(409).json({ error: error.message });
        }
        console.error('Error adding word:', error);
        res.status(500).json({ error: 'Failed to add word' });
    }
};
exports.addWord = addWord;
// Get user's vocabulary words
const getUserWords = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { status, language } = req.query;
        const words = await vocabulary_service_1.vocabularyService.getUserWords(userId, {
            status: status,
            language: language,
        });
        res.json({ words });
    }
    catch (error) {
        console.error('Error getting words:', error);
        res.status(500).json({ error: 'Failed to get words' });
    }
};
exports.getUserWords = getUserWords;
// Update a word
const updateWord = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        const { translation, status } = req.body;
        const word = await vocabulary_service_1.vocabularyService.updateWord(id, userId, {
            translation,
            status,
        });
        res.json({ word });
    }
    catch (error) {
        if (error.message === 'Word not found or unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error updating word:', error);
        res.status(500).json({ error: 'Failed to update word' });
    }
};
exports.updateWord = updateWord;
// Test if user knows a word
const testWord = async (req, res) => {
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
        const result = await vocabulary_service_1.vocabularyService.testWord(id, userId, userAnswer);
        res.json(result);
    }
    catch (error) {
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
exports.testWord = testWord;
// Delete a word
const deleteWord = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id } = req.params;
        await vocabulary_service_1.vocabularyService.deleteWord(id, userId);
        res.json({ success: true });
    }
    catch (error) {
        if (error.message === 'Word not found or unauthorized') {
            return res.status(404).json({ error: error.message });
        }
        console.error('Error deleting word:', error);
        res.status(500).json({ error: 'Failed to delete word' });
    }
};
exports.deleteWord = deleteWord;
// Get vocabulary statistics
const getStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const stats = await vocabulary_service_1.vocabularyService.getStats(userId);
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
};
exports.getStats = getStats;
