"use strict";
// backend/src/routes/songs.routes.ts
// UPDATED: Added batch re-detection endpoint
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
const songsController = __importStar(require("../controllers/songs.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Create a song (user adds to their library) - protected
router.post('/', auth_middleware_1.authenticate, songsController.createSong);
// Get current user's saved songs - protected
router.get('/', auth_middleware_1.authenticate, songsController.getUserSongs);
// NEW: Batch re-detect languages for all user songs
router.post('/redetect-languages', auth_middleware_1.authenticate, songsController.redetectLanguages);
// Get song by YouTube video id (public)
router.get('/video/:videoId', songsController.getSongByVideoId);
// Delete a user's song
router.delete('/:id', auth_middleware_1.authenticate, songsController.deleteSong);
// Update a user's song (protected)
router.put('/:id', auth_middleware_1.authenticate, songsController.updateSong);
exports.default = router;
