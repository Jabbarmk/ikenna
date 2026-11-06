import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Button, Field, FormGrid, Input, ModalActions, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';

const EMPTY_FORM = { name: '', company: '', phone: '', email: '', address: '', trn: '', opening_balance: 0 };

export default function Clients() {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function load() {
    setLoading(true);
    try {
      setClients(await api.get('/clients', { q }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(client) {
    setEditing(client);
    setForm({
      name: client.name || '', company: client.company || '', phone: client.phone || '',
      email: client.email || '', address: client.address || '', trn: client.trn || '',
      opening_balance: client.opening_balance || 0,
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/clients/${editing.id}`, form);
        toast.success('Client updated');
      } else {
        await api.post('/clients', form);
        toast.success('Client created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'company', header: 'Company' },
    { key: 'phone', header: 'Phone' },
    { key: 'email', header: 'Email' },
    { key: 'trn', header: 'TRN' },
    { key: 'opening_balance', header: 'Opening Balance', render: (r) => money(r.opening_balance) },
  ];

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Customer accounts for quotations, sales and invoicing"
        actions={<Button onClick={openNew}><Icon name="plus" className="h-4 w-4" /> New Client</Button>}
      />

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input className="max-w-xs" placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <DataTable columns={columns} rows={clients} loading={loading} onRowClick={openEdit} emptyMessage="No clients yet. Add your first client or convert a lead." />

      {modalOpen && (
        <Modal title={editing ? 'Edit Client' : 'New Client'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <FormGrid>
              <Field label="Name *"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Company"><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
              <Field label="TRN"><Input value={form.trn} onChange={(e) => setForm({ ...form, trn: e.target.value })} /></Field>
              <Field label="Opening Balance"><Input type="number" step="0.01" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></Field>
              <Field label="Address" full><Textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Save Changes' : 'Create Client'}</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}
    </div>
  );
}
