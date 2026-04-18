export default function EmptyState({ title = 'No data yet', message = 'New records will appear here.' }) {
  return (
    <div className="rounded border border-dashed border-slate-300 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{message}</p>
    </div>
  );
}
