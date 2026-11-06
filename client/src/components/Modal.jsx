import Icon from './Icon';

export default function Modal({ title, onClose, children, width = '640px' }) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-slate-900/45 p-4 sm:p-8"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mt-4 w-full rounded-2xl bg-white shadow-2xl sm:mt-8"
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
