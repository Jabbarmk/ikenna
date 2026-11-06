import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { Badge, Tabs } from '../components/ui';
import { money, formatDate } from '../utils/format';

const TABS = [
  { value: 'receivables', label: 'Receivables' },
  { value: 'payables', label: 'Payables' },
  { value: 'payments', label: 'Payment History' },
];

export default function Accounts() {
  const [tab, setTab] = useState('receivables');
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/accounts/receivables'),
      api.get('/accounts/payables'),
      api.get('/accounts/payments'),
    ]).then(([r, p, pay]) => {
      setReceivables(r);
      setPayables(p);
      setPayments(pay);
    }).finally(() => setLoading(false));
  }, []);

  const totalReceivable = receivables.reduce((s, r) => s + Number(r.balance), 0);
  const totalPayable = payables.reduce((s, r) => s + Number(r.balance), 0);

  const receivableColumns = [
    { key: 'name', header: 'Client' },
    { key: 'company', header: 'Company' },
    { key: 'invoiced', header: 'Invoiced', render: (r) => money(r.invoiced) },
    { key: 'paid', header: 'Paid', render: (r) => money(r.paid) },
    { key: 'returned', header: 'Returned', render: (r) => money(r.returned) },
    { key: 'balance', header: 'Balance Due', render: (r) => <strong>{money(r.balance)}</strong> },
  ];

  const payableColumns = [
    { key: 'name', header: 'Supplier' },
    { key: 'purchased', header: 'Purchased', render: (r) => money(r.purchased) },
    { key: 'paid', header: 'Paid', render: (r) => money(r.paid) },
    { key: 'balance', header: 'Balance Owed', render: (r) => <strong>{money(r.balance)}</strong> },
  ];

  const paymentColumns = [
    { key: 'payment_date', header: 'Date', render: (r) => formatDate(r.payment_date) },
    { key: 'party_type', header: 'Party Type' },
    { key: 'direction', header: 'Direction', render: (r) => <Badge value={r.direction === 'in' ? 'paid' : 'unpaid'} /> },
    { key: 'amount', header: 'Amount', render: (r) => money(r.amount) },
    { key: 'method', header: 'Method' },
    { key: 'notes', header: 'Notes' },
  ];

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Receivables, payables and payment history" />

      <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <StatCard label="Total Receivables" value={`AED ${money(totalReceivable)}`} tone="blue" />
        <StatCard label="Total Payables" value={`AED ${money(totalPayable)}`} tone="orange" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'receivables' && <DataTable columns={receivableColumns} rows={receivables} loading={loading} emptyMessage="No outstanding receivables." />}
      {tab === 'payables' && <DataTable columns={payableColumns} rows={payables} loading={loading} emptyMessage="No outstanding payables." />}
      {tab === 'payments' && <DataTable columns={paymentColumns} rows={payments} loading={loading} emptyMessage="No payments recorded yet." />}
    </div>
  );
}
