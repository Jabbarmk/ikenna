const TONE_BAR = {
  default: 'bg-slate-300',
  green: 'bg-emerald-500',
  blue: 'bg-brand-600',
  orange: 'bg-amber-500',
  red: 'bg-rose-500',
  purple: 'bg-violet-500',
};

const TONE_TEXT = {
  default: 'text-slate-900',
  green: 'text-emerald-600',
  blue: 'text-brand-600',
  orange: 'text-amber-600',
  red: 'text-rose-600',
  purple: 'text-violet-600',
};

export default function StatCard({ label, value, sub, tone = 'default' }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`absolute inset-x-0 top-0 h-[3px] ${TONE_BAR[tone]}`} />
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1.5 text-2xl font-extrabold tracking-tight ${TONE_TEXT[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}
