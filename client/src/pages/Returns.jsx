import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Icon from '../components/Icon';
import { Button, Input } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money, formatDate } from '../utils/format';

export default function Returns() {
  const toast = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRows(await api.get('/returns', { q }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q]);

  const columns = [
    { key: 'return_no', header: 'Return No.' },
    { key: 'invoice_no', header: 'Against Invoice' },
    { key: 'client_name', header: 'Client' },
    { key: 'return_date', header: 'Date', render: (r) => formatDate(r.return_date) },
    { key: 'total', header: 'Total', render: (r) => money(r.total) },
  ];

  return (
    <div>
      <PageHeader
        title="Sales Returns"
        subtitle="Credit notes for returned goods"
        actions={<Button onClick={() => navigate('/returns/new')}><Icon name="plus" className="h-4 w-4" /> New Return</Button>}
      />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search returns…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable columns={columns} rows={rows} loading={loading} onRowClick={(r) => navigate(`/returns/${r.id}`)} emptyMessage="No sales returns yet." />
    </div>
  );
}
