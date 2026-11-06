import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { Badge } from '../components/ui';
import { NAV_MODULES } from '../navModules';
import { money, formatDate } from '../utils/format';

const QUICK_ACCESS = ['/sales', '/stock', '/quotations', '/purchases'];

function QuickAccessCard({ module, stat, featured }) {
  const navigate = useNavigate();

  if (featured) {
    return (
      <button
        onClick={() => navigate(module.to)}
        className="group flex min-w-[170px] flex-1 flex-col items-start gap-4 rounded-2xl bg-[#2E6BFF] p-4 text-left shadow-md shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white">
          <Icon name={module.icon} className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div>
          <div className="text-sm font-semibold text-white">{module.label}</div>
          <div className="mt-0.5 text-xs text-blue-100">{stat}</div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(module.to)}
      className="group flex min-w-[170px] flex-1 flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${module.color}`}>
        <Icon name={module.icon} className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div>
        <div className="text-sm font-semibold text-slate-800">{module.label}</div>
        <div className="mt-0.5 text-xs text-slate-400">{stat}</div>
      </div>
    </button>
  );
}

function FolderTile({ module, count }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(module.to)}
      className="flex min-w-[150px] flex-1 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${module.color}`}>
        <Icon name={module.icon} className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-800">{module.label}</div>
        <div className="mt-0.5 text-xs text-slate-400">{count}</div>
      </div>
      <Icon name="chevronRight" className="h-4 w-4 flex-shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function RightStatRow({ icon, color, label, sub, value }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon name={icon} className="h-4.5 w-4.5" strokeWidth={1.8} />
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-400">{sub}</div>
        </div>
      </div>
      <div className="text-sm font-bold text-slate-800">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/reports/dashboard').then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Failed to load dashboard: {error}</div>;
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <div className="h-10 w-48 animate-shimmer rounded-lg" />
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-shimmer rounded-2xl" />)}
          </div>
          <div className="h-80 animate-shimmer rounded-2xl" />
        </div>
        <div className="h-[600px] animate-shimmer rounded-2xl" />
      </div>
    );
  }

  const chartData = data.salesTrend.map((d) => ({ date: formatDate(d.date), total: Number(d.total) }));
  const quickModules = QUICK_ACCESS.map((to) => NAV_MODULES.find((m) => m.to === to)).filter(Boolean);
  const quickStats = {
    '/sales': `${data.todaySalesCount} invoice(s) today`,
    '/stock': `${data.lowStockCount} low stock`,
    '/quotations': `${data.openQuotes} open`,
    '/purchases': `AED ${money(data.monthPurchases)} this month`,
  };
  const folderModules = NAV_MODULES.filter((m) => !QUICK_ACCESS.includes(m.to)).slice(0, 4);
  const folderStats = {
    '/leads': `${data.openLeads} open`,
    '/clients': 'Manage accounts',
    '/suppliers': 'Manage vendors',
    '/returns': 'Credit notes',
    '/accounts': 'Ledger',
    '/reports': 'Analytics',
    '/settings': 'Preferences',
  };

  const totalInOut = data.receivables + data.payables;
  const receivablePct = totalInOut > 0 ? Math.round((data.receivables / totalInOut) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
      {/* ===== Main content ===== */}
      <div className="min-w-0">
        <div className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E6BFF] to-[#5B8CFF] px-6 py-6 sm:px-7 sm:py-7">
          <h1 className="text-xl font-bold text-white sm:text-2xl">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="mt-0.5 text-sm text-blue-100">Here's what's happening with your business today</p>
        </div>

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Quick Access</h2>
        </div>
        <div className="flex flex-wrap gap-3.5">
          {quickModules.map((m, idx) => (
            <QuickAccessCard key={m.to} module={m} stat={quickStats[m.to]} featured={idx === 0} />
          ))}
        </div>

        <div className="mb-3 mt-7 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Modules</h2>
          <button className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline" onClick={() => navigate('/reports')}>
            View reports <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-3.5">
          {folderModules.map((m) => (
            <FolderTile key={m.to} module={m} count={folderStats[m.to]} />
          ))}
        </div>

        <div className="mb-3 mt-7 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Recent Invoices</h2>
          <button className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline" onClick={() => navigate('/sales')}>
            View all <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {data.recentInvoices.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-400">No invoices yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/sales/${inv.id}`)}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                            <Icon name="sales" className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{inv.invoice_no}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{inv.client_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{formatDate(inv.invoice_date)}</td>
                      <td className="px-4 py-3"><Badge value={inv.status} /></td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">AED {money(inv.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ===== Right panel ===== */}
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <Icon name="bell" className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-slate-700">Hi, {user?.name?.split(' ')[0] || 'there'}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {(user?.name || '?').charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="14" />
                <circle
                  cx="60" cy="60" r="50" fill="none" stroke="#2563eb" strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${receivablePct * 3.14} ${314 - receivablePct * 3.14}`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xl font-extrabold text-slate-900">AED {money(data.receivables)}</span>
                <span className="text-[11px] text-slate-400">receivable</span>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-slate-400">of AED {money(totalInOut)} total balance</div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-1">
            <RightStatRow icon="money" color="bg-rose-50 text-rose-600" label="Payables" sub="Owed to suppliers" value={`AED ${money(data.payables)}`} />
            <RightStatRow icon="box" color="bg-amber-50 text-amber-600" label="Stock Value" sub={`${data.lowStockCount} low stock items`} value={`AED ${money(data.stockValue)}`} />
            <RightStatRow icon="leads" color="bg-sky-50 text-sky-600" label="Open Leads" sub="Not yet converted" value={data.openLeads} />
            <RightStatRow icon="quotations" color="bg-violet-50 text-violet-600" label="Quotations" sub="Draft or sent" value={data.openQuotes} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">This Month</h3>
            <span className="text-xs text-slate-400">{data.monthSalesCount} invoice(s)</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">AED {money(data.monthSales)}</div>
          <div className="mt-3 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="miniTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip formatter={(v) => [`AED ${money(v)}`, 'Sales']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} fill="url(#miniTrendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-400">Sales trend, last 14 days</div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            <Icon name="reports" className="h-6 w-6" />
          </div>
          <div className="text-sm font-bold">View Full Reports</div>
          <p className="mt-1 text-xs text-brand-100">Stock valuation, sales and purchase analysis in one place</p>
          <button
            onClick={() => navigate('/reports')}
            className="mt-4 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Open Reports
          </button>
        </div>
      </div>
    </div>
  );
}
