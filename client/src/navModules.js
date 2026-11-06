export const NAV_MODULES = [
  { to: '/leads', label: 'Leads', icon: 'leads', color: 'bg-sky-50 text-sky-600' },
  { to: '/clients', label: 'Clients', icon: 'clients', color: 'bg-indigo-50 text-indigo-600' },
  { to: '/quotations', label: 'Quotations', icon: 'quotations', color: 'bg-violet-50 text-violet-600' },
  { to: '/stock', label: 'Stock', icon: 'stock', color: 'bg-amber-50 text-amber-600' },
  { to: '/suppliers', label: 'Suppliers', icon: 'suppliers', color: 'bg-teal-50 text-teal-600' },
  { to: '/purchases', label: 'Purchases', icon: 'purchases', color: 'bg-cyan-50 text-cyan-600' },
  { to: '/sales', label: 'Sales Invoices', icon: 'sales', color: 'bg-emerald-50 text-emerald-600' },
  { to: '/returns', label: 'Sales Returns', icon: 'returns', color: 'bg-rose-50 text-rose-600' },
  { to: '/accounts', label: 'Accounts', icon: 'accounts', color: 'bg-fuchsia-50 text-fuchsia-600' },
  { to: '/reports', label: 'Reports', icon: 'reports', color: 'bg-orange-50 text-orange-600' },
  { to: '/settings', label: 'Settings', icon: 'settings', color: 'bg-slate-100 text-slate-600' },
];

export function moduleTitleForPath(pathname) {
  if (pathname === '/') return 'Dashboard';
  const match = NAV_MODULES.find((m) => pathname === m.to || pathname.startsWith(`${m.to}/`));
  return match ? match.label : 'Ikenna Kamal Trading';
}
