import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import ClientSearchInput from '../components/ClientSearchInput';
import LineItemsEditor from '../components/LineItemsEditor';
import Modal from '../components/Modal';
import { Button, Field, FormGrid, Input, ModalActions, Panel, Select, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { today, money, formatDate } from '../utils/format';

const EMPTY_ITEM = { product_id: null, description: '', qty: 1, unit_cost: 0 };

export default function PurchaseForm() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [supplier, setSupplier] = useState(null);
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [existing, setExisting] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  async function loadExisting() {
    const data = await api.get(`/purchases/${id}`);
    setExisting(data);
    setSupplier({ id: data.supplier_id, name: data.supplier_name });
    setPurchaseDate(data.purchase_date?.slice(0, 10));
    setNotes(data.notes || '');
    setItems(data.items.map((it) => ({ product_id: it.product_id, description: it.product_description, qty: it.qty, unit_cost: it.unit_cost })));
  }

  useEffect(() => {
    if (!isNew) loadExisting().catch((err) => toast.error(err.message));
  }, [id]);

  async function handleSave(e) {
    e.preventDefault();
    if (!supplier) return toast.error('Please select a supplier');
    const validItems = items.filter((it) => it.product_id && Number(it.qty) > 0);
    if (validItems.length === 0) return toast.error('Add at least one valid line item with a matching stock product');

    try {
      const res = await api.post('/purchases', {
        supplier_id: supplier.id, purchase_date: purchaseDate, notes, items: validItems,
      });
      toast.success(`Purchase ${res.purchase_no} recorded and stock updated`);
      navigate(`/purchases/${res.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel this purchase? Stock already received will be reversed.')) return;
    try {
      await api.post(`/purchases/${id}/cancel`, {});
      toast.success('Purchase cancelled');
      loadExisting();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handlePay(e) {
    e.preventDefault();
    try {
      await api.post('/accounts/payments', {
        party_type: 'supplier', party_id: existing.supplier_id, direction: 'out',
        amount: Number(payAmount), method: payMethod, ref_type: 'purchase', ref_id: existing.id,
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
        <PageHeader title="New Purchase" subtitle="Record stock received from a supplier" />
        <Panel>
          <form onSubmit={handleSave}>
            <FormGrid wide>
              <Field label="Supplier *">
                <ClientSearchInput value={supplier?.name} onSelect={setSupplier} endpoint="/suppliers" placeholder="Search supplier…" />
              </Field>
              <Field label="Purchase Date *"><Input type="date" required value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} /></Field>
              <Field label="Notes" full><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
            </FormGrid>
            <div className="mt-5">
              <LineItemsEditor items={items} onChange={setItems} priceLabel="Unit Cost" priceField="unit_cost" />
            </div>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button type="button" variant="ghost" onClick={() => navigate('/purchases')}>Cancel</Button>
              <Button type="submit">Record Purchase &amp; Receive Stock</Button>
            </div>
          </form>
        </Panel>
      </div>
    );
  }

  if (!existing) return <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading…</div>;

  return (
    <div>
      <PageHeader
        title={`Purchase ${existing.purchase_no}`}
        subtitle={`${existing.supplier_name} · ${formatDate(existing.purchase_date)} · Status: ${existing.status}`}
        actions={existing.status !== 'cancelled' && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPayModalOpen(true)}>Record Payment</Button>
            <Button variant="ghost" onClick={handleCancel}>Cancel Purchase</Button>
          </div>
        )}
      />

      <Panel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Product</th>
                <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Qty</th>
                <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Unit Cost</th>
                <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              {existing.items.map((it) => (
                <tr key={it.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-2 py-2.5 text-sm">{it.code} — {it.product_description}</td>
                  <td className="px-2 py-2.5 text-sm">{it.qty}</td>
                  <td className="px-2 py-2.5 text-sm">{money(it.unit_cost)}</td>
                  <td className="px-2 py-2.5 text-sm font-medium">{money(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-auto mt-4 max-w-xs">
          <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Subtotal</span><span>{money(existing.subtotal)}</span></div>
          <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>VAT</span><span>{money(existing.vat_amount)}</span></div>
          <div className="flex justify-between border-t border-slate-200 py-1.5 pt-2.5 text-base font-bold text-slate-900"><span>Total</span><span>{money(existing.total)}</span></div>
          <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Paid</span><span>{money(existing.paid_amount)}</span></div>
          <div className="flex justify-between py-1.5 text-sm font-semibold text-slate-700"><span>Balance</span><span>{money(existing.total - existing.paid_amount)}</span></div>
        </div>
      </Panel>

      {payModalOpen && (
        <Modal title="Record Payment to Supplier" onClose={() => setPayModalOpen(false)}>
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
