import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import ClientSearchInput from '../components/ClientSearchInput';
import LineItemsEditor from '../components/LineItemsEditor';
import InvoicePrint from '../components/InvoicePrint';
import Modal from '../components/Modal';
import { Button, Checkbox, Field, FormGrid, Input, ModalActions, Panel, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { today, money, formatDate } from '../utils/format';

const EMPTY_ITEM = { product_id: null, description: '', qty: 1, unit_price: 0 };

export default function SalesForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [client, setClient] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [allowNegative, setAllowNegative] = useState(false);
  const [existing, setExisting] = useState(null);
  const [settings, setSettings] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);

  async function loadExisting() {
    const data = await api.get(`/sales/${id}`);
    setExisting(data);
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
      const res = await api.post('/sales', {
        client_id: client.id, invoice_date: invoiceDate, notes, items: validItems, allow_negative_stock: allowNegative,
      });
      toast.success(`Invoice ${res.invoice_no} created`);
      navigate(`/sales/${res.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this invoice? Stock will be restored.')) return;
    try {
      await api.post(`/sales/${id}/cancel`, {});
      toast.success('Invoice cancelled');
      loadExisting();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    try {
      await api.post('/accounts/payments', {
        party_type: 'client', party_id: existing.client_id, direction: 'in',
        amount: Number(payAmount), method: payMethod, ref_type: 'sales_invoice', ref_id: existing.id,
        payment_date: today(),
      });
      toast.success('Payment recorded');
      setPayModalOpen(false);
      setPayAmount('');
      loadExisting();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (isNew) {
    return (
      <div>
        <PageHeader title="New Sales Invoice" subtitle="Create a UAE tax invoice for a client" />
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid wide>
              <Field label="Client *">
                <ClientSearchInput value={client?.name} onSelect={setClient} />
              </Field>
              <Field label="Invoice Date *"><Input type="date" required value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></Field>
              <div className="flex items-end pb-2.5">
                <Checkbox label="Allow selling beyond available stock" checked={allowNegative} onChange={(e) => setAllowNegative(e.target.checked)} />
              </div>
              <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            </FormGrid>
            <div className="mt-5">
              <LineItemsEditor items={items} onChange={setItems} />
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/sales')}>Cancel</Button>
              <Button type="submit">Create Invoice</Button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  if (!existing) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading…</div>;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title={`Invoice ${existing.invoice_no}`}
          subtitle={`${existing.client_name} · ${formatDate(existing.invoice_date)} · Status: ${existing.status}`}
          actions={existing.status !== 'cancelled' && (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => setPayModalOpen(true)}>Record Payment</Button>
              <Button variant="ghost" onClick={() => window.print()}>Print Invoice</Button>
              <Button variant="ghost" onClick={handleCancel}>Cancel Invoice</Button>
            </div>
          )}
        />
      </div>

      <Panel className="print:border-0 print:p-0 print:shadow-none">
        <InvoicePrint
          settings={settings}
          docType="TAX INVOICE"
          docNo={existing.invoice_no}
          docDate={existing.invoice_date}
          party={{ name: existing.client_name, company: existing.client_company, address: existing.client_address, phone: existing.client_phone, trn: existing.client_trn }}
          items={existing.items}
          subtotal={existing.subtotal}
          vatAmount={existing.vat_amount}
          total={existing.total}
        />
      </Panel>

      <Panel className="no-print">
        <div className="ml-auto max-w-xs">
          <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Paid</span><span>{money(existing.paid_amount)}</span></div>
          <div className="flex justify-between py-1.5 text-sm font-semibold text-slate-700"><span>Balance Due</span><span>{money(existing.total - existing.paid_amount)}</span></div>
        </div>
      </Panel>

      {payModalOpen && (
        <Modal title="Record Payment from Client" onClose={() => setPayModalOpen(false)}>
          <form onSubmit={handlePay}>
            <FormGrid>
              <Field label="Amount *"><Input type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></Field>
              <Field label="Method">
                <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  {['cash', 'bank', 'card', 'cheque', 'other'].map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setPayModalOpen(false)}>Cancel</Button>
                <Button type="submit">Record Payment</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}
    </div>
  );
}
