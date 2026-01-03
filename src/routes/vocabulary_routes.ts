// backend/src/routes/vocabulary_routes.ts
// API routes for vocabulary feature

import { Router } from 'express';
import * as vocabularyController from '../controllers/vocabulary_controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All vocabulary routes require authentication

// Add a word to vocabulary
router.post('/add', authenticate, vocabularyController.addWord);

// Get user's vocabulary words (with optional filters)
router.get('/', authenticate, vocabularyController.getUserWords);

// Get vocabulary statistics
router.get('/stats', authenticate, vocabularyController.getStats);

// Test if user knows a word (quiz)
router.post('/:id/test', authenticate, vocabularyController.testWord);

// Update a word (translation or status)
router.put('/:id', authenticate, vocabularyController.updateWord);

// Delete a word
router.delete('/:id', authenticate, vocabularyController.deleteWord);

export default router;
