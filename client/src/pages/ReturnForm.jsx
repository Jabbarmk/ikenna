import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import InvoiceSearchInput from '../components/InvoiceSearchInput';
import InvoicePrint from '../components/InvoicePrint';
import { Button, Field, FormGrid, Input, Panel } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { today, money, formatDate } from '../utils/format';

export default function ReturnForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [returnDate, setReturnDate] = useState(today());
  const [reason, setReason] = useState('');
  const [items, setItems] = useState([]);
  const [existing, setExisting] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api.get('/settings').then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew) {
      api.get(`/returns/${id}`).then(setExisting).catch((err) => toast.error(err.message));
    }
  }, [id]);

  async function handleInvoiceSelect(inv) {
    setInvoice(inv);
    const detail = await api.get(`/sales/${inv.id}`);
    setInvoiceDetail(detail);
    setItems(detail.items.map((it) => ({ product_id: it.product_id, description: it.description, qty: 0, max_qty: it.qty, unit_price: it.unit_price })));
  }

  function updateQty(idx, qty) {
    const next = items.slice();
    next[idx] = { ...next[idx], qty };
    setItems(next);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!invoice) return toast.error('Select the original invoice first');
    const validItems = items.filter((it) => Number(it.qty) > 0);
    if (validItems.length === 0) return toast.error('Enter a return quantity for at least one item');

    try {
      const res = await api.post('/returns', {
        invoice_id: invoice.id, return_date: returnDate, reason, items: validItems,
      });
      toast.success(`Return ${res.return_no} recorded, stock restored`);
      navigate(`/returns/${res.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (isNew) {
    const subtotal = items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.unit_price), 0);
    const vat = Math.round(subtotal * 0.05 * 100) / 100;
    return (
      <div>
        <PageHeader title="New Sales Return" subtitle="Return items against an existing sales invoice" />
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid>
              <Field label="Original Invoice *" full>
                <InvoiceSearchInput onSelect={handleInvoiceSelect} />
              </Field>
              <Field label="Return Date *"><Input type="date" required value={returnDate} onChange={(e) => setReturnDate(e.target.value)} /></Field>
              <Field label="Reason" full><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. damaged goods, wrong item" /></Field>
            </FormGrid>

            {invoiceDetail && (
              <div className="mt-5">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                      <tr>
                        <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Description</th>
                        <th className="w-28 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Invoiced Qty</th>
                        <th className="w-32 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Return Qty</th>
                        <th className="w-24 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Rate</th>
                        <th className="w-28 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={idx} className="border-b border-slate-100 last:border-b-0">
                          <td className="px-2 py-2 text-sm">{it.description}</td>
                          <td className="px-2 py-2 text-sm">{it.max_qty}</td>
                          <td className="px-2 py-1.5">
                            <Input type="number" min="0" max={it.max_qty} step="any" value={it.qty} onChange={(e) => updateQty(idx, e.target.value)} />
                          </td>
                          <td className="px-2 py-2 text-sm">{money(it.unit_price)}</td>
                          <td className="px-2 py-2 text-sm font-medium">{money(Number(it.qty || 0) * Number(it.unit_price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ml-auto mt-4 max-w-xs">
                  <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>VAT (5%)</span><span>{money(vat)}</span></div>
                  <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900"><span>Total Credit</span><span>{money(subtotal + vat)}</span></div>
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/returns')}>Cancel</Button>
              <Button type="submit" disabled={!invoiceDetail}>Create Return &amp; Restock</Button>
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
          title={`Return ${existing.return_no}`}
          subtitle={`Against invoice ${existing.invoice_no} · ${existing.client_name} · ${formatDate(existing.return_date)}`}
          actions={<Button variant="ghost" onClick={() => window.print()}>Print</Button>}
        />
      </div>
      <Panel className="print:border-0 print:p-0 print:shadow-none">
        <InvoicePrint
          settings={settings}
          docType="CREDIT NOTE"
          docNo={existing.return_no}
          docDate={existing.return_date}
          party={{ name: existing.client_name, company: existing.client_company, address: existing.client_address, trn: existing.client_trn }}
          items={existing.items}
          subtotal={existing.subtotal}
          vatAmount={existing.vat_amount}
          total={existing.total}
          extraNote={existing.reason ? `Reason: ${existing.reason}` : undefined}
        />
      </Panel>
    </div>
  );
}
