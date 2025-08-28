/* eslint-disable @typescript-eslint/no-explicit-any */
import ItemRow from './ItemRow';
import { api } from '../api/client';

export default function CategoryGroup({ title, items, progress, onLocalChange }: { title: string; items: any[]; progress: Record<string, any>; onLocalChange: (slug: string, s: string) => void }) {
  const bulk = async (s: 'checked' | 'unchecked' | 'skipped') => {
    onLocalChange('*bulk*', s);
    try {
      const updates = items.map((it) => ({ slug: it.slug, status: s }));
      await api.post('/progress/bulk', { updates });
    } catch (e) {
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
