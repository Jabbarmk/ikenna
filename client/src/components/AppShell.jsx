import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NAV_MODULES, moduleTitleForPath } from '../navModules';
import Icon from './Icon';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const title = moduleTitleForPath(location.pathname);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-100">
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {!isHome && (
              <button
                onClick={() => navigate('/')}
                className="flex h-14 w-14 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 active:bg-slate-200"
                aria-label="Home"
              >
                <Icon name="home" className="h-7 w-7" />
              </button>
            )}
            <div>
              <div className="text-lg font-bold leading-tight text-slate-900 sm:text-xl">{title}</div>
              <div className="hidden text-base font-bold text-black sm:block">Ikenna Kamal General Trading L.L.C.</div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-slate-700">{user?.name}</div>
              <div className="text-xs capitalize text-slate-400">{user?.role}</div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-base font-bold text-white">
              {(user?.name || '?').charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="flex h-14 w-14 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-600 active:bg-rose-100"
              aria-label="Log out"
            >
              <Icon name="logout" className="h-7 w-7" />
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-[1800px] gap-1.5 overflow-x-auto px-3 pb-3 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              isHome ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Icon name="home" className="h-5 w-5" /> Dashboard
          </button>
          {NAV_MODULES.map((m) => {
            const active = location.pathname === m.to || location.pathname.startsWith(`${m.to}/`);
            return (
              <button
                key={m.to}
                onClick={() => navigate(m.to)}
                className={`flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                  active ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon name={m.icon} className="h-5 w-5" /> {m.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
