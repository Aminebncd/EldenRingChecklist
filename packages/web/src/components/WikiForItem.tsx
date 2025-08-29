/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import WikiEmbed from './WikiEmbed';

type WikiIndexEntry = {
  slug: string;
  title?: string;
  pageType?: string;
  primaryImage?: string;
};

function normalize(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function bestWikiSlugForItem(item: any, idx: WikiIndexEntry[]): string | null {
  const title = String(item?.title || '');
  const cat = String(item?.category || '');
  const normTitle = normalize(title);

  // Try to extract a core name after separators (e.g., "Talisman — Sceau rituel")
  const core = normalize(title.split('—').pop() || title.split('-').pop() || title);

  // Prefer matches within same type if possible
  const typeMap: Record<string, string[]> = {
    // French → wiki pageType keywords
    'boss': ['boss'],
    'talisman': ['talisman'],
    'arme': ['weapon'],
    'armes': ['weapon'],
    'bouclier': ['shield'],
    'armure': ['armor'],
    'grâce': ['site-of-grace'],
    'graces': ['site-of-grace'],
    'grace': ['site-of-grace'],
    'sort': ['sorcery', 'incantation'],
    'sorts': ['sorcery', 'incantation'],
    'incantation': ['incantation'],
    'magie': ['sorcery', 'incantation'],
  };

  const targetTypes = Object.entries(typeMap)
    .filter(([k]) => normalize(cat).includes(normalize(k)))
    .flatMap(([, v]) => v);

  // Scoring: exact/startsWith/contains (on normTitle & core)
  const scoreEntry = (e: WikiIndexEntry): number => {
    const t = normalize(e.title || '');
    let s = 0;
    if (targetTypes.length && targetTypes.includes(String(e.pageType || ''))) s += 50;
    if (t === normTitle) s += 100;
    if (t.startsWith(normTitle)) s += 60;
    if (t.includes(normTitle)) s += 40;
    if (core && t === core) s += 80;
    if (core && t.startsWith(core)) s += 50;
    if (core && t.includes(core)) s += 30;
    // Bonus if title shares a unique token with item title
    const tokens = new Set(t.split(' ').filter(Boolean));
    for (const w of normTitle.split(' ').filter(Boolean)) {
      if (tokens.has(w)) { s += 3; }
    }
    return s;
  };

  let best: { slug: string; score: number } | null = null;
  for (const e of idx) {
    const sc = scoreEntry(e);
    if (sc <= 0) continue;
    if (!best || sc > best.score) best = { slug: e.slug, score: sc };
  }

  // Fallback: category landing pages (ensure something shows)
  if (!best) {
    const byTitleFallback: Array<[string, string[]]> = [
      ['boss', ['bosses', 'wiki-bosses']],
      ['talisman', ['items', 'inventory', 'wiki-items', 'wiki-inventory']],
      ['arme', ['weapons', 'wiki-weapons']],
      ['armes', ['weapons', 'wiki-weapons']],
      ['bouclier', ['shields', 'wiki-weapons']],
      ['armure', ['armor', 'wiki-armor']],
      ['grâce', ['grace', 'sites-of-grace', 'wiki-grace']],
      ['sort', ['spells', 'sorceries', 'incantations', 'wiki-spells']],
      ['sorts', ['spells', 'sorceries', 'incantations', 'wiki-spells']],
    ];
    const catN = normalize(cat);
    for (const [k, slugs] of byTitleFallback) {
      if (catN.includes(normalize(k))) {
        for (const s of slugs) {
          const hit = idx.find((e) => e.slug === s || normalize(e.title || '').includes(normalize(s)));
          if (hit) return hit.slug;
        }
      }
    }
  }

  return best?.slug || null;
}

export default function WikiForItem({ item }: { item: any }) {
  const [index, setIndex] = useState<WikiIndexEntry[] | null>(null);
  const [indexError, setIndexError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIndexError(null);
    setIndex(null);
    (async () => {
      try {
        // Try public assets first
        const r = await fetch('/wiki/index.json', { headers: { Accept: 'application/json' } });
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!r.ok || !ct.includes('json')) throw new Error(`HTTP ${r.status}`);
        const data = (await r.json()) as WikiIndexEntry[];
        if (!cancelled) setIndex(data);
      } catch (e: any) {
        // Fallback to local bundled assets under src/assets/wiki/pages
        try {
          const local = await buildLocalIndex();
          if (!cancelled) setIndex(local);
        } catch (e2: any) {
          if (!cancelled) setIndexError(`assets wiki indisponibles (${e2?.message || e?.message || 'erreur'})`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const pick = useMemo(() => {
    if (!index || !item) return null;
    return bestWikiSlugForItem(item, index);
  }, [index, item]);

  if (indexError) {
    return (
      <div className="mt-4 p-3 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-400 text-sm">
        {indexError}
      </div>
    );
  }

  if (!index) return <div className="text-zinc-400 text-sm mt-3">chargement des assets wiki…</div>;
  if (!pick) return <div className="text-zinc-500 text-sm mt-3">pas de correspondance wiki trouvée</div>;

  return (
    <div className="mt-4">
      <WikiEmbed slug={pick} />
    </div>
  );
}

async function buildLocalIndex(): Promise<WikiIndexEntry[]> {
  // Import all local wiki pages (bundled JSON) eagerly
  const modules = import.meta.glob('../assets/wiki/pages/*.json', { eager: true }) as Record<string, any>;
  const list: WikiIndexEntry[] = [];
  for (const [p, mod] of Object.entries(modules)) {
    const data = (mod && (mod.default || mod)) as any;
    const slugFromFile = p.split('/').pop()?.replace(/\.json$/, '') || '';
    const slug = String(data?.slug || slugFromFile);
    const title = String(data?.title || slug);
    const pageType = classifyLocal(title, slug);
    list.push({ slug, title, pageType });
  }
  return list;
}

function classifyLocal(title: string, slug: string): string {
  const t = `${normalize(title)} ${normalize(slug)}`;
  const has = (...w: string[]) => w.some((x) => t.includes(normalize(x)));
  if (has('boss', 'bosses')) return 'boss';
  if (has('weapon', 'weapons', 'arme', 'armes')) return 'weapon';
  if (has('armor', 'armure', 'helm', 'gauntlets', 'greaves', 'chest-armor')) return 'armor';
  if (has('shield', 'bouclier')) return 'shield';
  if (has('talisman')) return 'talisman';
  if (has('spells', 'sorcery', 'sorceries')) return 'sorcery';
  if (has('incantation', 'incantations')) return 'incantation';
  if (has('grace', 'site-of-grace', 'sites-of-grace', 'grâce')) return 'site-of-grace';
  if (has('region', 'limgrave', 'liurnia', 'caelid', 'altus')) return 'region';
  if (has('location', 'locations')) return 'location';
  if (has('npc')) return 'npc';
  return 'other';
}
