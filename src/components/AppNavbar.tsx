import { useAuth } from '../context/AuthContext';

export function AppNavbar() {
  const { user, hasPermission, logout } = useAuth();
  const currentPath = window.location.pathname;

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4 md:gap-6">
          <button type="button" onClick={() => window.location.assign('/dashboard')} className="shrink-0 text-left text-lg font-semibold text-slate-900">
            Email Alert Reader
          </button>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            <button type="button" onClick={() => window.location.assign('/dashboard')} className={`rounded-lg px-3 py-2 text-sm font-medium ${currentPath === '/dashboard' || currentPath === '/' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              Dashboard
            </button>
            <button type="button" onClick={() => window.location.assign('/analytics')} className={`rounded-lg px-3 py-2 text-sm font-medium ${currentPath === '/analytics' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              Analytics
            </button>
            {hasPermission('ACCESS_MANAGE') ? (
              <button type="button" onClick={() => window.location.assign('/admin/access')} className={`rounded-lg px-3 py-2 text-sm font-medium ${currentPath === '/admin/access' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                Access Management
              </button>
            ) : null}
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">{user?.full_name}</div>
            <div className="text-xs text-slate-500">{user?.roles.join(', ')}</div>
          </div>
          <button type="button" onClick={logout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
