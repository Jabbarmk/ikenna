import { useEffect, useRef, useState } from 'react';
import DropdownPortal from './DropdownPortal';
import { api } from '../api/client';

export default function InvoiceSearchInput({ value, onSelect }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        const data = await api.get('/sales', { q: query, status: undefined });
        setResults(data.filter((d) => d.status !== 'cancelled').slice(0, 15));
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div ref={boxRef}>
      <input
        ref={inputRef}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        value={query}
        placeholder="Search invoice number or client…"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      <DropdownPortal anchorRef={inputRef} open={open && results.length > 0}>
        {results.map((inv) => (
          <div
            key={inv.id}
            className="cursor-pointer border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-slate-50"
            onMouseDown={() => { onSelect(inv); setQuery(`${inv.invoice_no} — ${inv.client_name}`); setOpen(false); }}
          >
            <div className="text-sm font-semibold text-slate-800">{inv.invoice_no} — {inv.client_name}</div>
            <div className="mt-0.5 text-xs text-slate-400">Total: {inv.total} · {inv.status}</div>
          </div>
        ))}
      </DropdownPortal>
    </div>
  );
}
