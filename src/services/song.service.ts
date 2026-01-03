// backend/src/services/song.service.ts

import { prisma } from '../config/database';

export const createSong = async (userId: string, data: {
  youtubeVideoId: string;
  title: string;
  artist: string;
  language: string;
  difficultyRating?: number;
  isExplicit?: boolean;
  contentRating?: string | null;
  lyricsParsed: any;
}) => {
  const song = await prisma.song.create({
    data: {
      userId,
      youtubeVideoId: data.youtubeVideoId,
      title: data.title,
      artist: data.artist,
      language: data.language,
      difficultyRating: data.difficultyRating ?? 1,
      isExplicit: data.isExplicit ?? false,
      contentRating: data.contentRating ?? null,
      lyricsParsed: data.lyricsParsed,
    },
  });

  return song;
};

export const getUserSongs = async (userId: string) => {
  const songs = await prisma.song.findMany({
    where: { userId },
    orderBy: { addedAt: 'desc' },
  });
  return songs;
};

export const getSongByVideoId = async (videoId: string) => {
  const song = await prisma.song.findFirst({
    where: { youtubeVideoId: videoId },
  });
  return song;
};

export const deleteSong = async (userId: string, songId: string) => {
  // Ensure song exists and belongs to user
  const song = await prisma.song.findUnique({ where: { id: songId } });
  if (!song) throw new Error('Song not found');
  if (song.userId !== userId) throw new Error('Forbidden');

  await prisma.song.delete({ where: { id: songId } });
  return true;
};

export const updateSong = async (userId: string, songId: string, data: Partial<{
  title: string;
  artist: string;
  language: string;
  difficultyRating?: number;
  isExplicit?: boolean;
  contentRating?: string | null;
  lyricsParsed?: any;
}>) => {
  const existing = await prisma.song.findUnique({ where: { id: songId } });
  if (!existing) throw new Error('Song not found');
  if (existing.userId !== userId) throw new Error('Forbidden');

  const updated = await prisma.song.update({
    where: { id: songId },
    data: {
      title: data.title ?? existing.title,
      artist: data.artist ?? existing.artist,
      language: data.language ?? existing.language,
      difficultyRating: data.difficultyRating ?? existing.difficultyRating,
      isExplicit: data.isExplicit ?? existing.isExplicit,
      contentRating: data.contentRating ?? existing.contentRating,
      lyricsParsed: data.lyricsParsed ?? existing.lyricsParsed,
    },
  });

  return updated;
};