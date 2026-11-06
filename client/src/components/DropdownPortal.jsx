import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function DropdownPortal({ anchorRef, open, children }) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;

    function updateRect() {
      const r = anchorRef.current.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }

    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [open, anchorRef]);

  if (!open || !rect) return null;

  return createPortal(
    <div
      className="fixed z-[200] max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
      style={{ top: rect.top, left: rect.left, width: rect.width }}
    >
      {children}
    </div>,
    document.body
  );
}
