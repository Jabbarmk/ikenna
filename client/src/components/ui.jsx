const BADGE_TONES = {
  new: 'bg-amber-100 text-amber-800',
  draft: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  unpaid: 'bg-amber-100 text-amber-800',
  contacted: 'bg-blue-100 text-blue-800',
  sent: 'bg-blue-100 text-blue-800',
  partial: 'bg-blue-100 text-blue-800',
  qualified: 'bg-emerald-100 text-emerald-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  received: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-rose-100 text-rose-800',
  rejected: 'bg-rose-100 text-rose-800',
  cancelled: 'bg-rose-100 text-rose-800',
  converted: 'bg-slate-200 text-slate-700',
  expired: 'bg-slate-200 text-slate-700',
};

export function Badge({ value }) {
  const tone = BADGE_TONES[value] || 'bg-slate-200 text-slate-700';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${tone}`}>{value}</span>;
}

const BTN_BASE = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none';
const BTN_VARIANTS = {
  primary: `${BTN_BASE} bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800`,
  secondary: `${BTN_BASE} bg-brand-50 text-brand-700 hover:bg-brand-100`,
  ghost: `${BTN_BASE} border border-slate-300 text-slate-600 hover:bg-slate-100`,
  danger: `${BTN_BASE} bg-rose-50 text-rose-700 hover:bg-rose-100`,
};
const BTN_SIZES = { md: '', sm: 'min-h-9 px-3 text-xs' };

export function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return <button className={`${BTN_VARIANTS[variant]} ${BTN_SIZES[size]} ${className}`} {...props} />;
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
  );
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, full, children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'col-span-1 sm:col-span-2 lg:col-span-3' : ''}`}>
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function FormGrid({ wide, children }) {
  return <div className={`grid grid-cols-1 gap-3.5 sm:grid-cols-2 ${wide ? 'lg:grid-cols-3' : ''}`}>{children}</div>;
}

export function ModalActions({ children }) {
  return <div className="col-span-1 mt-1 flex justify-end gap-2.5 sm:col-span-2 lg:col-span-3">{children}</div>;
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            active === t.value ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Panel({ className = '', children }) {
  return <div className={`mb-4 min-w-0 rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>;
}

export function Checkbox({ label, className = '', ...props }) {
  return (
    <label className={`flex items-center gap-2 text-sm text-slate-700 ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" {...props} />
      {label}
    </label>
  );
}
