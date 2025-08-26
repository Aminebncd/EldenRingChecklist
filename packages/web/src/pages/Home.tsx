import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFilters } from '../store/useFilters';
import CategoryGroup from '../components/CategoryGroup';
import ProgressBar from '../components/ProgressBar';

export default function Home() {
  const filters = useFilters();
  const { data: items = [] } = useQuery({
    queryKey: ['items', filters],
    queryFn: async () => {
      const params: any = {};
      if (filters.category) params.category = filters.category;
      if (filters.region) params.region = filters.region;
      if (filters.q) params.q = filters.q;
      const res = await api.get('/items', { params });
      return res.data;
    },
  });

  const { data: progress = {} } = useQuery({
    queryKey: ['progress'],
    queryFn: async () => (await api.get('/progress')).data,
    enabled: !!localStorage.getItem('token'),
  });

  const totalWeight = items.reduce((s: number, i: any) => s + (i.weight ?? 1), 0);
  const doneWeight = items.reduce((s: number, i: any) => {
    const p = progress[i.slug];
    return s + (p && p.status === 'checked' ? i.weight ?? 1 : 0);
  }, 0);

  const groups = items.reduce((acc: Record<string, any[]>, item: any) => {
    acc[item.region] = acc[item.region] || [];
    acc[item.region].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="p-4">
      <ProgressBar percent={totalWeight ? (doneWeight / totalWeight) * 100 : 0} />
      {Object.entries(groups).map(([region, list]) => (
        <CategoryGroup key={region} title={region} items={list} progress={progress} />
      ))}
    </div>
  );
}
