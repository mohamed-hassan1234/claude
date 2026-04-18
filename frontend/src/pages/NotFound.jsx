import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist p-4">
      <div className="rounded border border-slate-200 bg-white p-8 text-center shadow-soft">
        <h1 className="text-2xl font-bold text-ink">Page not found</h1>
        <p className="mt-2 text-slate-500">The requested page is not available.</p>
        <Link to="/" className="mt-5 inline-block rounded bg-ocean px-4 py-2 font-semibold text-white">Go to survey</Link>
      </div>
    </main>
  );
}
