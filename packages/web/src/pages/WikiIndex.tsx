/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function WikiIndex() {
  const [data, setData] = useState<any[] | null>(null);
  const [q, setQ] = useState('');
  const [type, setType] = useState<string>('');

  useEffect(() => {
    fetch('/wiki/index.json')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, []);

  const list = useMemo(() => {
    const arr = (data || []) as any[];
    const qs = q.trim().toLowerCase();
    return arr.filter((e) => {
      if (type && e.pageType !== type) return false;
      if (!qs) return true;
      return String(e.title || '').toLowerCase().includes(qs) || String(e.slug || '').includes(qs);
    });
  }, [data, q, type]);

  const types = useMemo(() => Array.from(new Set((data || []).map((e: any) => e.pageType).filter(Boolean))).sort(), [data]);

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">wiki (offline) — index</div>
      <div className="flex gap-2 items-center">
        <input className="input w-64" placeholder="recherche…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">tous types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((e) => (
          <Link to={`/wiki/${e.slug}`} key={e.slug} className="block border border-zinc-800 rounded p-3 bg-zinc-950 hover:bg-zinc-900">
            <div className="text-sm text-zinc-400">{e.pageType || 'other'}</div>
            <div className="font-medium text-white">{e.title}</div>
            {e.primaryImage && (
              <img src={`/${e.primaryImage}`} className="mt-2 w-full h-28 object-cover rounded border border-zinc-800" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

