import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

interface Props {
  item: any;
  status: string;
}

export default function ItemRow({ item, status }: Props) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      api.post('/progress/bulk', { updates: [{ slug: item.slug, status: newStatus }] }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['progress'] }),
  });

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="flex-1">{item.title}</span>
      {['unchecked', 'checked', 'skipped'].map((s) => (
        <button
          key={s}
          className={`px-2 text-sm ${status === s ? 'bg-blue-500' : 'bg-gray-700'}`}
          onClick={() => mutation.mutate(s)}
        >
          {s[0].toUpperCase()}
        </button>
      ))}
    </div>
  );
}
