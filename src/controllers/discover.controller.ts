import { Request, Response } from 'express';
import { getDiscoverVideos } from '../services/discover.service';

export const getDiscover = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const limit = req.query.limit ? Number(req.query.limit) || 24 : 24;
    const userId = (req as any).user?.id as string | undefined;

    const videos = await getDiscoverVideos({ userId, query: q, limit });
    res.json({ videos });
  } catch (error) {
    console.error('discover.controller.getDiscover error:', error);
    res.status(500).json({ videos: [] });
  }
};
