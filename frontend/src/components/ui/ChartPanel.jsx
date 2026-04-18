export default function ChartPanel({ title, children }) {
  return (
    <section className="overflow-hidden rounded border border-slate-200 bg-white p-4 shadow-soft sm:p-5">
      <h3 className="mb-4 text-base font-semibold text-ink">{title}</h3>
      <div className="h-64 min-w-0 sm:h-72">{children}</div>
    </section>
  );
}
