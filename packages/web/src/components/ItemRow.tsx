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
        <div className="font-medium flex items-center gap-2">
          <span>{item.title}</span>
          {item.expansion && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.expansion === 'sote' ? 'border-amber-500 text-amber-400' : 'border-zinc-600 text-zinc-300'}`}>
              {item.expansion}
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-400">{item.category} · {item.region}</div>
      </div>
      <div className="flex gap-1">
        <button
          className={`btn ${status === 'unchecked' ? 'bg-zinc-700 text-white' : 'bg-zinc-800'} hover:bg-zinc-700`}
          onClick={() => setStatus('unchecked')}
        >
          todo
        </button>
        <button
          className={`btn ${status === 'checked' ? 'bg-emerald-600 text-white' : 'bg-zinc-800'} hover:bg-emerald-700`}
          onClick={() => setStatus('checked')}
        >
          ok
        </button>
        <button
          className={`btn ${status === 'skipped' ? 'bg-amber-600 text-black' : 'bg-zinc-800'} hover:bg-amber-700`}
          onClick={() => setStatus('skipped')}
        >
          skip
        </button>
      </div>
    </div>
  );
}
