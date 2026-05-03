import { Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onOpenMenu }) {
  const { user } = useAuth();

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          <button onClick={onOpenMenu} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-600 lg:hidden" aria-label="Open navigation">
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-500 sm:text-sm">Cloud Computing Readiness, Challenges, and Adoption</p>
            <h2 className="truncate text-base font-semibold text-ink sm:text-lg">Survey Management</h2>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link to="/" className="hidden rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 sm:inline-block">
            Submit response
          </Link>
          <Link to="/" className="rounded border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 sm:hidden">
            Public
          </Link>
          <div className="max-w-[8rem] truncate rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-ink" title={user?.name || 'Admin'}>
            {user?.name || 'Admin'}
          </div>
        </div>
      </div>
    </header>
  );
}
