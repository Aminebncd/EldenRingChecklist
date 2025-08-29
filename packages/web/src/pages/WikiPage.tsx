/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function WikiPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setPage(null);
    if (!slug) return;
    fetch(`/wiki/pages/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(setPage)
      .catch((e) => setError(`introuvable (${e?.message || 'erreur'})`));
  }, [slug]);

  if (error) return <div className="text-red-400">{error}</div>;
  if (!page) return <div className="text-zinc-400">chargement…</div>;

  const html = page.contentHtmlLocal || page.contentHtml || '';
  const infobox = page.infoboxHtml || '';

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-400"><Link to="/wiki" className="hover:underline">← index wiki</Link></div>

      <div className="text-xl font-semibold text-white">{page.title}</div>

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
    </div>
  );
}

