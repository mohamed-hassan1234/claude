export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div className="w-full max-w-2xl overflow-hidden rounded bg-white shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
            <h3 className="pr-3 text-lg font-semibold text-ink">{title}</h3>
            <button onClick={onClose} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100">
              Close
            </button>
          </div>
          <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
