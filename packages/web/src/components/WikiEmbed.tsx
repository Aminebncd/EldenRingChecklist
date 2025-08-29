/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';

export default function WikiEmbed({ slug }: { slug: string }) {
  const [page, setPage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferRemote, setPreferRemote] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPage(null);
    if (!slug) return;
    (async () => {
      // Try public asset first
      try {
        const r = await fetch(`/wiki/pages/${slug}.json`, { headers: { Accept: 'application/json' } });
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!r.ok || !ct.includes('json')) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!cancelled) { setPage(data); setPreferRemote(false); }
        return;
      } catch (e) {
        // Fallback to local bundled JSON under src/assets/wiki/pages
        try {
          const localModules = import.meta.glob('../assets/wiki/pages/*.json');
          const key = `../assets/wiki/pages/${slug}.json`;
          const imp = localModules[key];
          if (!imp) throw new Error('page locale introuvable');
          const mod: any = await imp();
          const data = (mod && (mod.default || mod)) as any;
          if (!cancelled) { setPage(data); setPreferRemote(true); }
          return;
        } catch (e2: any) {
          if (!cancelled) setError(`introuvable (${e2?.message || 'erreur'})`);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (error) return <div className="text-zinc-500 text-sm">{error}</div>;
  if (!page) return <div className="text-zinc-400 text-sm">chargement du contenu…</div>;

  const html = preferRemote ? (page.contentHtml || page.contentHtmlLocal || '') : (page.contentHtmlLocal || page.contentHtml || '');
  const infobox = page.infoboxHtml || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {infobox && (
        <div className="md:col-span-1">
          <div className="border border-zinc-800 rounded bg-zinc-950 p-3" dangerouslySetInnerHTML={{ __html: infobox }} />
        </div>
      )}
      <div className={infobox ? 'md:col-span-3' : 'md:col-span-4'}>
        <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
