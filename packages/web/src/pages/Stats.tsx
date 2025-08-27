/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export default function Stats() {
  const { data: items = [] } = useQuery({ queryKey: ['items', {}], queryFn: async () => (await api.get('/items')).data });
  const byRegion = Object.entries(
    items.reduce((acc: any, i: any) => {
      acc[i.region] = (acc[i.region] || 0) + 1;
      return acc;
    }, {})
  );

  return (
    <div className="card">
      <div className="font-semibold mb-2">compteurs (par région)</div>
      <ul className="text-sm space-y-1">
        {byRegion.map(([r, n]) => (
          <li key={r}>{r}: {n}</li>
        ))}
      </ul>
    </div>
  );
}
