"use strict";
// backend/src/routes/progress.routes.ts
// CHECKED: All handlers have proper return types
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
const auth_middleware_1 = require("../middleware/auth.middleware");
const progressService = __importStar(require("../services/progress.service"));
const errors_1 = require("../utils/errors");
const router = (0, express_1.Router)();
/**
 * POST /api/progress/session
 */
router.post('/session', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await progressService.recordSession(userId, req.body);
        res.json({
            message: 'Session recorded successfully',
            ...result,
        });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
});
/**
 * GET /api/progress
 */
router.get('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const progress = await progressService.getUserProgress(userId);
        res.json(progress);
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
});
/**
 * GET /api/progress/song/:songId
 */
router.get('/song/:songId', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { songId } = req.params;
        const progress = await progressService.getSongProgress(userId, songId);
        res.json(progress);
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
});
/**
 * GET /api/progress/streak-calendar
 */
router.get('/streak-calendar', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const calendar = await progressService.getStreakCalendar(userId);
        res.json({ dates: calendar });
    }
    catch (error) {
        const apiError = (0, errors_1.handleApiError)(error);
        res.status(apiError.statusCode).json({ error: apiError.message });
    }
});
exports.default = router;
