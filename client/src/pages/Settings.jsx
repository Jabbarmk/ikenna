import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Button, Checkbox, Field, FormGrid, Input, ModalActions, Panel, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';

const EMPTY_TEMPLATE = { name: '', applies_to: 'both', body: '', is_default: false };

const APPLIES_TO_LABEL = { quotation: 'Quotation', invoice: 'Invoice', both: 'Both' };

function TermsTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);

  async function load() {
    setLoading(true);
    try {
      setTemplates(await api.get('/terms-templates'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_TEMPLATE);
    setModalOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ name: t.name, applies_to: t.applies_to, body: t.body, is_default: !!t.is_default });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/terms-templates/${editing.id}`, form);
        toast.success('Template updated');
      } else {
        await api.post('/terms-templates', form);
        toast.success('Template created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Delete the template "${t.name}"? Documents already using it keep their saved text.`)) return;
    try {
      await api.delete(`/terms-templates/${t.id}`);
      toast.success('Template deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Terms &amp; Conditions Templates</h3>
          <p className="mt-0.5 text-xs text-slate-500">Reusable terms you can pick when creating a quotation or sales invoice.</p>
        </div>
        <Button size="sm" onClick={openNew}><Icon name="plus" className="h-4 w-4" /> New Template</Button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">No templates yet. Create one to reuse on quotations and invoices.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {templates.map((t) => (
            <div key={t.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{t.name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{APPLIES_TO_LABEL[t.applies_to]}</span>
                  {!!t.is_default && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Default</span>}
                </div>
                <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs text-slate-500">{t.body}</p>
              </div>
              <div className="flex flex-shrink-0 gap-1.5">
                <button onClick={() => openEdit(t)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <Icon name="edit" className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(t)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Template' : 'New Template'} onClose={() => setModalOpen(false)} width="560px">
          <form onSubmit={handleSave}>
            <FormGrid>
              <Field label="Template Name *" full><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Standard Terms" /></Field>
              <Field label="Applies To">
                <Select value={form.applies_to} onChange={(e) => setForm({ ...form, applies_to: e.target.value })}>
                  <option value="both">Quotation &amp; Invoice</option>
                  <option value="quotation">Quotation only</option>
                  <option value="invoice">Invoice only</option>
                </Select>
              </Field>
              <div className="flex items-end pb-2.5">
                <Checkbox label="Set as default for this type" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} />
              </div>
              <Field label="Terms Text *" full>
                <Textarea rows={6} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="e.g. 1. Prices are valid for 30 days.&#10;2. Payment due within 15 days of invoice date.&#10;3. Goods once sold are not returnable." />
              </Field>
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Save Changes' : 'Create Template'}</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}
    </Panel>
  );
}

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

      <TermsTemplates />
    </div>
  );
}
