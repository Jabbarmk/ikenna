import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import Icon from '../components/Icon';
import { Badge, Button, Input, Tabs } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, formatDate } from '../utils/format';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date(new Date().toDateString())) / 86400000);
  return diff;
}

function ValidUntilCell({ value, status }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const days = daysUntil(value);
  if (status === 'accepted' || status === 'rejected') return <span className="text-slate-400">{formatDate(value)}</span>;
  if (days < 0) return <span className="font-medium text-rose-600">{formatDate(value)} · expired</span>;
  if (days <= 3) return <span className="font-medium text-amber-600">{formatDate(value)} · {days}d left</span>;
  return <span className="text-slate-500">{formatDate(value)}</span>;
}

export default function Quotations() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRows(await api.get('/quotations', { q, status }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, status]);

  const stats = useMemo(() => {
    const draft = rows.filter((r) => r.status === 'draft').length;
    const sent = rows.filter((r) => r.status === 'sent').length;
    const accepted = rows.filter((r) => r.status === 'accepted');
    const acceptedValue = accepted.reduce((s, r) => s + Number(r.total), 0);
    const openValue = rows.filter((r) => r.status === 'draft' || r.status === 'sent').reduce((s, r) => s + Number(r.total), 0);
    return { draft, sent, acceptedCount: accepted.length, acceptedValue, openValue };
  }, [rows]);

  const columns = [
    {
      key: 'quote_no', header: 'Quote No.', render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Icon name="quotations" className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="font-semibold text-slate-800">{r.quote_no}</span>
        </div>
      ),
    },
    { key: 'client_name', header: 'Client' },
    { key: 'quote_date', header: 'Date', render: (r) => formatDate(r.quote_date) },
    { key: 'valid_until', header: 'Valid Until', render: (r) => <ValidUntilCell value={r.valid_until} status={r.status} /> },
    { key: 'total', header: 'Total', render: (r) => <span className="font-semibold">AED {money(r.total)}</span> },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
    {
      key: 'actions', header: '', render: (r) => (
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/quotations/${r.id}`); }}>
          <Icon name="eye" className="h-4 w-4" /> View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Create and track price quotes for clients"
        actions={<Button onClick={() => navigate('/quotations/new')}><Icon name="plus" className="h-4 w-4" /> New Quotation</Button>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <StatCard label="Draft" value={stats.draft} tone="default" />
        <StatCard label="Sent · Awaiting Response" value={stats.sent} tone="orange" />
        <StatCard label="Open Pipeline Value" value={`AED ${money(stats.openValue)}`} sub="Draft + Sent" tone="blue" />
        <StatCard label="Accepted Value" value={`AED ${money(stats.acceptedValue)}`} sub={`${stats.acceptedCount} quotation(s)`} tone="green" />
      </div>

      <Tabs tabs={STATUS_TABS} active={status} onChange={setStatus} />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search by quote number or client…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        onRowClick={(r) => navigate(`/quotations/${r.id}`)}
        emptyMessage={status ? `No ${status} quotations.` : 'No quotations yet. Create your first one to get started.'}
      />
    </div>
  );
}
