/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '../api/client';

export default function ItemRow({ item, status, onChange }: { item: any; status?: string; onChange: (s: string) => void }) {
  const setStatus = async (s: 'unchecked' | 'checked' | 'skipped') => {
    onChange(s);
    try {
      await api.post('/progress/bulk', { updates: [{ slug: item.slug, status: s }] });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
      <div>
        <div className="font-medium">{item.title}</div>
        <div className="text-xs text-zinc-400">{item.category} · {item.region}</div>
      </div>
      <div className="flex gap-1">
        <button className={`btn ${status === 'unchecked' ? 'ring-2 ring-zinc-500' : ''}`} onClick={() => setStatus('unchecked')}>todo</button>
        <button className={`btn ${status === 'checked' ? 'ring-2 ring-zinc-500' : ''}`} onClick={() => setStatus('checked')}>ok</button>
        <button className={`btn ${status === 'skipped' ? 'ring-2 ring-zinc-500' : ''}`} onClick={() => setStatus('skipped')}>skip</button>
      </div>
    </div>
  );
}
