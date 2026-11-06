import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { NAV_MODULES } from '../navModules';

export default function IconGrid({ badges = {} }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {NAV_MODULES.map((m) => {
        const badge = badges[m.to];
        return (
          <button
            key={m.to}
            onClick={() => navigate(m.to)}
            className="group relative flex aspect-square min-h-[140px] flex-col items-center justify-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md active:translate-y-0 active:shadow-sm"
          >
            {badge ? (
              <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white">
                {badge}
              </span>
            ) : null}
            <span className={`flex h-16 w-16 items-center justify-center rounded-2xl ${m.color}`}>
              <Icon name={m.icon} className="h-9 w-9" strokeWidth={1.6} />
            </span>
            <span className="text-sm font-semibold leading-tight text-slate-700 sm:text-base">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
