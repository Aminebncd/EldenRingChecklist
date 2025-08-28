import { Router } from 'express';
import ChecklistItem from '../models/ChecklistItem.js';
import { itemsQuerySchema, bulkUpsertSchema } from '../schemas/items.js';
import { auth, AuthedRequest } from '../utils/authMiddleware.js';
import slugifyUnique from '../utils/slug.js';

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
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const parsed = bulkUpsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const input = parsed.data;
  const usedSlugs = new Set<string>();

  const upserted: Array<{ slug: string; created: boolean }> = [];

  for (const entry of input) {
    const baseSlug = toBaseSlug(entry.title);

    // reuse base slug if an item already exists for idempotency
    const existsInDb = await ChecklistItem.exists({ slug: baseSlug });
    const exists = async (s: string) => usedSlugs.has(s) || (await ChecklistItem.exists({ slug: s })) != null;

    const slug = existsInDb ? baseSlug : await slugifyUnique(entry.title, exists);
    usedSlugs.add(slug);

    const toSet: Record<string, unknown> = {
      slug,
      title: entry.title,
    };
    if (entry.category !== undefined) toSet.category = entry.category;
    if (entry.subcategory !== undefined) toSet.subcategory = entry.subcategory;
    if (entry.region !== undefined) toSet.region = entry.region;
    if (entry.tags !== undefined) toSet.tags = entry.tags;
    if (entry.prerequisites !== undefined) toSet.prerequisites = entry.prerequisites;
    if (entry.weight !== undefined) toSet.weight = entry.weight;
    if (entry.isUnique !== undefined) toSet.isUnique = entry.isUnique;
    if (entry.mapRef !== undefined) toSet.mapRef = entry.mapRef;
    if (entry.notes !== undefined) toSet.notes = entry.notes;

    const result = await ChecklistItem.updateOne(
      { slug },
      { $set: toSet },
      { upsert: true }
    );

    const created = (result as any).upsertedCount > 0 || (result as any).upsertedId != null;
    upserted.push({ slug, created });
  }

  res.json({ count: upserted.filter((u) => u.created).length, upserted });
});

function toBaseSlug(input: string): string {
  const s = (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length ? s : 'item';
}

export default r;
