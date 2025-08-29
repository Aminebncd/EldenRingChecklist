/**
 * Simple, polite scraper for Fextralife pages to populate local assets.
 *
 * Notes:
 * - Respects robots.txt (basic implementation) and rate-limits requests.
 * - Restricts crawl to eldenring.wiki.fextralife.com and a configurable page limit.
 * - Downloads on-page images (limited to fextralife-related hosts) and saves small JSON page summaries.
 * - Intended for local archival to support offline assets like region images and short excerpts.
 *
 * Usage
 *   npx tsx scraper.ts [startUrl] [--max 40] [--out packages/web/src/assets/wiki]
 *
 * Defaults
 *   startUrl: https://eldenring.wiki.gg/
 *   max pages: 40
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

type RobotsRule = { disallow: string[] };

const START = process.argv[2] || 'https://eldenring.wiki.gg/';
const MAX = Number.parseInt(getArg('--max') || '40', 10) || 40;
const OUT = getArg('--out') || path.join('packages', 'web', 'public', 'wiki');
const IMG_INCLUDE = (getArg('--img-include') || '').split(',').map((s) => s.trim()).filter(Boolean);
const MAX_IMAGES = Number.parseInt(getArg('--max-images') || '150', 10) || 150;
const VERBOSE = hasArg('--verbose');
const SAME_HOST = new URL(START).host;
const START_ROOT = rootDomain(SAME_HOST);
const EXTRA_IMG_HOSTS = new Set<string>([
  'i.imgur.com',
  'imgur.com',
  'wp.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'static.wiki.gg',
  'images.wiki.gg',
  'media.wiki.gg',
]);
const HEADERS = { 'User-Agent': 'eldenring-checklist-scraper/0.1 (+https://localhost)' };

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(path.join(OUT, 'pages'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'images'), { recursive: true });

  const manifestPath = path.join(OUT, 'manifest.json');
  const manifest: Record<string, string> = await readJson<Record<string, string>>(manifestPath).catch(() => ({}));
  const indexPath = path.join(OUT, 'index.json');
  const indexExisting: any[] = await readJson<any[]>(indexPath).catch(() => []);
  const indexBySlug = new Map<string, any>(indexExisting.map((e) => [e.slug, e]));

  const robots = await getRobots(new URL(START));

  const q: string[] = [START];
  const seen = new Set<string>();
  let processed = 0;

  while (q.length && processed < MAX) {
    const url = q.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const u = new URL(url);
    if (u.host !== SAME_HOST) continue;
    if (!isAllowed(robots, u)) {
      console.warn('[skip robots]', u.pathname);
      continue;
    }

    try {
      if (VERBOSE) console.log(`[page] fetch → ${u.href}`);
      const t0 = Date.now();
      const html = await fetchText(u.href);
      const dt = Date.now() - t0;
      processed++;
      console.log(`[${processed}/${MAX}]`, u.pathname);
      if (VERBOSE) console.log(`[page] fetched in ${dt}ms, size ~${html.length.toLocaleString()} chars`);

      const { title, description, h1, links, images, excerpt, contentHtml, contentText, headings, infoboxHtml, categories } = extract(html, u);

      const pageSlug = urlToSlug(u);
      const localImages: Array<{ url: string; alt?: string; localPath?: string }> = [];

      // download images sequentially (polite)
      let found = 0, allowedCnt = 0, filtered = 0, downloaded = 0;
      for (const img of images) {
        found++;
        const abs = absolutize(img.url, u);
        if (!abs) continue;
        if (!allowedImageHost(abs)) continue;
        allowedCnt++;
        if (IMG_INCLUDE.length) {
          const alt = (img.alt || '').toLowerCase();
          const urlLower = abs.toLowerCase();
          if (!(includesAny(urlLower, IMG_INCLUDE) || includesAny(alt, IMG_INCLUDE))) {
            filtered++;
            continue;
          }
        }
        if (downloaded >= MAX_IMAGES) {
          if (VERBOSE) console.log(`[images] max-images ${MAX_IMAGES} reached, skipping rest`);
          break;
        }
        if (VERBOSE && (downloaded < 5 || downloaded % 10 === 0)) console.log(`[img] ${downloaded + 1} → ${abs}`);
        const local = await downloadImage(abs, u.href, pageSlug, downloaded + 1).catch((e) => {
          console.warn('[img error]', e?.message || e);
          return undefined;
        });
        if (local) {
          manifest[abs] = local;
          localImages.push({ url: abs, alt: img.alt, localPath: local });
        } else {
          localImages.push({ url: abs, alt: img.alt });
        }
        downloaded++;
        await sleep(300); // small pause between images
      }
      if (VERBOSE) console.log(`[images] found:${found} allowed:${allowedCnt} filtered:${filtered} downloaded:${downloaded}`);

      // rewrite contentHtml to local image paths
      const mapping = new Map<string, string>();
      for (const li of localImages) if (li.localPath) mapping.set(li.url, li.localPath);
      let contentHtmlLocal = contentHtml ? rewriteContentHtml(contentHtml, u, mapping) : undefined;
      if (VERBOSE && contentHtml && contentHtmlLocal && contentHtmlLocal !== contentHtml) {
        console.log('[rewrite] contentHtml images rewritten');
      }

      const pageType = classifyPage({ categories, title, path: u.pathname });
      const primaryImage = localImages.find((x) => !!x.localPath)?.localPath;
      const meta = { slug: pageSlug, url: u.href, title, pageType, categories, primaryImage };
      indexBySlug.set(pageSlug, meta);

      await savePage(u, {
        url: u.href,
        slug: pageSlug,
        title,
        description,
        h1,
        excerpt,
        contentHtml,
        contentHtmlLocal,
        contentText,
        headings,
        infoboxHtml,
        categories,
        pageType,
        images: localImages,
      });

      // enqueue more links (same host only)
      let added = 0;
      for (const href of links) {
        const abs = absolutize(href, u);
        if (!abs) continue;
        const h = safeParseURL(abs);
        if (!h) continue;
        if (h.host === SAME_HOST && !seen.has(h.href) && isWikiPathAllowed(h)) { q.push(h.href); added++; }
      }
      if (VERBOSE) console.log(`[links] enqueued: ${added}, queue: ${q.length}`);
    } catch (e: any) {
      console.error('[error]', url, e?.message || e);
    }

    // polite global pacing
    await sleep(1200);
  }

  console.log('[done]', { processed, out: OUT });
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  const list = Array.from(indexBySlug.values()).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  await fs.writeFile(indexPath, JSON.stringify(list, null, 2), 'utf8');
  const byType: Record<string, any[]> = {};
  for (const e of list) {
    const t = e.pageType || 'other';
    (byType[t] ||= []).push(e);
  }
  await fs.writeFile(path.join(OUT, 'by-type.json'), JSON.stringify(byType, null, 2), 'utf8');
}

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  if (i >= 0) return process.argv[i + 1];
  return undefined;
}

function hasArg(name: string): boolean {
  return process.argv.includes(name);
}

async function fetchText(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, { headers: HEADERS }, 20000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/html')) {
    throw new Error(`unexpected content-type: ${ct}`);
  }
  return await res.text();
}

async function getRobots(base: URL): Promise<RobotsRule> {
  try {
    const url = `${base.protocol}//${base.host}/robots.txt`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return { disallow: [] };
    const txt = await res.text();
    const lines = txt.split(/\r?\n/).map((l) => l.trim());
    const disallow: string[] = [];
    let inStar = false;
    for (const l of lines) {
      if (!l || l.startsWith('#')) continue;
      const [k0, v0] = l.split(':', 2);
      const k = (k0 || '').trim().toLowerCase();
      const v = (v0 || '').trim();
      if (k === 'user-agent') {
        inStar = v === '*';
      } else if (k === 'disallow' && inStar) {
        if (v) disallow.push(v);
      } else if (k === 'allow' && inStar) {
        // ignore allow for simplicity
      }
    }
    return { disallow };
  } catch {
    return { disallow: [] };
  }
}

function isAllowed(robots: RobotsRule, u: URL): boolean {
  const p = u.pathname;
  return !robots.disallow.some((rule) => p.startsWith(rule));
}

function safeParseURL(s: string): URL | null {
  try {
    const u = new URL(s);
    if (!u.host) return null;
    return u;
  } catch {
    return null;
  }
}

function isWikiPathAllowed(u: URL): boolean {
  const p = decodeURIComponentSafe(u.pathname);
  // common mediawiki namespaces to skip
  const banned = ['File:', 'Fichier:', 'Special:', 'User:', 'Talk:', 'Template:', 'Module:', 'Help:', 'Project:', 'Media:', 'MediaWiki:'];
  const last = p.split('/').pop() || '';
  for (const b of banned) if (last.startsWith(b)) return false;
  return true;
}

function match1(s: string, re: RegExp): string | undefined {
  const m = re.exec(s);
  return m ? m[1] : undefined;
}

function extract(html: string, base: URL): {
  title: string;
  description?: string;
  h1?: string;
  links: string[];
  images: Array<{ url: string; alt?: string }>;
  excerpt?: string;
  contentHtml?: string;
  contentText?: string;
  headings?: Array<{ level: number; text: string }>;
  infoboxHtml?: string;
  categories: string[];
} {
  const title = match1(html, /<title[^>]*>([^<]+)<\/title>/i) || base.href;
  const description = match1(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  const h1 = match1(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)?.replace(/<[^>]+>/g, '').trim();

  const links = Array.from(html.matchAll(/<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>/gi)).map((m) => m[1]);
  const images = gatherImages(html);

  let excerpt: string | undefined;
  const mainBlock = match1(html, /<div[^>]+id=["']mw-content-text["'][^>]*>([\s\S]*?)<\/div>/i) ||
    match1(html, /<div[^>]+class=["'][^"']*mw-parser-output[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    match1(html, /<div[^>]+id=["']wiki-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i) ||
    match1(html, /<article[^>]*>([\s\S]*?)<\/article>/i) ||
    match1(html, /<div[^>]+class=["'][^"']*wiki[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const contentHtml = mainBlock ? sanitizeHtml(mainBlock) : undefined;
  if (mainBlock) {
    const text = stripHtml(mainBlock).replace(/\s+/g, ' ').trim();
    excerpt = text.slice(0, 600);
  }

  const contentText = contentHtml ? stripHtml(contentHtml) : undefined;
  const headings = collectHeadings(contentHtml || '');
  const infoboxHtml =
    match1(html, /<aside[^>]+class=["'][^"']*portable-infobox[^"']*["'][^>]*>[\s\S]*?<\/aside>/i) ||
    match1(html, /<table[^>]+class=["'][^"']*(?:infobox|wiki_table)[^"']*["'][^>]*>[\s\S]*?<\/table>/i) ||
    undefined;

  const categories = collectCategories(html);

  return { title: decodeHtml(title), description: description ? decodeHtml(description) : undefined, h1, links, images, excerpt, contentHtml, contentText, headings, infoboxHtml, categories };
}

function gatherImages(html: string): Array<{ url: string; alt?: string }> {
  const urls = new Set<string>();
  const altMap = new Map<string, string | undefined>();

  // process complete <img ...> tags to capture alt and best source
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const alt = getAttr(tag, 'alt');
    const src = getAttr(tag, 'src') || getAttr(tag, 'data-src') || getAttr(tag, 'data-original') || getAttr(tag, 'data-cfsrc');
    const srcset = getAttr(tag, 'srcset') || getAttr(tag, 'data-srcset');
    const best = src || (srcset ? pickBestFromSrcset(srcset) : null);
    if (best) {
      urls.add(best);
      if (!altMap.has(best)) altMap.set(best, alt || undefined);
    }
  }

  // og:image
  for (const m of html.matchAll(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi)) urls.add(m[1]);
  // link preload/image_src
  for (const m of html.matchAll(/<link[^>]+rel=["'](?:image_src|preload)["'][^>]+href=["']([^"']+)["'][^>]*>/gi)) urls.add(m[1]);
  // style url(...)
  for (const m of html.matchAll(/url\((['\"]?)([^'\")]+)\1\)/gi)) urls.add(m[2]);
  
  return Array.from(urls).map((u) => ({ url: u, alt: altMap.get(u) }));
}

function getAttr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*['\"]([^'\"]+)['\"]`, 'i');
  const m = re.exec(tag);
  return m ? m[1] : null;
}

function setAttr(tag: string, name: string, value: string): string {
  const has = new RegExp(`${name}\\s*=`, 'i').test(tag);
  if (has) {
    const re = new RegExp(`(${name}\\s*=\\s*['\"])('[^']*'|"[^"]*"|[^>\s]+)`, 'i');
    // safer replace: match name=... quoted
    return tag.replace(new RegExp(`${name}\\s*=\\s*(['\"])([^'\"]*)(['\"])`, 'i'), `${name}="$${1 ? '' : ''}${value}"`)
      .replace(new RegExp(`${name}\\s*=\\s*([^'\"][^\s>]*)`, 'i'), `${name}="${value}"`);
  } else {
    return tag.replace(/<img\b/i, `<img ${name}="${value}"`);
  }
}

function removeAttr(tag: string, name: string): string {
  return tag
    .replace(new RegExp(`\\s${name}\\s*=\\s*"[^"]*"`, 'ig'), '')
    .replace(new RegExp(`\\s${name}\\s*=\\s*'[^']*'`, 'ig'), '')
    .replace(new RegExp(`\\s${name}\\s*=\\s*[^\s>]+`, 'ig'), '');
}

// safer attribute setter that handles quoted/unquoted/absent attributes generically
function setAttrSafe(tag: string, name: string, value: string): string {
  const esc = String(value).replace(/\"/g, '&quot;');
  let out = tag;
  const reQuoted = new RegExp(`(${name}\\s*=\\s*[\"'])([^\"']*)([\"'])`, 'i');
  if (reQuoted.test(out)) return out.replace(reQuoted, `$1${esc}$3`);
  const reUnquoted = new RegExp(`(${name}\\s*=\\s*)([^\s>]+)`, 'i');
  if (reUnquoted.test(out)) return out.replace(reUnquoted, `$1\"${esc}\"`);
  return out.replace(/<([a-z0-9-]+)\b/i, (m) => `${m} ${name}="${esc}"`);
}

function pickBestFromSrcset(srcset: string): string | null {
  try {
    const parts = srcset.split(',').map((s) => s.trim()).filter(Boolean);
    let best: { url: string; score: number } | null = null;
    for (const p of parts) {
      const [url, d] = p.split(/\s+/);
      const score = parseFloat((d || '').replace(/[^0-9.]/g, '')) || 0;
      if (!best || score > best.score) best = { url, score };
    }
    return best?.url || null;
  } catch {
    return null;
  }
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function absolutize(href: string, base: URL): string | null {
  try {
    if (!href) return null;
    const low = href.toLowerCase();
    if (low.startsWith('javascript:') || low.startsWith('mailto:') || low.startsWith('tel:')) return null;
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    if (href.startsWith('//')) return `${base.protocol}${href}`;
    if (href.startsWith('/')) return `${base.protocol}//${base.host}${href}`;
    const abs = new URL(href, base.href).href;
    // validate
    const u = safeParseURL(abs);
    return u ? u.href : null;
  } catch {
    return null;
  }
}

function allowedImageHost(url: string): boolean {
  try {
    const u = safeParseURL(url);
    if (!u) return false;
    const h = u.host;
    if (h === SAME_HOST) return true;
    const root = rootDomain(h);
    if (root === START_ROOT) return true;
    for (const d of EXTRA_IMG_HOSTS) if (h.endsWith(d)) return true;
    return false;
  } catch {
    return false;
  }
}

async function savePage(u: URL, data: Record<string, unknown>) {
  const slug = urlToSlug(u);
  const file = path.join(OUT, 'pages', `${slug}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

function urlToSlug(u: URL): string {
  const raw = (u.pathname || '/').replace(/\/+$/, '').replace(/^\/+/, '') || 'home';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function rootDomain(host: string): string {
  const parts = (host || '').split('.').filter(Boolean);
  if (parts.length <= 2) return host.toLowerCase();
  return parts.slice(-2).join('.').toLowerCase();
}

async function downloadImage(url: string, referer: string | undefined, pageSlug: string, index: number) {
  const headers = { ...HEADERS } as Record<string, string>;
  if (referer) headers['Referer'] = referer;
  headers['Accept'] = 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8';
  const res = await fetchWithTimeout(url, { headers }, 20000);
  if (!res.ok) return;
  const ct = res.headers.get('content-type') || '';
  if (!ct.startsWith('image/')) return;
  const ext = contentTypeToExt(ct) || path.extname(new URL(url).pathname) || '.img';
  const dir = path.join(OUT, 'images', pageSlug);
  await fs.mkdir(dir, { recursive: true });
  let base = deriveImageBaseName(url, pageSlug);
  if (!base) base = index <= 1 ? pageSlug : `${pageSlug}-${index}`;
  let name = base;
  let out = path.join(dir, `${name}${ext}`);
  // ensure uniqueness within page folder
  let n = 2;
  while (await exists(out)) {
    name = `${base}-${n}`;
    out = path.join(dir, `${name}${ext}`);
    n++;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(out, buf);
  // return relative path from OUT
  const rel = path.join('images', pageSlug, `${name}${ext}`).replace(/\\/g, '/');
  return rel;
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function contentTypeToExt(ct: string): string | null {
  if (ct.includes('jpeg')) return '.jpg';
  if (ct.includes('png')) return '.png';
  if (ct.includes('gif')) return '.gif';
  if (ct.includes('webp')) return '.webp';
  if (ct.includes('svg')) return '.svg';
  return null;
}

function includesAny(s: string, needles: string[]): boolean {
  return needles.some((n) => s.includes(n));
}

function deriveImageBaseName(rawUrl: string, pageSlug: string): string {
  try {
    const u = new URL(rawUrl);
    const file = decodeURIComponentSafe(u.pathname.split('/').pop() || '') || 'img';
    let base = file.replace(/\.[^.]+$/, '');
    // strip size suffixes
    base = base.replace(/(?:[_-](?:\d{2,4}px|\d+x\d+))$/i, '');
    base = base.replace(/@\d+x$/i, '');
    // tokens
    const tokens = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const pageTokens = pageSlug.split(/[^a-z0-9]+/).filter(Boolean);
    const stop = new Set<string>([
      'elden','ring','eldenring','shadow','of','the','erdtree','dlc','wiki','guide','file','image','images','icon','icons','thumb','thumbnail',
      'weapons','weapon','armor','armors','classes','class','skills','skill','incantations','incantation','sorceries','sorcery','shields','shield','helms','helm','boss','map','maps'
    ]);
    const picked = tokens.filter((t) => !stop.has(t) && !pageTokens.includes(t) && /[a-z]/.test(t) && t.length >= 2);
    let name = picked.slice(0, 4).join('_');
    if (!name) name = tokens.find((t) => /[a-z]/.test(t)) || '';
    name = sanitizeFileName(name).replace(/^-+|-+$/g, '');
    // final guard
    if (!name || name.length < 2) return '';
    // cap length
    if (name.length > 80) name = name.slice(0, 80);
    return name;
  } catch {
    return '';
  }
}

function sanitizeFileName(s: string): string {
  const x = decodeURIComponentSafe(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return x || 'img';
}

function decodeURIComponentSafe(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

function stripHtml(s: string): string {
  return s.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
}

function sanitizeHtml(s: string): string {
  // remove scripts/styles/noscript and on* handlers
  let out = s.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  return out;
}

function collectHeadings(html: string): Array<{ level: number; text: string }> {
  const res: Array<{ level: number; text: string }> = [];
  for (const m of html.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const level = parseInt(m[1], 10);
    const text = stripHtml(m[2]).replace(/\s+/g, ' ').trim();
    if (text) res.push({ level, text });
  }
  return res;
}

function collectCategories(html: string): string[] {
  const cats = new Set<string>();
  // MediaWiki catlinks block
  const block = match1(html, /<div[^>]+id=["']catlinks["'][^>]*>([\s\S]*?)<\/div>/i);
  if (block) {
    for (const m of block.matchAll(/<a[^>]+href=["'][^"']*\/(?:Category|Cat\:)[^"']*["'][^>]*>([^<]+)<\/a>/gi)) {
      const t = stripHtml(m[1]).trim();
      if (t) cats.add(t);
    }
    for (const m of block.matchAll(/<a[^>]*>([^<]+)<\/a>/gi)) {
      const t = stripHtml(m[1]).trim();
      if (t) cats.add(t);
    }
  }
  // meta keywords fallback
  const kw = match1(html, /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["'][^>]*>/i);
  if (kw) kw.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => cats.add(s));
  return Array.from(cats);
}

function classifyPage(input: { categories: string[]; title: string; path: string }): string {
  const { categories, title, path } = input;
  const text = `${categories.join(' ').toLowerCase()} ${title.toLowerCase()} ${decodeURIComponentSafe(path).toLowerCase()}`;
  const has = (...words: string[]) => words.some((w) => text.includes(w));
  if (has('boss', 'bosses')) return 'boss';
  if (has('weapons', 'weapon')) return 'weapon';
  if (has('armor', 'armors', 'helm', 'chest armor', 'gauntlets', 'greaves')) return 'armor';
  if (has('shield', 'shields')) return 'shield';
  if (has('talisman', 'talismans')) return 'talisman';
  if (has('spirit ash', 'spirit ashes')) return 'spirit-ash';
  if (has('sorcery', 'sorceries')) return 'sorcery';
  if (has('incantation', 'incantations')) return 'incantation';
  if (has('site of grace', 'grace')) return 'site-of-grace';
  if (has('region', 'regions')) return 'region';
  if (has('location', 'locations', 'area', 'areas')) return 'location';
  if (has('npc')) return 'npc';
  return 'other';
}

async function readJson<T>(file: string): Promise<T> {
  const buf = await fs.readFile(file, 'utf8');
  return JSON.parse(buf) as T;
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

function rewriteContentHtml(html: string, base: URL, map: Map<string, string>): string {
  // replace <img ...> tags
  html = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const candidates: Array<string> = [];
    const src = getAttr(tag, 'src');
    const dataSrc = getAttr(tag, 'data-src') || getAttr(tag, 'data-original') || getAttr(tag, 'data-cfsrc');
    const srcset = getAttr(tag, 'srcset') || getAttr(tag, 'data-srcset');
    if (src) candidates.push(src);
    if (dataSrc) candidates.push(dataSrc);
    if (srcset) {
      for (const p of srcset.split(',').map((s) => s.trim())) {
        const u = p.split(/\s+/)[0];
        if (u) candidates.push(u);
      }
    }
    for (const c of candidates) {
      const abs = absolutize(c, base);
      if (!abs) continue;
      const local = map.get(abs);
      if (local) {
        let out = setAttrSafe(tag, 'src', local);
        out = removeAttr(out, 'srcset');
        out = removeAttr(out, 'data-src');
        out = removeAttr(out, 'data-srcset');
        out = removeAttr(out, 'data-original');
        out = removeAttr(out, 'data-cfsrc');
        return out;
      }
    }
    return tag;
  });

  // rewrite inline style url(...)
  html = html.replace(/(<[^>]+?\sstyle\s*=\s*)(["'])([\s\S]*?)(\2)/gi, (m, prefix: string, q: string, styleVal: string) => {
    const newStyle = styleVal.replace(/url\(\s*(['\"]?)([^'\")]+)\1\s*\)/gi, (_m2, _q2: string, u: string) => {
      const abs = absolutize(u, base);
      const local = abs ? map.get(abs) : undefined;
      return local ? `url(${local})` : _m2;
    });
    return `${prefix}${q}${newStyle}${q}`;
  });

  // rewrite <link rel="image_src|preload" href="...">
  html = html.replace(/<link\b[^>]*rel=["'](?:image_src|preload)["'][^>]*>/gi, (tag) => {
    const href = getAttr(tag, 'href');
    const abs = href ? absolutize(href, base) : null;
    const local = abs ? map.get(abs) : undefined;
    return local ? setAttrSafe(tag, 'href', local) : tag;
  });

  // rewrite <meta property="og:image[:secure_url]" content="...">
  html = html.replace(/<meta\b[^>]*property=["']og:image(?::secure_url)?["'][^>]*>/gi, (tag) => {
    const content = getAttr(tag, 'content');
    const abs = content ? absolutize(content, base) : null;
    const local = abs ? map.get(abs) : undefined;
    return local ? setAttrSafe(tag, 'content', local) : tag;
  });

  // replace <source srcset> inside picture if possible
  html = html.replace(/<source\b[^>]*srcset=["']([^"']+)["'][^>]*>/gi, (tag, srcset: string) => {
    const parts = srcset.split(',').map((s) => s.trim());
    for (const p of parts) {
      const u = p.split(/\s+/)[0];
      const abs = absolutize(u, base);
      if (abs && map.get(abs)) {
        // if any local match exists, simplify: remove srcset source
        return '';
      }
    }
    return tag;
  });

  return html;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
