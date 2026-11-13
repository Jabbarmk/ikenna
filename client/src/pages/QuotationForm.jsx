import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import ClientSearchInput from '../components/ClientSearchInput';
import LineItemsEditor from '../components/LineItemsEditor';
import InvoicePrint from '../components/InvoicePrint';
import TermsPicker from '../components/TermsPicker';
import Icon from '../components/Icon';
import { Badge, Button, Field, FormGrid, Input, Panel, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { today, formatDate, money } from '../utils/format';

const EMPTY_ITEM = { product_id: null, description: '', qty: 1, unit_price: 0 };
const EDITABLE_STATUSES = ['draft', 'sent'];

export default function QuotationForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [client, setClient] = useState(null);
  const [quoteDate, setQuoteDate] = useState(today());
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [termsTemplateId, setTermsTemplateId] = useState(null);
  const [termsText, setTermsText] = useState('');
  const [existing, setExisting] = useState(null);
  const [settings, setSettings] = useState(null);
  const [editMode, setEditMode] = useState(isNew);

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);

  function populateFormFromExisting(data) {
    setClient({ id: data.client_id, name: data.client_name });
    setQuoteDate(data.quote_date?.slice(0, 10));
    setValidUntil(data.valid_until ? data.valid_until.slice(0, 10) : '');
    setNotes(data.notes || '');
    setItems(data.items.map((it) => ({ product_id: it.product_id, description: it.description, qty: it.qty, unit_price: it.unit_price })));
    setTermsTemplateId(data.terms_template_id || null);
    setTermsText(data.terms_text || '');
  }

  async function loadExisting() {
    const data = await api.get(`/quotations/${id}`);
    setExisting(data);
    populateFormFromExisting(data);
  }

  useEffect(() => {
    if (!isNew) loadExisting().catch((err) => toast.error(err.message));
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    if (!client) return toast.error('Please select a client');
    const validItems = items.filter((it) => it.description && Number(it.qty) > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid line item');

    try {
      const payload = {
        client_id: client.id, quote_date: quoteDate, valid_until: validUntil || null, notes, items: validItems,
        terms_template_id: termsTemplateId, terms_text: termsText || null,
      };
      if (isNew) {
        const res = await api.post('/quotations', payload);
        toast.success(`Quotation ${res.quote_no} created`);
        navigate(`/quotations/${res.id}`);
      } else {
        await api.put(`/quotations/${id}`, payload);
        toast.success('Quotation updated');
        setEditMode(false);
        loadExisting();
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleStatusChange(status) {
    try {
      await api.put(`/quotations/${id}/status`, { status });
      toast.success(`Marked as ${status}`);
      setExisting({ ...existing, status });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleConvert() {
    try {
      const res = await api.post(`/quotations/${id}/convert-to-invoice`, {});
      toast.success(`Converted to invoice ${res.invoice_no}`);
      navigate(`/sales/${res.invoiceId}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function cancelEdit() {
    if (existing) {
      populateFormFromExisting(existing);
      setEditMode(false);
    } else {
      navigate('/quotations');
    }
  }

  // ===== New quotation: always the editable form =====
  if (isNew) {
    return (
      <div>
        <PageHeader title="New Quotation" subtitle="Create a price quote for a client" />
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid wide>
              <Field label="Client *">
                <ClientSearchInput value={client?.name} onSelect={setClient} />
              </Field>
              <Field label="Quote Date *"><Input type="date" required value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></Field>
              <Field label="Valid Until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
              <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              <TermsPicker
                appliesTo="quotation"
                templateId={termsTemplateId}
                text={termsText}
                autoApplyDefault
                onChange={({ terms_template_id, terms_text }) => { setTermsTemplateId(terms_template_id); setTermsText(terms_text); }}
              />
            </FormGrid>

            <div className="mt-5">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/quotations')}>Cancel</Button>
              <Button type="submit"><Icon name="check" className="h-4 w-4" /> Create Quotation</Button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  if (!existing) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading…</div>;

  const canEdit = EDITABLE_STATUSES.includes(existing.status);

  // ===== Existing quotation: edit mode =====
  if (editMode) {
    return (
      <div>
        <PageHeader title={`Edit Quotation ${existing.quote_no}`} subtitle="Update client, dates, notes or line items" />
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid wide>
              <Field label="Client *">
                <ClientSearchInput value={client?.name} onSelect={setClient} />
              </Field>
              <Field label="Quote Date *"><Input type="date" required value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></Field>
              <Field label="Valid Until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
              <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
              <TermsPicker
                appliesTo="quotation"
                templateId={termsTemplateId}
                text={termsText}
                onChange={({ terms_template_id, terms_text }) => { setTermsTemplateId(terms_template_id); setTermsText(terms_text); }}
              />
            </FormGrid>

            <div className="mt-5">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel</Button>
              <Button type="submit"><Icon name="check" className="h-4 w-4" /> Save Changes</Button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  // ===== Existing quotation: view mode (default) =====
  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Quotation ${existing.quote_no}`}
          subtitle={`${existing.client_name} · ${formatDate(existing.quote_date)}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge value={existing.status} />
              {existing.status !== 'accepted' && (
                <Select className="w-auto" value={existing.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  {['draft', 'sent', 'accepted', 'rejected', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              )}
              {canEdit && (
                <Button variant="secondary" onClick={() => setEditMode(true)}><Icon name="edit" className="h-4 w-4" /> Edit</Button>
              )}
              {existing.status !== 'accepted' && (
                <Button variant="secondary" onClick={handleConvert}>Convert to Invoice</Button>
              )}
              <Button variant="ghost" onClick={() => window.print()}><Icon name="download" className="h-4 w-4" /> Print</Button>
            </div>
          }
        />
      </div>

      <div className="no-print mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Client</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-800">{existing.client_name}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Quote Date</div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{formatDate(existing.quote_date)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Valid Until</div>
          <div className="mt-1 text-sm font-semibold text-slate-800">{existing.valid_until ? formatDate(existing.valid_until) : '—'}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-medium text-slate-500">Total Value</div>
          <div className="mt-1 text-sm font-bold text-brand-600">AED {money(existing.total)}</div>
        </div>
      </div>

      <Panel className="print:border-0 print:p-0 print:shadow-none">
        <InvoicePrint
          settings={settings}
          docType="QUOTATION"
          docNo={existing.quote_no}
          docDate={existing.quote_date}
          party={{ name: existing.client_name, company: existing.client_company, address: existing.client_address, phone: existing.client_phone, trn: existing.client_trn }}
          items={existing.items}
          subtotal={existing.subtotal}
          vatAmount={existing.vat_amount}
          total={existing.total}
          extraNote={existing.valid_until ? `Valid until: ${formatDate(existing.valid_until)}` : undefined}
          termsText={existing.terms_text}
        />
      </Panel>
    </div>
  );
}
