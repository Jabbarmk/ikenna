import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Icon from '../components/Icon';
import { Badge, Button, Input, Select } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, formatDate } from '../utils/format';

export default function Sales() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRows(await api.get('/sales', { q, status }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, status]);

  const columns = [
    { key: 'invoice_no', header: 'Invoice No.' },
    { key: 'client_name', header: 'Client' },
    { key: 'invoice_date', header: 'Date', render: (r) => formatDate(r.invoice_date) },
    { key: 'total', header: 'Total', render: (r) => money(r.total) },
    { key: 'paid_amount', header: 'Paid', render: (r) => money(r.paid_amount) },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        subtitle="Tax invoices issued to clients"
        actions={<Button onClick={() => navigate('/sales/new')}><Icon name="plus" className="h-4 w-4" /> New Invoice</Button>}
      />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search invoices…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['unpaid', 'partial', 'paid', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(r) => navigate(`/sales/${r.id}`)} emptyMessage="No sales invoices yet." />
    </div>
  );
}
