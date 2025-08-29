/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFilters } from '../store/useFilters';
import Filters from '../components/Filters';
import ProgressBar from '../components/ProgressBar';
import CategoryGroup from '../components/CategoryGroup';
import RegionMap from '../components/RegionMap';

export default function Home() {
  const { category, region, location, expansion, q } = useFilters();
  const qc = useQueryClient();

  const itemsQuery = useQuery({
    queryKey: ['items', { category, region, location, expansion, q }],
    queryFn: async () => {
      const { data } = await api.get('/items', { params: { category, region, location, expansion, q } });
      return data as any[];
    }
  });

  const progressQuery = useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/progress');
        return data as Record<string, any>;
      } catch {
        return {} as Record<string, any>;
      }
    }
  });

  const items = itemsQuery.data || [];
  const progress = progressQuery.data || {};

  const groups: Record<string, any[]> = items.reduce((acc: any, it) => {
    const k = it.region || 'Autre';
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  const onLocalChange = async (slug: string, s: string) => {
    if (slug === '*bulk*') {
      await qc.invalidateQueries({ queryKey: ['progress'] });
      return;
    }
    // optimistic update using updater to avoid stale refs
    const previous = qc.getQueryData(['progress']) as Record<string, any> | undefined;
    qc.setQueryData(['progress'], (old: any) => {
      const next = { ...(old || {}) } as Record<string, any>;
      next[slug] = { ...(next[slug] || {}), status: s };
      return next;
    });
    try {
      await api.post('/progress/bulk', { updates: [{ slug, status: s }] });
    } catch (e) {
      // revert on error
      qc.setQueryData(['progress'], previous || {});
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <Filters items={items} />
      <ProgressBar items={items} progress={progress} />

      {Object.entries(groups).map(([title, group]) => (
        <div key={title} className="space-y-3">
          <RegionMap region={title} items={group} />
          <CategoryGroup title={title} items={group} progress={progress} onLocalChange={onLocalChange} />
        </div>
      ))}
    </div>
  );
}
