// backend/src/services/song.service.ts

import { prisma } from '../config/database';
import { NotFoundError, AuthorizationError } from '../utils/errors';

export const getSongById = async (userId: string, songId: string) => {
  const song = await prisma.song.findUnique({
    where: { id: songId },
  });

  if (!song) throw new NotFoundError('Song not found');
  if (song.userId !== userId) throw new AuthorizationError('Forbidden');

  return song;
};

// Create a new song and set user's firstSongId if not already set
export const createSong = async (
  userId: string,
  data: {
    youtubeVideoId: string;
    title: string;
    artist: string;
    language: string;
    difficultyRating: number;
    isExplicit: boolean;
    contentRating: string | null;
    lyricsParsed: any;
  }
) => {
  // Use a transaction to ensure we create the song and set firstSongId atomically
  const created = await prisma.$transaction(async (tx) => {
    const song = await tx.song.create({
      data: {
        userId,
        youtubeVideoId: data.youtubeVideoId,
        title: data.title,
        artist: data.artist,
        language: data.language,
        difficultyRating: data.difficultyRating,
        isExplicit: data.isExplicit,
        contentRating: data.contentRating,
        lyricsParsed: data.lyricsParsed,
      },
    });

    const user = await tx.user.findUnique({ where: { id: userId }, select: { firstSongId: true } });

    // If this is the user's first song, set firstSongId (only set if null)
    if (user && !user.firstSongId) {
      await tx.user.update({ where: { id: userId }, data: { firstSongId: song.id } });
    }

    return song;
  });

  return created;
};

export const getUserSongs = async (userId: string) => {
  // Exclude internal per-user "Vocabulary Review" placeholder songs (youtubeVideoId === 'vocabulary-review')
  const songs = await prisma.song.findMany({
    where: {
      userId,
      NOT: { youtubeVideoId: 'vocabulary-review' },
    },
    orderBy: { addedAt: 'desc' },
  });
  return songs;
};

export const getSongByVideoId = async (videoId: string) => {
  // Public lookup by YouTube video id
  const song = await prisma.song.findFirst({
    where: { youtubeVideoId: videoId },
  });
  return song || null;
};

// Lookup a song by YouTube video id that belongs to a specific user.
// This ensures lyrics and per-user data are not exposed to other users.
export const getUserSongByVideoId = async (userId: string, videoId: string) => {
  const song = await prisma.song.findFirst({
    where: { youtubeVideoId: videoId, userId },
  });
  return song || null;
};

export const deleteSong = async (userId: string, id: string) => {
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) throw new NotFoundError('Song not found');
  if (song.userId !== userId) throw new AuthorizationError('Forbidden');

  // If the song was the user's firstSongId, clear it.
  await prisma.$transaction(async (tx) => {
    await tx.song.delete({ where: { id } });

    // Clear firstSongId if it referenced this song (optional but keeps data sane)
    const user = await tx.user.findUnique({ where: { id: userId }, select: { firstSongId: true } });
    if (user && user.firstSongId === id) {
      await tx.user.update({ where: { id: userId }, data: { firstSongId: null } });
    }
  });

  return true;
};

export const updateSong = async (
  userId: string,
  id: string,
  updates: Partial<{
    title: string;
    artist: string;
    language: string;
    difficultyRating: number;
    isExplicit: boolean;
    contentRating: string | null;
    lyricsParsed: any;
  }>
) => {
  const song = await prisma.song.findUnique({ where: { id } });
  if (!song) throw new NotFoundError('Song not found');
  if (song.userId !== userId) throw new AuthorizationError('Forbidden');

  const updated = await prisma.song.update({ where: { id }, data: { ...updates } as any });
  return updated;
};