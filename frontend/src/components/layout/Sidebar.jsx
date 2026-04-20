import { BarChart3, ClipboardList, FileText, HelpCircle, LayoutDashboard, LogOut, PieChart, Settings, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const items = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/responses', label: 'Responses', icon: ClipboardList },
  { to: '/admin/sectors', label: 'Sectors', icon: PieChart },
  { to: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { to: '/admin/reports', label: 'Analytics & Reports', icon: FileText }
];

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { logout } = useAuth();

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] border-r border-slate-200 bg-white transition-transform duration-200 lg:z-30 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-ocean text-white">
                  <BarChart3 size={22} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Somalia</p>
                  <h1 className="truncate text-lg font-bold text-ink">Cloud Survey</h1>
                </div>
              </div>
              <button onClick={onClose} className="rounded border border-slate-200 p-2 text-slate-500 lg:hidden" aria-label="Close navigation">
                <X size={18} />
              </button>
            </div>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded px-3 py-3 text-sm font-medium ${
                      isActive ? 'bg-ocean text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <a href="/" className="mb-2 flex items-center gap-3 rounded px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <Settings size={18} />
              Public survey
            </a>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded px-3 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
