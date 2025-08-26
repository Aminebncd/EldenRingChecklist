export default function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full bg-gray-700 h-2 mb-4">
      <div className="bg-green-500 h-2" style={{ width: `${percent}%` }} />
    </div>
  );
}
