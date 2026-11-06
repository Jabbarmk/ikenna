import ProductSearchInput from './ProductSearchInput';
import Icon from './Icon';
import { money } from '../utils/format';

export default function LineItemsEditor({ items, onChange, priceLabel = 'Rate', priceField = 'unit_price', vatRate = 5 }) {
  function updateItem(idx, patch) {
    const next = items.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }

  function addRow() {
    onChange([...items, { product_id: null, description: '', qty: 1, [priceField]: 0 }]);
  }

  function removeRow(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it[priceField] || 0), 0);
  const vatAmount = Math.round(subtotal * (vatRate / 100) * 100) / 100;
  const total = subtotal + vatAmount;

  return (
    <div className="min-w-0 w-full">
      <div className="w-full min-w-0 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="w-10 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">#</th>
              <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Description</th>
              <th className="w-24 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Qty</th>
              <th className="w-28 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">{priceLabel}</th>
              <th className="w-28 px-2 py-1.5 text-left text-[11px] font-semibold uppercase text-slate-400">Amount</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td className="px-2 py-1.5 text-sm text-slate-500">{idx + 1}</td>
                <td className="px-2 py-1.5">
                  <ProductSearchInput
                    value={it.description}
                    onSelect={(p) => updateItem(idx, {
                      product_id: p.id,
                      description: p.description,
                      [priceField]: priceField === 'unit_cost' ? Number(p.cost_price) : Number(p.sale_price),
                    })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    value={it.qty}
                    min="0"
                    step="any"
                    onChange={(e) => updateItem(idx, { qty: e.target.value })}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    value={it[priceField]}
                    min="0"
                    step="any"
                    onChange={(e) => updateItem(idx, { [priceField]: e.target.value })}
                  />
                </td>
                <td className="px-2 py-3.5 text-sm font-semibold text-slate-800">{money(Number(it.qty || 0) * Number(it[priceField] || 0))}</td>
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-500 hover:border-brand-400 hover:text-brand-600"
      >
        <Icon name="plus" className="h-3.5 w-3.5" /> Add line
      </button>

      <div className="ml-auto mt-4 w-full max-w-xs">
        <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="flex justify-between py-1.5 text-sm text-slate-500"><span>VAT ({vatRate}%)</span><span>{money(vatAmount)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-bold text-slate-900"><span>Grand Total</span><span>{money(total)}</span></div>
      </div>
    </div>
  );
}
