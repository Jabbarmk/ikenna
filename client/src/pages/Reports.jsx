import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { Badge, Checkbox, Input, Tabs } from '../components/ui';
import { money, formatDate, today } from '../utils/format';

const TABS = [
  { value: 'Stock', label: 'Stock' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Purchases', label: 'Purchases' },
];

function TotalsSummary({ rows }) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{value}</div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('Stock');
  const [stock, setStock] = useState([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [sales, setSales] = useState({ items: [], totals: {} });
  const [purchases, setPurchases] = useState({ items: [], totals: {} });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState(today());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'Stock') {
      setLoading(true);
      api.get('/reports/stock', { lowStockOnly: lowStockOnly ? 'true' : undefined }).then(setStock).finally(() => setLoading(false));
    }
  }, [tab, lowStockOnly]);

  useEffect(() => {
    if (tab === 'Sales') {
      setLoading(true);
      api.get('/reports/sales', { from, to }).then(setSales).finally(() => setLoading(false));
    } else if (tab === 'Purchases') {
      setLoading(true);
      api.get('/reports/purchases', { from, to }).then(setPurchases).finally(() => setLoading(false));
    }
  }, [tab, from, to]);

  const stockColumns = [
    { key: 'code', header: 'Code' },
    { key: 'description', header: 'Description' },
    { key: 'unit', header: 'Unit' },
    { key: 'qty_on_hand', header: 'Qty' },
    { key: 'cost_price', header: 'Cost', render: (r) => money(r.cost_price) },
    { key: 'stock_value', header: 'Value', render: (r) => money(r.stock_value) },
  ];

  const salesColumns = [
    { key: 'invoice_no', header: 'Invoice No.' },
    { key: 'invoice_date', header: 'Date', render: (r) => formatDate(r.invoice_date) },
    { key: 'client_name', header: 'Client' },
    { key: 'subtotal', header: 'Subtotal', render: (r) => money(r.subtotal) },
    { key: 'vat_amount', header: 'VAT', render: (r) => money(r.vat_amount) },
    { key: 'total', header: 'Total', render: (r) => money(r.total) },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  const purchaseColumns = [
    { key: 'purchase_no', header: 'Purchase No.' },
    { key: 'purchase_date', header: 'Date', render: (r) => formatDate(r.purchase_date) },
    { key: 'supplier_name', header: 'Supplier' },
    { key: 'subtotal', header: 'Subtotal', render: (r) => money(r.subtotal) },
    { key: 'vat_amount', header: 'VAT', render: (r) => money(r.vat_amount) },
    { key: 'total', header: 'Total', render: (r) => money(r.total) },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Reports" subtitle="Stock valuation, sales and purchases analysis" />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Stock' && (
        <>
          <div className="mb-3.5">
            <Checkbox label="Low stock only" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          </div>
          <DataTable columns={stockColumns} rows={stock} loading={loading} emptyMessage="No stock data." />
        </>
      )}

      {tab === 'Sales' && (
        <>
          <div className="mb-3.5 flex flex-wrap items-center gap-3.5">
            <label className="flex items-center gap-2 text-sm text-slate-600"><span>From</span><Input className="w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><span>To</span><Input className="w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <TotalsSummary rows={[
            ['Subtotal', money(sales.totals.subtotal)],
            ['VAT Collected', money(sales.totals.vat_amount)],
            ['Total Sales', money(sales.totals.total)],
          ]} />
          <DataTable columns={salesColumns} rows={sales.items} loading={loading} emptyMessage="No sales in this period." />
        </>
      )}

      {tab === 'Purchases' && (
        <>
          <div className="mb-3.5 flex flex-wrap items-center gap-3.5">
            <label className="flex items-center gap-2 text-sm text-slate-600"><span>From</span><Input className="w-auto" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><span>To</span><Input className="w-auto" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
          <TotalsSummary rows={[
            ['Subtotal', money(purchases.totals.subtotal)],
            ['VAT Paid', money(purchases.totals.vat_amount)],
            ['Total Purchases', money(purchases.totals.total)],
          ]} />
          <DataTable columns={purchaseColumns} rows={purchases.items} loading={loading} emptyMessage="No purchases in this period." />
        </>
      )}
    </div>
  );
}
