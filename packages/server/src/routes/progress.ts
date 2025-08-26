import express from 'express';
import Progress from '../models/Progress';
import { authMiddleware, AuthRequest } from '../utils/authMiddleware';
import { progressBulkSchema } from '../schemas/progress';

const router = express.Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const progress = await Progress.findOne({ userId: req.user!.id });
  res.json(progress?.items || {});
});

router.post('/bulk', authMiddleware, async (req: AuthRequest, res) => {
  const { updates } = progressBulkSchema.parse(req.body);
  const progress = (await Progress.findOneAndUpdate(
    { userId: req.user!.id },
    { $setOnInsert: { userId: req.user!.id } },
    { new: true, upsert: true }
  )) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  updates.forEach((u) => {
    progress.items.set(u.slug, { status: u.status, note: u.note, updatedAt: new Date() });
  });
  await progress.save();
  res.json({ ok: true });
});

export default router;
