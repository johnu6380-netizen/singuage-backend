"use strict";
// backend/src/routes/vocabulary_routes.ts
// API routes for vocabulary feature
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const vocabularyController = __importStar(require("../controllers/vocabulary_controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All vocabulary routes require authentication
// Add a word to vocabulary
router.post('/add', auth_middleware_1.authenticate, vocabularyController.addWord);
// Get user's vocabulary words (with optional filters)
router.get('/', auth_middleware_1.authenticate, vocabularyController.getUserWords);
// Get vocabulary statistics
router.get('/stats', auth_middleware_1.authenticate, vocabularyController.getStats);
// Test if user knows a word (quiz)
router.post('/:id/test', auth_middleware_1.authenticate, vocabularyController.testWord);
// Update a word (translation or status)
router.put('/:id', auth_middleware_1.authenticate, vocabularyController.updateWord);
// Delete a word
router.delete('/:id', auth_middleware_1.authenticate, vocabularyController.deleteWord);
exports.default = router;
