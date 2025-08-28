import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import ChecklistItem from '../src/models/ChecklistItem.js';
import slugifyUnique from '../src/utils/slug.js';
import { env } from '../src/config/env.js';

type InputItem = {
  title: string;
  slug?: string;
  expansion?: 'base' | 'sote';
  category?: string;
  subcategory?: string;
  region?: string;
  tags?: string[];
  prerequisites?: string[];
  weight?: number;
  isUnique?: boolean;
  notes?: string;
};

async function main() {
  const arg = process.argv[2];
  const candidates = [
    arg && path.isAbsolute(arg) ? arg : arg ? path.resolve(process.cwd(), arg) : '',
    path.resolve(process.cwd(), 'checklist_seed.csv'),
    path.resolve(process.cwd(), '../../checklist_seed.csv')
  ].filter(Boolean) as string[];

  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) {
    console.error('[import] file not found. pass a path or place checklist_seed.csv at repo root.');
    process.exit(1);
  }

  console.log('[import] reading', file);
  // support both cjs/esm builds of xlsx
  const x: any = XLSX as any;
  const wb = typeof x.readFile === 'function'
    ? x.readFile(file)
    : x.read(fs.readFileSync(file), { type: 'buffer' });

  const rows: InputItem[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    for (const raw of json) {
      const n = normalizeKeys(raw);
      const it = normalizeItem(n as any);
      // fallback from sheet name if expansion absent
      if (!it.expansion) it.expansion = inferExpansion(name);
      if (it.title) rows.push(it);
    }
  }

  await mongoose.connect(env.MONGODB_URI);

  const used = new Set<string>();
  let created = 0;
  let updated = 0;

  for (const entry of rows) {
    const preferred = (entry.slug || toBaseSlug(entry.title)).toLowerCase();
    const existsInDb = await ChecklistItem.exists({ slug: preferred });
    const exists = async (s: string) => used.has(s) || (await ChecklistItem.exists({ slug: s })) != null;

    let slug = preferred;
    if (!existsInDb && used.has(slug)) {
      let i = 2;
      while (await exists(`${slug}-${i}`)) i++;
      slug = `${slug}-${i}`;
    } else if (!existsInDb && !entry.slug) {
      slug = await slugifyUnique(entry.title, exists);
    }
    used.add(slug);

    const $set: Record<string, unknown> = {
      slug,
      title: entry.title,
    };
    if (entry.expansion !== undefined) $set.expansion = entry.expansion;
    if (entry.category !== undefined) $set.category = entry.category;
    if (entry.subcategory !== undefined) $set.subcategory = entry.subcategory;
    if (entry.region !== undefined) $set.region = entry.region;
    if (entry.tags !== undefined) $set.tags = entry.tags;
    if (entry.prerequisites !== undefined) $set.prerequisites = entry.prerequisites;
    if (entry.weight !== undefined) $set.weight = entry.weight;
    if (entry.isUnique !== undefined) $set.isUnique = entry.isUnique;
    if (entry.notes !== undefined) $set.notes = entry.notes;

    const res = await ChecklistItem.updateOne({ slug }, { $set }, { upsert: true });
    const wasCreated = (res as any).upsertedCount > 0 || (res as any).upsertedId != null;
    wasCreated ? created++ : updated++;
  }

  console.log('[import] done', { total: rows.length, created, updated });
  await mongoose.disconnect();
}

function normalizeKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.trim().toLowerCase();
    switch (key) {
      case 'title':
      case 'slug':
      case 'expansion':
      case 'category':
      case 'subcategory':
      case 'region':
      case 'tags':
      case 'prerequisites':
      case 'weight':
      case 'notes':
      case 'isunique':
        out[key === 'isunique' ? 'isUnique' : key] = v;
        break;
      case '_sheet': {
        const s = String(v || '').toLowerCase();
        const exp = s.includes('shadow') || s.includes('sote') || s.includes('dlc') ? 'sote' : s.includes('base') ? 'base' : undefined;
        if (exp) out['expansion'] = exp;
        break;
      }
      default:
        break;
    }
  }
  return out;
}

function normalizeItem(r: InputItem): InputItem {
  return {
    title: String(r.title || '').trim(),
    slug: emptyToUndef(r.slug),
    expansion: (r.expansion as any) || undefined,
    category: emptyToUndef(r.category),
    subcategory: emptyToUndef(r.subcategory),
    region: emptyToUndef(r.region),
    tags: arrify(r.tags),
    prerequisites: arrify(r.prerequisites),
    weight: numOr((r as any).weight, 1),
    isUnique: r.isUnique,
    notes: emptyToUndef(r.notes),
  };
}

function arrify(v: unknown): string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  const s = String(v).trim();
  if (!s) return undefined;
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}

function numOr(v: unknown, def: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function emptyToUndef(v: unknown): string | undefined {
  if (v == null) return undefined;
  const raw = String(v).trim();
  const s = trimQuotes(raw).trim();
  return s ? s : undefined;
}

function trimQuotes(s: string): string {
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) return s.slice(1, -1);
  return s;
}

function inferExpansion(sheetName: string): 'base' | 'sote' {
  const n = sheetName.toLowerCase();
  if (n.includes('shadow') || n.includes('sote') || n.includes('dlc')) return 'sote';
  return 'base';
}

function toBaseSlug(input: string): string {
  const s = (input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s.length ? s : 'item';
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
