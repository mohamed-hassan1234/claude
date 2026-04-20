export default function ChartPanel({ title, description, actions, height = 'h-64 sm:h-72', children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded border border-slate-200 bg-white p-4 shadow-soft sm:p-5 ${className}`.trim()}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <div className={`min-w-0 ${height}`}>{children}</div>
    </section>
  );
}
