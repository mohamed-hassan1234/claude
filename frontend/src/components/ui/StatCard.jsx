export default function StatCard({ label, value, helper }) {
  return (
    <div className="min-w-0 rounded border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-ink sm:text-3xl">{value}</p>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}
