import express from 'express';
import ChecklistItem from '../models/ChecklistItem';
import { itemsQuerySchema } from '../schemas/items';
import { AuthRequest, authMiddleware } from '../utils/authMiddleware';

const router = express.Router();

router.get('/', async (req, res) => {
  const { category, region, q } = itemsQuerySchema.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (category) filter.category = category;
  if (region) filter.region = region;
  if (q) filter.title = { $regex: q, $options: 'i' };
  const items = await ChecklistItem.find(filter).sort({ category: 1, region: 1, title: 1 });
  res.json(items);
});

router.post('/bulk-upsert', authMiddleware, (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'not implemented' });
});

export default router;
