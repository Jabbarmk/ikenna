import { useEffect, useState } from 'react';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { Button, Checkbox, Field, FormGrid, Input, ModalActions } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { money } from '../utils/format';

const EMPTY_FORM = { code: '', description: '', unit: 'EA', category: '', cost_price: 0, sale_price: 0, reorder_level: 0, qty_on_hand: 0 };

export default function Stock() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const pageSize = 50;

  async function load() {
    setLoading(true);
    try {
      const data = await api.get('/products', { q, lowStock: lowStock ? 'true' : undefined, page, pageSize });
      setProducts(data.items);
      setTotal(data.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [q, lowStock, page]);
  useEffect(() => { setPage(1); }, [q, lowStock]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(product) {
    setEditing(product);
    setForm({
      code: product.code, description: product.description, unit: product.unit,
      category: product.category || '', cost_price: product.cost_price, sale_price: product.sale_price,
      reorder_level: product.reorder_level, qty_on_hand: product.qty_on_hand,
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/products/${editing.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdjust(e) {
    e.preventDefault();
    try {
      await api.post(`/products/${adjustTarget.id}/adjust`, { qty: Number(adjustQty), note: adjustNote });
      toast.success('Stock adjusted');
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustNote('');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    { key: 'code', header: 'Code' },
    { key: 'description', header: 'Description' },
    { key: 'unit', header: 'Unit' },
    { key: 'qty_on_hand', header: 'Qty on Hand', render: (r) => (
      <span className={Number(r.qty_on_hand) <= Number(r.reorder_level) ? 'font-bold text-rose-600' : ''}>{r.qty_on_hand}</span>
    ) },
    { key: 'cost_price', header: 'Cost', render: (r) => money(r.cost_price) },
    { key: 'sale_price', header: 'Sale Price', render: (r) => money(r.sale_price) },
    {
      key: 'actions', header: '', render: (r) => (
        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setAdjustTarget(r); }}>
          Adjust
        </Button>
      ),
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle={`${total} products in catalog`}
        actions={<Button onClick={openNew}><Icon name="plus" className="h-4 w-4" /> New Product</Button>}
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-3.5">
        <Input className="max-w-xs" placeholder="Search by code or description…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Checkbox label="Low stock only" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
      </div>

      <DataTable columns={columns} rows={products} loading={loading} onRowClick={openEdit} emptyMessage="No products found." />

      {total > pageSize && (
        <div className="mt-3.5 flex items-center gap-3 text-sm text-slate-500">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span>Page {page} of {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {modalOpen && (
        <Modal title={editing ? 'Edit Product' : 'New Product'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave}>
            <FormGrid>
              <Field label="Code *"><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
              <Field label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
              <Field label="Description *" full><Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
              <Field label="Reorder Level"><Input type="number" step="any" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></Field>
              <Field label="Cost Price"><Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></Field>
              <Field label="Sale Price"><Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></Field>
              {!editing && (
                <Field label="Opening Qty"><Input type="number" step="any" value={form.qty_on_hand} onChange={(e) => setForm({ ...form, qty_on_hand: e.target.value })} /></Field>
              )}
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">{editing ? 'Save Changes' : 'Create Product'}</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}

      {adjustTarget && (
        <Modal title={`Adjust Stock — ${adjustTarget.description}`} onClose={() => setAdjustTarget(null)}>
          <form onSubmit={handleAdjust}>
            <FormGrid>
              <div className="col-span-2 text-xs text-slate-500">Current quantity: {adjustTarget.qty_on_hand} {adjustTarget.unit}</div>
              <Field label="Adjustment (use negative to reduce)" full>
                <Input type="number" step="any" required value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </Field>
              <Field label="Reason / Note" full>
                <Input value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="e.g. stock count correction, damage" />
              </Field>
              <ModalActions>
                <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)}>Cancel</Button>
                <Button type="submit">Apply Adjustment</Button>
              </ModalActions>
            </FormGrid>
          </form>
        </Modal>
      )}
    </div>
  );
}
