import { prisma } from '../config/database';
import { searchYoutubeWithCache } from './youtubeCache.service';

/**
 * Assemble discover videos by running several YouTube searches through the cached
 * search helper. This ensures all YouTube calls use the same caching layer.
 *
 * Sources considered (if available):
 * - explicit user query (if provided)
 * - user's preferredArtists (from DB)
 * - language-based searches (nativeLanguage and targetLanguages)
 * - "similar to artist" searches for each preferred artist
 *
 * The function deduplicates videos by videoId and limits final results to `limit`.
 */
export async function getDiscoverVideos(options: {
  userId?: string | null;
  query?: string | null;
  limit?: number;
}): Promise<Array<{ videoId: string; title: string; channelTitle: string; thumbnail: string; publishedAt: string | null }>> {
  const { userId, query, limit = 24 } = options;

  const searches: string[] = [];

  // 1) include explicit user query first so results prioritize it
  if (query && query.trim().length > 0) searches.push(query.trim());

  // 2) If we have a user, load their preferredArtists and languages
  if (userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferredArtists: true, nativeLanguage: true, targetLanguages: true } });
      if (user) {
        const artists = user.preferredArtists || [];
        for (const a of artists) {
          if (typeof a === 'string' && a.trim().length > 0) {
            searches.push(a.trim());
            // also try a "similar to" search which may surface related artists/content
            searches.push(`similar to ${a.trim()}`);
          }
        }

        // Language-based searches: prefer nativeLanguage then targetLanguages array
        if (user.nativeLanguage) {
          searches.push(`popular songs in ${user.nativeLanguage}`);
        }

        try {
          const targets = Array.isArray(user.targetLanguages) ? user.targetLanguages : [];
          for (const t of targets) {
            if (typeof t === 'string' && t.trim()) searches.push(`popular songs in ${t.trim()}`);
          }
        } catch {}
      }
    } catch (e) {
      // ignore DB errors and continue with whatever searches we have
      console.warn('getDiscoverVideos: failed to load user data', e);
    }
  }

  // Fallback generic searches if nothing else provided
  if (searches.length === 0) {
    searches.push('popular music');
  }

  // Run all searches through the cached search function (in parallel)
  const resultsArrays = await Promise.all(
    searches.map(async (s) => {
      try {
        const r = await searchYoutubeWithCache(s);
        return Array.isArray(r) ? r : [];
      } catch (e) {
        console.warn('searchYoutubeWithCache failed for', s, e);
        return [];
      }
    })
  );

  // Flatten, dedupe by videoId, and limit
  const seen = new Map<string, any>();
  for (const arr of resultsArrays) {
    for (const v of arr) {
      if (!v || !v.videoId) continue;
      if (!seen.has(v.videoId)) {
        // Ensure only the expected fields are present
        seen.set(v.videoId, {
          videoId: v.videoId,
          title: v.title || '',
          channelTitle: v.channelTitle || '',
          thumbnail: v.thumbnail || '',
          publishedAt: v.publishedAt || null,
        });
        if (seen.size >= limit) break;
      }
    }
    if (seen.size >= limit) break;
  }

  return Array.from(seen.values()).slice(0, limit);
}
