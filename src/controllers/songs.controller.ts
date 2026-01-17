// backend/src/controllers/songs.controller.ts
// FIXED: Ensure all route handlers exist and are exported (createSong/getUserSongs/getSongByVideoId/getSongById/deleteSong/updateSong/redetectLanguages)
// Also keeps existing behavior: lyrics required + language detection from lyrics when possible.

import { Request, Response } from 'express';
import * as songService from '../services/song.service';
import { handleApiError } from '../utils/errors';
import { detectLanguage } from '../utils/language';

/**
 * Helper: attempt to detect language from lyrics.
 * Falls back to provided language if detection fails.
 */
const detectSongLanguage = async (lyricsParsed: any, fallbackLanguage?: string): Promise<string> => {
  try {
    // Prefer a plain text extraction from parsed lyrics if present
    const lines: string[] =
      Array.isArray(lyricsParsed?.lines)
        ? lyricsParsed.lines
            .map((l: any) => (typeof l?.text === 'string' ? l.text : ''))
            .filter(Boolean)
        : [];

    const text = lines.join(' ').trim();

    if (!text) return fallbackLanguage || 'unknown';

    const detected = await detectLanguage(text);
    // detectLanguage may return null; keep fallback
    return detected?.language || fallbackLanguage || 'unknown';
  } catch {
    return fallbackLanguage || 'unknown';
  }
};

/**
 * POST /api/songs
 * Create a new song for the authenticated user.
 * Requires lyricsParsed.
 * Language is detected from lyrics when possible.
 */
export const createSong = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const {
      youtubeVideoId,
      title,
      artist,
      language,
      difficultyRating,
      isExplicit,
      contentRating,
      lyricsParsed,
    } = req.body as {
      youtubeVideoId?: string;
      title?: string;
      artist?: string;
      language?: string;
      difficultyRating?: number;
      isExplicit?: boolean;
      contentRating?: string | null;
      lyricsParsed?: any;
    };

    // Backwards-compat: accept raw `lyrics` string from older clients and convert to lyricsParsed
    let finalLyricsParsed = lyricsParsed;
    if (!finalLyricsParsed && typeof (req.body as any).lyrics === 'string') {
      const raw: string = (req.body as any).lyrics;
      const lines = raw
        .split('\n')
        .map(l => ({ text: l.trim() }))
        .filter((l: any) => l.text.length > 0);
      finalLyricsParsed = { lines };
    }

    if (!youtubeVideoId) {
      res.status(400).json({ error: 'youtubeVideoId is required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    if (!finalLyricsParsed) {
      res.status(400).json({ error: 'lyricsParsed is required' });
      return;
    }

    const detectedLanguage = await detectSongLanguage(finalLyricsParsed, language);

    const song = await songService.createSong(userId, {
      youtubeVideoId,
      title,
      artist: artist || 'Unknown Artist',
      language: detectedLanguage,
      difficultyRating: difficultyRating ?? 1,
      isExplicit: isExplicit ?? false,
      contentRating: contentRating ?? null,
      lyricsParsed: finalLyricsParsed,
    });

    res.json({ song });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * GET /api/songs
 * Get all songs for the authenticated user.
 */
export const getUserSongs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const songs = await songService.getUserSongs(userId);
    res.json({ songs });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * GET /api/songs/:id
 * Get a single song owned by the authenticated user.
 */
export const getSongById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const song = await songService.getSongById(userId, id);
    res.json({ song });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * GET /api/songs/video/:videoId
 * Public endpoint to fetch a song by YouTube video id.
 */
export const getSongByVideoId = async (req: Request<{ videoId: string }>, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const song = await songService.getSongByVideoId(videoId);
    res.json({ song: song || null });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * GET /api/songs/video/:videoId/me
 * Get a song for the authenticated user by YouTube video id
 */
export const getUserSongByVideoId = async (req: Request<{ videoId: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { videoId } = req.params;
    const song = await songService.getUserSongByVideoId(userId, videoId);
    res.json({ song: song || null });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * DELETE /api/songs/:id
 * Delete a song owned by the authenticated user.
 */
export const deleteSong = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await songService.deleteSong(userId, id);

    res.json({ success: true });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * PUT /api/songs/:id
 * Update song metadata (and optionally lyricsParsed).
 * If lyricsParsed changes, we re-detect language from lyrics.
 */
export const updateSong = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const updates = req.body as Partial<{
      title: string;
      artist: string;
      language: string;
      difficultyRating: number;
      isExplicit: boolean;
      contentRating: string | null;
      lyricsParsed: any;
    }>;

    // Backwards-compat: accept raw `lyrics` string on updates and convert to lyricsParsed
    const incoming: any = { ...updates };
    if (!incoming.lyricsParsed && typeof (req.body as any).lyrics === 'string') {
      const raw: string = (req.body as any).lyrics;
      const lines = raw
        .split('\n')
        .map((l: string) => ({ text: l.trim() }))
        .filter((l: any) => l.text.length > 0);
      incoming.lyricsParsed = { lines };
    }

    // If lyricsParsed provided, re-detect language from lyrics
    let languageToSave = incoming.language ?? updates.language;
    if (incoming.lyricsParsed) {
      languageToSave = await detectSongLanguage(incoming.lyricsParsed, incoming.language);
    }

    // Prevent sending raw 'lyrics' field to Prisma (schema doesn't have it)
    delete incoming.lyrics;

    const updated = await songService.updateSong(userId, id, {
      ...incoming,
      language: languageToSave ?? incoming.language,
    });

    res.json({ song: updated });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};

/**
 * POST /api/songs/redetect-languages
 * Re-detect languages for all songs owned by the authenticated user.
 * Useful when improving detection or importing songs.
 *
 * This endpoint MUST exist because songs.routes.ts references it.
 */
export const redetectLanguages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const songs = await songService.getUserSongs(userId);

    const results = await Promise.all(
      songs.map(async (s) => {
        const newLang = await detectSongLanguage(s.lyricsParsed, s.language);
        if (newLang && newLang !== s.language) {
          const updated = await songService.updateSong(userId, s.id, { language: newLang });
          return { songId: s.id, old: s.language, next: updated.language, changed: true };
        }
        return { songId: s.id, old: s.language, next: s.language, changed: false };
      })
    );

    res.json({
      success: true,
      total: results.length,
      changed: results.filter((r) => r.changed).length,
      results,
    });
  } catch (error) {
    const apiError = handleApiError(error);
    res.status(apiError.statusCode).json({ error: apiError.message });
  }
};