import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import MoreSheet from './MoreSheet';
import { NAV_MODULES } from '../navModules';

const PRIMARY_PATHS = ['/sales', '/quotations', '/stock'];
const PRIMARY_MODULES = PRIMARY_PATHS.map((to) => NAV_MODULES.find((m) => m.to === to)).filter(Boolean);
const OVERFLOW_MODULES = NAV_MODULES.filter((m) => !PRIMARY_PATHS.includes(m.to));

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isHome = location.pathname === '/';
  const isMoreActive = OVERFLOW_MODULES.some((m) => location.pathname === m.to || location.pathname.startsWith(`${m.to}/`));

  const tabs = [
    { to: '/', label: 'Home', icon: 'home', active: isHome },
    ...PRIMARY_MODULES.map((m) => ({
      to: m.to,
      label: m.label.split(' ')[0],
      icon: m.icon,
      active: location.pathname === m.to || location.pathname.startsWith(`${m.to}/`),
    })),
  ];

  return (
    <>
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.to}
            onClick={() => navigate(tab.to)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
              tab.active ? 'text-brand-600' : 'text-slate-400'
            }`}
          >
            <Icon name={tab.icon} className="h-5 w-5" strokeWidth={tab.active ? 2 : 1.7} />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setMoreOpen(true)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold ${
            isMoreActive ? 'text-brand-600' : 'text-slate-400'
          }`}
        >
          <Icon name="grid" className="h-5 w-5" strokeWidth={isMoreActive ? 2 : 1.7} />
          More
        </button>
      </nav>

      {moreOpen && <MoreSheet modules={OVERFLOW_MODULES} onClose={() => setMoreOpen(false)} />}
    </>
  );
}
