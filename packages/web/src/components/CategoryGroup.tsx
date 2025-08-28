/* eslint-disable @typescript-eslint/no-explicit-any */
import ItemRow from './ItemRow';
import { api } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

export default function CategoryGroup({ title, items, progress, onLocalChange }: { title: string; items: any[]; progress: Record<string, any>; onLocalChange: (slug: string, s: string) => void }) {
  const qc = useQueryClient();
  const bulk = async (s: 'checked' | 'unchecked' | 'skipped') => {
    // optimistic local update for the whole group
    const previous = qc.getQueryData(['progress']);
    qc.setQueryData(['progress'], (old: any) => {
      const next = { ...(old || {}) } as Record<string, any>;
      for (const it of items) {
        next[it.slug] = { ...(next[it.slug] || {}), status: s };
      }
      return next;
    });
    try {
      const updates = items.map((it) => ({ slug: it.slug, status: s }));
      await api.post('/progress/bulk', { updates });
    } catch (e) {
      // revert by invalidating if failed
      await qc.invalidateQueries({ queryKey: ['progress'] });
      console.error(e);
    }
  };

  return (
    <details className="card" open>
      <summary className="cursor-pointer select-none flex items-center justify-between">
        <span className="font-semibold">{title}</span>
        <div className="flex gap-2">
          <button className="btn" onClick={(e) => { e.preventDefault(); bulk('checked'); }}>cocher</button>
          <button className="btn" onClick={(e) => { e.preventDefault(); bulk('unchecked'); }}>décocher</button>
          <button className="btn" onClick={(e) => { e.preventDefault(); bulk('skipped'); }}>skip</button>
        </div>
      </summary>
      <div className="mt-3">
        {items.map((it) => (
          <ItemRow key={it.slug} item={it} status={progress[it.slug]?.status || 'unchecked'} onChange={(s) => onLocalChange(it.slug, s)} />
        ))}
      </div>
    </details>
  );
}
