/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo } from 'react';
import { useFilters } from '../store/useFilters';

export default function Filters({ items }: { items: any[] }) {
  const { category, region, expansion, q, setCategory, setRegion, setExpansion, setQ } = useFilters();

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort(), [items]);
  const regions = useMemo(() => Array.from(new Set(items.map((i) => i.region).filter(Boolean))).sort(), [items]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input className="input w-64" placeholder="recherche…" value={q} onChange={(e) => setQ(e.target.value)} />
      <select className="select" value={expansion || ''} onChange={(e) => setExpansion((e.target.value || undefined) as any)}>
        <option value="">toutes extensions</option>
        <option value="base">base game</option>
        <option value="sote">shadow of the erdtree</option>
      </select>
      <select className="select" value={category || ''} onChange={(e) => setCategory(e.target.value || undefined)}>
        <option value="">toutes catégories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select className="select" value={region || ''} onChange={(e) => setRegion(e.target.value || undefined)}>
        <option value="">toutes régions</option>
        {regions.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    </div>
  );
}
