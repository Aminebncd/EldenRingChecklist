import { Router } from 'express';
import ChecklistItem from '../models/ChecklistItem.js';
import { itemsQuerySchema } from '../schemas/items.js';
import { auth, AuthedRequest } from '../utils/authMiddleware.js';

const r = Router();

r.get('/', async (req, res) => {
  const parse = itemsQuerySchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { category, region, q } = parse.data;
  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (region) query.region = region;
  if (q) query.title = { $regex: q, $options: 'i' };

  const items = await ChecklistItem.find(query).sort({ category: 1, region: 1, title: 1 }).lean();
  res.json(items);
});

r.post('/bulk-upsert', auth(true), async (req: AuthedRequest, res) => {
  // réservé admin – stub 501
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  res.status(501).json({ error: 'not_implemented' });
});

export default r;
