import ImportDialog from '../components/ImportDialog';

export default function ImportPage() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token)
    return (
      <div className="card">
        <div className="font-semibold mb-2">import csv/xlsx</div>
        <div className="text-sm text-zinc-400">login requis</div>
      </div>
    );
  return <ImportDialog />;
}
