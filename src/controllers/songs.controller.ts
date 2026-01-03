// backend/src/controllers/songs.controller.ts
// FIXED: Always detect language from lyrics, lyrics required, batch re-detection endpoint

import { Request, Response } from 'express';
import * as songService from '../services/song.service';
import { detectLanguage as detectLanguageUtil } from '../utils/language';

export const createSong = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string;
    const {
      youtubeVideoId,
      title,
      artist,
      language,
      difficultyRating,
      isExplicit,
      contentRating,
      lyrics,
      forceLanguage, // NEW: Allow user to force a specific language
    } = req.body;

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!youtubeVideoId || !title || !artist) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // VALIDATION: Lyrics are now REQUIRED
    if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length === 0) {
      return res.status(400).json({ error: 'Lyrics are required to add a song' });
    }

    // Convert pasted lyrics into the minimal lyricsParsed structure
    const lines = (lyrics as string)
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({
        id: `${Date.now()}-${i}`,
        lineNumber: i + 1,
        text,
        startTimeMs: 0,
        endTimeMs: 0,
      }));

    const lyricsParsed = {
      metadata: {
        lineCount: lines.length,
        totalDurationMs: 0,
        syncQuality: 'low',
        offsetMs: 0,
      },
      lines,
    };

    // IMPROVED: Language detection logic
    let finalLanguage = language;

    // If user explicitly forced a language (via UI toggle), respect it
    if (forceLanguage && language && !['unknown', 'auto', 'detect', ''].includes(String(language).toLowerCase())) {
      finalLanguage = language;
      console.log('🔒 Using user-forced language:', finalLanguage);
    } 
    // Otherwise, ALWAYS detect language from lyrics (since lyrics are now required)
    else {
      try {
        const text = lines.map((l: any) => l.text).join('\n');
        const detected = await detectLanguageUtil(text);
        
        console.log('🔍 Language detection result:', {
          detected: detected?.language,
          confidence: detected?.confidence,
          original: language
        });

        if (detected && detected.language && detected.confidence >= 0.3) {
          finalLanguage = detected.language;
          console.log('✅ Using detected language:', finalLanguage);
        } else if (!finalLanguage || ['unknown', 'auto', 'detect', ''].includes(String(finalLanguage).toLowerCase())) {
          // If detection failed and no valid language provided, default to 'en'
          finalLanguage = 'en';
          console.log('⚠️ Detection uncertain, defaulting to English');
        }
      } catch (err) {
        console.warn('❌ Language detection failed:', err);
        // Keep original or default to 'en'
        if (!finalLanguage || ['unknown', 'auto', 'detect', ''].includes(String(finalLanguage).toLowerCase())) {
          finalLanguage = 'en';
        }
      }
    }

    const song = await songService.createSong(userId, {
      youtubeVideoId,
      title,
      artist,
      language: finalLanguage,
      difficultyRating,
      isExplicit,
      contentRating,
      lyricsParsed,
    });

    return res.json({ song });
  } catch (error) {
    console.error('Create song error:', error);
    return res.status(500).json({ error: 'Failed to create song' });
  }
};

export const getUserSongs = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const songs = await songService.getUserSongs(userId);
    return res.json({ songs });
  } catch (error) {
    console.error('Get user songs error:', error);
    return res.status(500).json({ error: 'Failed to fetch songs' });
  }
};

export const getSongByVideoId = async (req: Request, res: Response) => {
  try {
    const videoId = req.params.videoId;
    if (!videoId) return res.status(400).json({ error: 'videoId required' });

    const song = await songService.getSongByVideoId(videoId);
    return res.json({ song: song || null });
  } catch (error) {
    console.error('Get song by video id error:', error);
    return res.status(500).json({ error: 'Failed to fetch song' });
  }
};

export const deleteSong = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string;
    const songId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!songId) return res.status(400).json({ error: 'song id required' });

    await songService.deleteSong(userId, songId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error('Delete song error:', error?.message || error);
    if (String(error?.message).toLowerCase().includes('forbidden')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(500).json({ error: 'Failed to delete song' });
  }
};

