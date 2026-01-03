"use strict";
// backend/src/services/song.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSong = exports.deleteSong = exports.getSongByVideoId = exports.getUserSongs = exports.createSong = void 0;
const database_1 = require("../config/database");
const createSong = async (userId, data) => {
    const song = await database_1.prisma.song.create({
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
exports.createSong = createSong;
const getUserSongs = async (userId) => {
    const songs = await database_1.prisma.song.findMany({
        where: { userId },
        orderBy: { addedAt: 'desc' },
    });
    return songs;
};
exports.getUserSongs = getUserSongs;
const getSongByVideoId = async (videoId) => {
    const song = await database_1.prisma.song.findFirst({
        where: { youtubeVideoId: videoId },
    });
    return song;
};
exports.getSongByVideoId = getSongByVideoId;
const deleteSong = async (userId, songId) => {
    // Ensure song exists and belongs to user
    const song = await database_1.prisma.song.findUnique({ where: { id: songId } });
    if (!song)
        throw new Error('Song not found');
    if (song.userId !== userId)
        throw new Error('Forbidden');
    await database_1.prisma.song.delete({ where: { id: songId } });
    return true;
};
exports.deleteSong = deleteSong;
const updateSong = async (userId, songId, data) => {
    const existing = await database_1.prisma.song.findUnique({ where: { id: songId } });
    if (!existing)
        throw new Error('Song not found');
    if (existing.userId !== userId)
        throw new Error('Forbidden');
    const updated = await database_1.prisma.song.update({
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
exports.updateSong = updateSong;
