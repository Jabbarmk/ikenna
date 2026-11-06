import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-600', icon: 'check' },
  error: { bg: 'bg-rose-600', icon: 'alert' },
  info: { bg: 'bg-brand-600', icon: 'bell' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => remove(id), type === 'error' ? 6000 : 4000);
  }, [remove]);

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed left-1/2 top-4 z-[300] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2.5 px-4 sm:top-6">
        {toasts.map((t) => {
          const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
          return (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl ${style.bg} px-4 py-3.5 text-sm font-medium text-white shadow-xl ring-1 ring-black/5`}
            >
              <Icon name={style.icon} className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <Icon name="close" className="mt-0.5 h-4 w-4 flex-shrink-0 opacity-70" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
