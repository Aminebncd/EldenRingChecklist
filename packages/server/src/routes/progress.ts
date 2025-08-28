import { Router } from 'express';
import { auth, AuthedRequest } from '../utils/authMiddleware.js';
import { bulkProgressSchema } from '../schemas/progress.js';
import Progress from '../models/Progress.js';

const r = Router();

r.get('/', auth(true), async (req: AuthedRequest, res) => {
  const doc = await Progress.findOne({ userId: req.user!.id });
  const map = doc?.items ? Object.fromEntries(doc.items.entries()) : {};
  res.json(map);
});

r.post('/bulk', auth(true), async (req: AuthedRequest, res) => {
  const parse = bulkProgressSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  const { updates } = parse.data;
  const doc = (await Progress.findOne({ userId: req.user!.id })) || (await Progress.create({ userId: req.user!.id }));

  for (const u of updates) {
    doc.items.set(u.slug, { status: u.status, note: u.note, updatedAt: new Date() });
  }
  await doc.save();

  const map = Object.fromEntries([...doc.items]);
  res.json(map);
});

export default r;
