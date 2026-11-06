import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';

export default function Login() {
  const { login, bootstrap } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [needsSetup, setNeedsSetup] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/auth/needs-setup').then((d) => setNeedsSetup(d.needsSetup)).catch(() => setNeedsSetup(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      if (needsSetup) {
        await bootstrap(name, email, password);
        toast.success('Admin account created');
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-brand-900 p-4">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-8 shadow-2xl">
        <div>
          <div className="text-base font-extrabold tracking-wide text-slate-900">IKENNA KAMAL</div>
          <div className="mb-6 text-xs font-medium text-slate-400">General Trading L.L.C. — Inventory System</div>
          <h2 className="text-base font-semibold text-slate-900">{needsSetup ? 'Create Admin Account' : 'Sign in'}</h2>
        </div>

        {needsSetup && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Full name</span>
            <input
              className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Email</span>
          <input
            className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Password</span>
          <div className="relative">
            <input
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
            </button>
          </div>
        </label>
        <button
          disabled={busy || needsSetup === null}
          className="mt-2 min-h-11 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {needsSetup ? 'Create account & sign in' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
