/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ProgressBar({ items, progress }: { items: any[]; progress: Record<string, any> }) {
  const totalWeight = items.reduce((s, i) => s + (i.weight || 1), 0);
  const done = items.filter((i) => progress[i.slug]?.status === 'checked');
  const doneWeight = done.reduce((s, i) => s + (i.weight || 1), 0);
  const pct = totalWeight ? Math.round((doneWeight / totalWeight) * 100) : 0;

  return (
    <div className="card">
      <div className="text-sm mb-2">progression pondérée: {pct}%</div>
      <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full bg-zinc-200" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
