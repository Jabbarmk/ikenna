import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Icon from '../components/Icon';
import { Badge, Button, Input, Select } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, formatDate } from '../utils/format';

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

  const columns = [
    { key: 'quote_no', header: 'Quote No.' },
    { key: 'client_name', header: 'Client' },
    { key: 'quote_date', header: 'Date', render: (r) => formatDate(r.quote_date) },
    { key: 'total', header: 'Total', render: (r) => money(r.total) },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Create and track price quotes for clients"
        actions={<Button onClick={() => navigate('/quotations/new')}><Icon name="plus" className="h-4 w-4" /> New Quotation</Button>}
      />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search quotations…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'sent', 'accepted', 'rejected', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(r) => navigate(`/quotations/${r.id}`)} emptyMessage="No quotations yet." />
    </div>
  );
}
