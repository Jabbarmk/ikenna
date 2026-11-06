import { useEffect, useRef, useState } from 'react';
import DropdownPortal from './DropdownPortal';
import { api } from '../api/client';

export default function ClientSearchInput({ value, onSelect, placeholder = 'Search client…', endpoint = '/clients' }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

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
        const data = await api.get(endpoint, { q: query });
        setResults(data);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(handle);
  }, [query, endpoint]);

  return (
    <div ref={boxRef}>
      <input
        ref={inputRef}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        value={query}
        placeholder={placeholder}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      <DropdownPortal anchorRef={inputRef} open={open && results.length > 0}>
        {results.map((c) => (
          <div
            key={c.id}
            className="cursor-pointer border-b border-slate-100 px-3 py-2.5 last:border-b-0 hover:bg-slate-50"
            onMouseDown={() => {
              onSelect(c);
              setQuery(c.name);
              setOpen(false);
            }}
          >
            <div className="text-sm font-semibold text-slate-800">{c.name}{c.company ? ` (${c.company})` : ''}</div>
            <div className="mt-0.5 text-xs text-slate-400">{c.phone || c.email || ''}</div>
          </div>
        ))}
      </DropdownPortal>
    </div>
  );
}
