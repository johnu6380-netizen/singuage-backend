import { prisma } from '../config/database';
import { canonicalizeQuery, hashCanonicalQuery } from '../utils/language';
import { env } from '../config/env';

// Minimal fallback videos for environments without a YouTube API key (dev mode)
const FALLBACK_VIDEOS = [
  { videoId: 'ic8j13piAhQ', title: 'Cruel Summer', channelTitle: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/ic8j13piAhQ/mqdefault.jpg', publishedAt: null },
  { videoId: 'b1kbLwvqugk', title: 'Anti-Hero', channelTitle: 'Taylor Swift', thumbnail: 'https://img.youtube.com/vi/b1kbLwvqugk/mqdefault.jpg', publishedAt: null },
  { videoId: 'JGwWNGJdvx8', title: 'Shape of You', channelTitle: 'Ed Sheeran', thumbnail: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg', publishedAt: null },
  { videoId: 'kJQP7kiw5Fk', title: 'Despacito', channelTitle: 'Luis Fonsi', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg', publishedAt: null },
  { videoId: '9bZkp7q19f0', title: 'Gangnam Style', channelTitle: 'PSY', thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg', publishedAt: null },
];

/**
 * Lookup cached YouTube search results by query.
 * Returns the cached results (array of simplified video objects) if present and not expired.
 * Returns null if no cache entry or the entry is expired.
 */
export async function getCachedYoutubeSearch(query: string): Promise<any[] | null> {
  if (!query) return null;

  const canonical = canonicalizeQuery(query);
  const queryHash = hashCanonicalQuery(canonical);

  // DEBUG: log the canonicalization and hash so we can correlate with DB entries
  try {
    console.debug('[YT cache] lookup', { original: query, canonical, queryHash });
  } catch {}

  const record = await prisma.youtubeSearchCache.findUnique({
    where: { queryHash },
  });

  if (!record) {
    try { console.debug('[YT cache] miss (no record)', { queryHash, canonical }); } catch {}
    return null;
  }

  // If expiresAt is set, only return if it's in the future
  if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
    try { console.debug('[YT cache] miss (expired)', { queryHash, expiresAt: record.expiresAt }); } catch {}
    return null;
  }

  try { console.debug('[YT cache] hit', { queryHash, resultsLength: Array.isArray(record.results) ? record.results.length : 0 }); } catch {}

  // results is stored as JSON; return as-is (should be an array of simplified video objects)
  return (record.results as any) || null;
}

/**
 * Store YouTube search results in the cache (upsert).
 * - canonicalizes and hashes the query
 * - stores results JSON and canonicalQuery
 * - sets expiresAt to 24 hours from now
 */
export async function storeYoutubeSearchCache(query: string, results: any[]): Promise<void> {
  if (!query) return;

  const canonical = canonicalizeQuery(query);
  const queryHash = hashCanonicalQuery(canonical);

  // Set TTL to 6 months from now
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 6);

  try {
    await prisma.youtubeSearchCache.upsert({
      where: { queryHash },
      create: {
        queryHash,
        canonicalQuery: canonical,
        results,
        createdAt: new Date(),
        expiresAt,
      },
      update: {
        canonicalQuery: canonical,
        results,
        expiresAt,
      },
    });
    try { console.debug('[YT cache] stored', { queryHash, canonical, resultsLength: Array.isArray(results) ? results.length : 0 }); } catch {}
  } catch (e) {
    console.warn('Failed to upsert YouTube search cache:', e);
  }
}

export async function searchYoutubeWithCache(query: string): Promise<any[]> {
  if (!query) return [];

  // 1-2: Check cache
  const cached = await getCachedYoutubeSearch(query);
  if (cached && cached.length > 0) {
    try { console.debug('[YT search] returning from cache', { original: query, length: cached.length }); } catch {}
    return cached;
  }

  try { console.debug('[YT search] cache miss, will attempt API call', { original: query }); } catch {}

  // 3: Call YouTube API on cache miss
  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    try { console.debug('[YT search] no YOUTUBE_API_KEY configured, returning fallback videos'); } catch {}
    // No API key configured; return reasonable fallback results so Discover is usable in dev
    const fallback = FALLBACK_VIDEOS.slice(0, 24);
    try {
      // store fallback in cache for this canonical query to avoid repeated work
      await storeYoutubeSearchCache(query, fallback);
    } catch (e) {
      console.warn('Failed to store fallback YouTube cache:', e);
    }
    return fallback;
  }

  const params = new URLSearchParams({
    key: apiKey,
    part: 'snippet',
    type: 'video',
    maxResults: '24',
    q: query,
  });

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

  try {
    try { console.debug('[YT search] calling YouTube API', { url }); } catch {}

    const res = await fetch(url);
    if (!res.ok) {
      console.warn('[YT search] YouTube API returned non-ok status', res.status);
      return [];
    }

    const data: any = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    const normalized = data.items.map((item: any) => {
      const snippet = item.snippet || {};
      const thumbnails = snippet.thumbnails || {};
      const thumbnail = (thumbnails.high && thumbnails.high.url) || (thumbnails.medium && thumbnails.medium.url) || (thumbnails.default && thumbnails.default.url) || '';

      return {
        videoId: item.id?.videoId || item.id,
        title: snippet.title || '',
        channelTitle: snippet.channelTitle || '',
        thumbnail,
        publishedAt: snippet.publishedAt || null,
      };
    });

    // 4: Store results in cache (fire-and-forget is acceptable, but await to ensure stored)
    try {
      await storeYoutubeSearchCache(query, normalized);
    } catch (e) {
      // Swallow cache store errors so API still returns results
      console.warn('Failed to store YouTube cache:', e);
    }

    // 5: Return normalized results
    return normalized;
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}