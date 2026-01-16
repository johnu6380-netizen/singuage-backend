import { Router } from 'express';
import { getDiscover } from '../controllers/discover.controller';

const router = Router();

// GET /api/discover
router.get('/', getDiscover);

export default router;
