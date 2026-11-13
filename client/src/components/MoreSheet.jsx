import IconGrid from './IconGrid';
import Icon from './Icon';

export default function MoreSheet({ modules, onClose }) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-end bg-slate-900/45"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">More Modules</h2>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <IconGrid modules={modules} onNavigate={onClose} />
      </div>
    </div>
  );
}
