import { useFilters } from '../store/useFilters';

export default function Filters() {
  const { category, region, q, setCategory, setRegion, setQ } = useFilters();
  return (
    <div className="flex gap-2">
      <input
        className="bg-gray-800 p-1"
        placeholder="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <input
        className="bg-gray-800 p-1"
        placeholder="category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      />
      <input
        className="bg-gray-800 p-1"
        placeholder="region"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      />
    </div>
  );
}
