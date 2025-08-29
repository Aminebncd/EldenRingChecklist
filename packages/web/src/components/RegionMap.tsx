/* eslint-disable @typescript-eslint/no-explicit-any */
import limgrave from '../assets/maps/limgrave.svg';
import liurnia from '../assets/maps/liurnia.svg';

const regionImages: Record<string, string> = {
  Limgrave: limgrave,
  Liurnia: liurnia,
};

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'loc';
}

export default function RegionMap({ region, items }: { region: string; items: any[] }) {
  const src = regionImages[region];
  const locations = Array.from(new Set(items.map((i) => i.location).filter(Boolean)));

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800">
      {src ? (
        <img src={src} alt={region} className="w-full h-48 object-cover opacity-80" />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-zinc-900 to-zinc-800" />
      )}
      <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black/50 to-transparent">
        <div className="text-sm text-white font-medium mb-2">{region}</div>
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <button
              key={loc}
              className="text-xs px-2 py-1 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              onClick={() => {
                const id = `loc-${slugify(loc)}`;
                const el = document.getElementById(id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

