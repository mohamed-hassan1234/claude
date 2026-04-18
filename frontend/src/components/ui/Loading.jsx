export default function Loading({ label = 'Loading data...' }) {
  return <div className="rounded border border-slate-200 bg-white p-6 text-sm text-slate-500">{label}</div>;
}
