import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import ClientSearchInput from '../components/ClientSearchInput';
import LineItemsEditor from '../components/LineItemsEditor';
import InvoicePrint from '../components/InvoicePrint';
import Icon from '../components/Icon';
import { Button, Field, FormGrid, Input, Panel, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { today } from '../utils/format';

const EMPTY_ITEM = { product_id: null, description: '', qty: 1, unit_price: 0 };

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
  const [existing, setExisting] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew) {
      api.get(`/quotations/${id}`).then((data) => {
        setExisting(data);
        setClient({ id: data.client_id, name: data.client_name });
        setQuoteDate(data.quote_date?.slice(0, 10));
        setValidUntil(data.valid_until ? data.valid_until.slice(0, 10) : '');
        setNotes(data.notes || '');
        setItems(data.items.map((it) => ({ product_id: it.product_id, description: it.description, qty: it.qty, unit_price: it.unit_price })));
      }).catch((err) => toast.error(err.message));
    }
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    if (!client) return toast.error('Please select a client');
    const validItems = items.filter((it) => it.description && Number(it.qty) > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid line item');

    try {
      const payload = { client_id: client.id, quote_date: quoteDate, valid_until: validUntil || null, notes, items: validItems };
      if (isNew) {
        const res = await api.post('/quotations', payload);
        toast.success(`Quotation ${res.quote_no} created`);
        navigate(`/quotations/${res.id}`);
      } else {
        await api.put(`/quotations/${id}`, payload);
        toast.success('Quotation updated');
        navigate(`/quotations/${id}`);
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

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={isNew ? 'New Quotation' : `Quotation ${existing?.quote_no || ''}`}
          subtitle={existing ? `Status: ${existing.status}` : 'Create a price quote for a client'}
          actions={!isNew && existing ? (
            <div className="flex flex-wrap items-center gap-2">
              {existing.status !== 'accepted' && (
                <Select className="w-auto" value={existing.status} onChange={(e) => handleStatusChange(e.target.value)}>
                  {['draft', 'sent', 'accepted', 'rejected', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              )}
              {existing.status !== 'accepted' && (
                <Button variant="secondary" onClick={handleConvert}>Convert to Invoice</Button>
              )}
              <Button variant="ghost" onClick={() => window.print()}>Print</Button>
            </div>
          ) : null}
        />
      </div>

      <div className="no-print">
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid wide>
              <Field label="Client *">
                <ClientSearchInput value={client?.name} onSelect={setClient} />
              </Field>
              <Field label="Quote Date *"><Input type="date" required value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} /></Field>
              <Field label="Valid Until"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></Field>
              <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            </FormGrid>

            <div className="mt-5">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>

            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/quotations')}>Cancel</Button>
              <Button type="submit"><Icon name="check" className="h-4 w-4" /> {isNew ? 'Create Quotation' : 'Save Changes'}</Button>
            </div>
          </form>
        </Panel>
      </div>

      {!isNew && existing && (
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
            extraNote={existing.valid_until ? `Valid until: ${existing.valid_until.slice(0, 10)}` : undefined}
          />
        </Panel>
      )}
    </div>
  );
}
