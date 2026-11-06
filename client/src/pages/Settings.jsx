import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import { Button, Field, FormGrid, Input, ModalActions, Panel, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const toast = useToast();
  const [form, setForm] = useState(null);

  useEffect(() => {
    api.get('/settings').then(setForm).catch((err) => toast.error(err.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    try {
      await api.put('/settings', form);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (!form) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading…</div>;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Company details used on printed invoices and quotations" />
      <Panel>
        <form onSubmit={handleSave}>
          <FormGrid>
            <Field label="Company Name" full><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="TRN"><Input value={form.trn || ''} onChange={(e) => setForm({ ...form, trn: e.target.value })} /></Field>
            <Field label="Peppol ID"><Input value={form.peppol_id || ''} onChange={(e) => setForm({ ...form, peppol_id: e.target.value })} placeholder="0235:1006082182" /></Field>
            <Field label="VAT Rate (%)"><Input type="number" step="0.01" value={form.vat_rate} onChange={(e) => setForm({ ...form, vat_rate: e.target.value })} /></Field>
            <Field label="Phone"><Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email"><Input value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="P.O. Box"><Input value={form.po_box || ''} onChange={(e) => setForm({ ...form, po_box: e.target.value })} /></Field>
            <Field label="Address" full><Textarea rows={2} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <ModalActions>
              <Button type="submit">Save Settings</Button>
            </ModalActions>
          </FormGrid>
        </form>
      </Panel>
    </div>
  );
}
