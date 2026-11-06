import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Badge, Button, Field, FormGrid, Input, ModalActions, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'lost', 'converted'];
const EMPTY_FORM = { name: '', phone: '', email: '', company: '', source: '', status: 'new', notes: '' };

export default function Leads() {
  const toast = useToast();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/leads', { q, status });
      setLeads(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, status]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(lead) {
    setEditing(lead);
    setForm({
      name: lead.name || '', phone: lead.phone || '', email: lead.email || '',
      company: lead.company || '', source: lead.source || '', status: lead.status, notes: lead.notes || '',
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/leads/${editing.id}`, form);
        toast.success('Lead updated');
      } else {
        await api.post('/leads', form);
        toast.success('Lead created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleConvert(lead) {
    try {
      await api.post(`/leads/${lead.id}/convert`, {});
      toast.success(`${lead.name} converted to client`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'company', header: 'Company' },
    { key: 'phone', header: 'Phone' },
    { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions', header: '', render: (r) => (
        r.status !== 'converted' ? (
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleConvert(r); }}>
            Convert to Client
          </Button>
        ) : <span className="text-xs text-slate-400">Converted</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Prospective customers to follow up and convert"
        actions={<Button onClick={openNew}><Icon name="plus" className="h-4 w-4" /> New Lead</Button>}
      />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search leads…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      <DataTable columns={columns} rows={leads} loading={loading} onRowClick={openEdit} emptyMessage="No leads yet. Add your first lead." />

      {modalOpen && (
        <Modal title={editing ? 'Edit Lead' : 'New Lead'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <FormGrid>
              <Field label="Name *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="Source"><Input placeholder="e.g. referral, walk-in, website" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field>
              <Field label="Status">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <Field label="Notes" full><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Save Changes' : 'Create Lead'}</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}
    </div>
  );
}
