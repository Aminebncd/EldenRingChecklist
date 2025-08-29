/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ItemRow({ item, status, onChange }: { item: any; status?: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const setStatus = async (s: 'unchecked' | 'checked' | 'skipped') => {
    onChange(s);
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between py-2 border-b border-zinc-800/60">
        <div>
          <div className="font-medium flex items-center gap-2">
            <Link to={`/item/${item.slug}`} className="hover:underline">{item.title}</Link>
            {item.expansion && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.expansion === 'sote' ? 'border-amber-500 text-amber-400' : 'border-zinc-600 text-zinc-300'}`}>
                {item.expansion}
              </span>
            )}
            <button
              aria-label="details"
              className="ml-1 text-xs px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
              onClick={() => setOpen((v) => !v)}
            >
              i
            </button>
          </div>
          <div className="text-xs text-zinc-400">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ''} · {item.region}</div>
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

      <div
        className={`absolute z-20 right-0 top-full mt-2 w-[28rem] max-w-[90vw] border border-zinc-800 rounded-xl bg-zinc-950/95 backdrop-blur p-3 shadow-lg ${open ? 'block' : 'hidden group-hover:block'}`}
        onMouseLeave={() => setOpen(false)}
      >
        <div className="text-sm text-zinc-300 mb-1">{item.title}</div>
        {item.notes && <div className="text-sm text-zinc-400 whitespace-pre-wrap mb-2">{item.notes}</div>}
        <div className="text-[11px] text-zinc-400 mb-2">
          <span>cat: {item.category}</span>
          {item.subcategory ? <span> · sub: {item.subcategory}</span> : null}
          <span> · région: {item.region || '—'}</span>
          {typeof item.weight === 'number' ? <span> · poids: {item.weight}</span> : null}
          {typeof item.isUnique === 'boolean' ? <span> · unique: {item.isUnique ? 'oui' : 'non'}</span> : null}
        </div>
        {(item.tags?.length || 0) > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {item.tags.map((t: string) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">{t}</span>
            ))}
          </div>
        )}
        {(item.prerequisites?.length || 0) > 0 && (
          <div className="text-[11px] text-zinc-400">prérequis: {item.prerequisites.join(', ')}</div>
        )}
        <div className="text-[10px] text-zinc-500 mt-2">slug: {item.slug}</div>
      </div>
    </div>
  );
}