export const updateSong = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string;
    const songId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });
    if (!songId) return res.status(400).json({ error: 'song id required' });

    const {
      title,
      artist,
      language,
      difficultyRating,
      isExplicit,
      contentRating,
      lyrics,
      forceLanguage, // NEW: Allow forcing language
    } = req.body;

    // Build update payload
    const updateData: any = {};
    if (title) updateData.title = title;
    if (artist) updateData.artist = artist;
    if (typeof difficultyRating !== 'undefined') updateData.difficultyRating = difficultyRating;
    if (typeof isExplicit !== 'undefined') updateData.isExplicit = isExplicit;
    if (typeof contentRating !== 'undefined') updateData.contentRating = contentRating;

    // Handle lyrics -> lyricsParsed conversion if provided
    if (typeof lyrics === 'string') {
      if (lyrics.trim().length > 0) {
        const lines = (lyrics as string)
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean)
          .map((text, i) => ({
            id: `${Date.now()}-${i}`,
            lineNumber: i + 1,
            text,
            startTimeMs: 0,
            endTimeMs: 0,
          }));

        updateData.lyricsParsed = {
          metadata: {
            lineCount: lines.length,
            totalDurationMs: 0,
            syncQuality: 'low',
            offsetMs: 0,
          },
          lines,
        };

        // IMPROVED: Language detection on update
        // If user forced a specific language, use it
        if (forceLanguage && language && !['unknown', 'auto', 'detect', ''].includes(String(language).toLowerCase())) {
          updateData.language = language;
          console.log('🔒 Using user-forced language on update:', language);
        }
        // Otherwise, detect from lyrics
        else {
          try {
            const text = lines.map((l: any) => l.text).join('\n');
            const detected = await detectLanguageUtil(text);
            
            console.log('🔍 Update language detection:', {
              detected: detected?.language,
              confidence: detected?.confidence,
              provided: language
            });

            if (detected && detected.language && detected.confidence >= 0.3) {
              updateData.language = detected.language;
              console.log('✅ Using detected language on update:', detected.language);
            } else if (language) {
              updateData.language = language;
            }
          } catch (err) {
            console.warn('❌ Language detection (update) failed:', err);
            if (language) updateData.language = language;
          }
        }
      } else {
        updateData.lyricsParsed = {
          metadata: {
            lineCount: 0,
            totalDurationMs: 0,
            syncQuality: 'none',
            offsetMs: 0,
          },
          lines: [],
        };
      }
    } else if (language) {
      // Language updated without changing lyrics
      updateData.language = language;
    }

    const updated = await songService.updateSong(userId, songId, updateData);
    return res.json({ song: updated });
  } catch (error: any) {
    console.error('Update song error:', error?.message || error);
    const msg = String(error?.message || '').toLowerCase();
    if (msg.includes('not found')) return res.status(404).json({ error: 'Song not found' });
    if (msg.includes('forbidden')) return res.status(403).json({ error: 'Forbidden' });
    return res.status(500).json({ error: 'Failed to update song' });
  }
};

// NEW: Batch re-detect languages for existing songs
export const redetectLanguages = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id as string;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    // Get all user's songs
    const songs = await songService.getUserSongs(userId);
    
    let updated = 0;
    const results: any[] = [];

    for (const song of songs) {
      // Only re-detect if song has lyrics: ensure lyricsParsed is an object with a lines array
      if (
        song.lyricsParsed &&
        typeof song.lyricsParsed === 'object' &&
        'lines' in (song.lyricsParsed as any) &&
        Array.isArray((song.lyricsParsed as any).lines) &&
        (song.lyricsParsed as any).lines.length > 0
      ) {
        try {
          const text = (song.lyricsParsed as any).lines.map((l: any) => l.text).join('\n');
          const detected = await detectLanguageUtil(text);

          if (detected && detected.language && detected.confidence >= 0.3) {
            // Only update if language changed
            if (detected.language !== song.language) {
              await songService.updateSong(userId, song.id, {
                language: detected.language
              });
              
              updated++;
              results.push({
                songId: song.id,
                title: song.title,
                oldLanguage: song.language,
                newLanguage: detected.language,
                confidence: detected.confidence
              });
              
              console.log(`✅ Updated "${song.title}": ${song.language} → ${detected.language} (${detected.confidence})`);
            }
          }
        } catch (err) {
          console.warn(`❌ Failed to detect language for "${song.title}":`, err);
        }
      }
    }

    return res.json({
      success: true,
      totalSongs: songs.length,
      updatedCount: updated,
      results
    });
  } catch (error) {
    console.error('Batch re-detect error:', error);
    return res.status(500).json({ error: 'Failed to re-detect languages' });
  }
};