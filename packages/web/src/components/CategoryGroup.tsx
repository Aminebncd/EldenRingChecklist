import ItemRow from './ItemRow';

interface Props {
  title: string;
  items: any[];
  progress: Record<string, any>;
}

export default function CategoryGroup({ title, items, progress }: Props) {
  return (
    <div className="mb-4">
      <h2 className="font-bold mb-2">{title}</h2>
      {items.map((item) => (
        <ItemRow key={item.slug} item={item} status={progress[item.slug]?.status || 'unchecked'} />
      ))}
    </div>
  );
}
