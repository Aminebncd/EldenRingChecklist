/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import WikiForItem from '../components/WikiForItem';

function WikiStub() {
  return (
    <div className="mt-4 p-3 rounded border border-zinc-800 bg-zinc-900/40 text-zinc-400 text-sm">
      contenu wiki à venir
    </div>
  );
}

export default function ItemDetail() {
  const { slug } = useParams<{ slug: string }>();

  const itemQuery = useQuery({
    queryKey: ['item', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await api.get(`/items/${slug}`);
      return data as any;
    }
  });

  if (itemQuery.isLoading) return <div className="text-zinc-400">chargement…</div>;
  if (itemQuery.error) return <div className="text-red-400">erreur de chargement</div>;
  const item = itemQuery.data as any;
  if (!item) return <div className="text-zinc-400">introuvable</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-400">
        <Link to="/" className="hover:underline">← retour à la liste</Link>
      </div>

      <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-xl font-semibold text-white">{item.title}</h1>
          {item.expansion && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.expansion === 'sote' ? 'border-amber-500 text-amber-400' : 'border-zinc-600 text-zinc-300'}`}>
              {item.expansion}
            </span>
          )}
        </div>
        <div className="text-sm text-zinc-400">
          <span>cat: {item.category || '—'}</span>
          {item.subcategory ? <span> · sub: {item.subcategory}</span> : null}
          <span> · région: {item.region || '—'}</span>
          <span> · lieu: {item.location || '—'}</span>
          {typeof item.weight === 'number' ? <span> · poids: {item.weight}</span> : null}
          {typeof item.isUnique === 'boolean' ? <span> · unique: {item.isUnique ? 'oui' : 'non'}</span> : null}
        </div>

        {(item.tags?.length || 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {item.tags.map((t: string) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-300">{t}</span>
            ))}
          </div>
        )}

        {(item.prerequisites?.length || 0) > 0 && (
          <div className="mt-2 text-sm text-zinc-300">prérequis: {item.prerequisites.join(', ')}</div>
        )}

        {item.notes && <div className="mt-3 text-sm text-zinc-300 whitespace-pre-wrap">{item.notes}</div>}

        <div className="mt-3 text-[10px] text-zinc-500">slug: {item.slug}</div>

        {/* Wiki content (offline assets) */}
        <WikiForItem item={item} />
      </div>
    </div>
  );
}
