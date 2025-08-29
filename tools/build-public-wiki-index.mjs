import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const WIKI_DIR = path.join(ROOT, 'packages', 'web', 'public', 'wiki');
const PAGES_DIR = path.join(WIKI_DIR, 'pages');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function classifyLocal(title, slug) {
  const t = `${normalize(title)} ${normalize(slug)}`;
  const has = (...w) => w.some((x) => t.includes(normalize(x)));
  if (has('boss', 'bosses')) return 'boss';
  if (has('weapon', 'weapons', 'arme', 'armes')) return 'weapon';
  if (has('armor', 'armure', 'helm', 'gauntlets', 'greaves', 'chest-armor')) return 'armor';
  if (has('shield', 'bouclier')) return 'shield';
  if (has('talisman')) return 'talisman';
  if (has('spells', 'sorcery', 'sorceries')) return 'sorcery';
  if (has('incantation', 'incantations')) return 'incantation';
  if (has('grace', 'site-of-grace', 'sites-of-grace', 'gr3ce')) return 'site-of-grace';
  if (has('region', 'limgrave', 'liurnia', 'caelid', 'altus')) return 'region';
  if (has('location', 'locations')) return 'location';
  if (has('npc')) return 'npc';
  return 'other';
}

async function main() {
  const exists = async (p) => !!(await fs.stat(p).catch(() => null));
  if (!(await exists(PAGES_DIR))) {
    console.error('pages directory not found:', PAGES_DIR);
    process.exit(1);
  }

  const files = (await fs.readdir(PAGES_DIR)).filter((f) => f.toLowerCase().endsWith('.json'));
  const list = [];
  for (const f of files) {
    const p = path.join(PAGES_DIR, f);
    try {
      const buf = await fs.readFile(p, 'utf8');
      const data = JSON.parse(buf);
      const slug = String(data.slug || f.replace(/\.json$/i, ''));
      const title = String(data.title || slug);
      const pageType = String(data.pageType || classifyLocal(title, slug));
      let primaryImage = undefined;
      if (Array.isArray(data.images)) {
        const hit = data.images.find((x) => x && typeof x === 'object' && x.localPath);
        if (hit && hit.localPath) primaryImage = String(hit.localPath);
      }
      list.push({ slug, title, pageType, primaryImage });
    } catch (e) {
      console.warn('[skip]', f, e?.message || e);
    }
  }

  list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  const indexPath = path.join(WIKI_DIR, 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(list, null, 2), 'utf8');

  const byType = {};
  for (const e of list) {
    const t = e.pageType || 'other';
    (byType[t] ||= []).push(e);
  }
  const byTypePath = path.join(WIKI_DIR, 'by-type.json');
  await fs.writeFile(byTypePath, JSON.stringify(byType, null, 2), 'utf8');

  console.log('Wrote:', path.relative(ROOT, indexPath), 'and', path.relative(ROOT, byTypePath));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

