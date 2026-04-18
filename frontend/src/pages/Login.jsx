import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: 'admin@example.com', password: 'Admin@12345' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to={location.state?.from || '/admin/dashboard'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-mist lg:grid-cols-2">
      <div className="hidden bg-ocean lg:block">
        <img
          className="h-full w-full object-cover opacity-80"
          src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80"
          alt="Digital network"
        />
      </div>
      <main className="flex items-center justify-center px-4">
        <form onSubmit={submit} className="w-full max-w-md rounded border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-ocean">Admin Access</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Sign in to dashboard</h1>
          {error ? <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
          <label className="mt-5 block text-sm font-medium text-slate-700">
            Email
            <input className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input type="password" className="mt-2 w-full rounded border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
          <button disabled={loading} className="mt-6 w-full rounded bg-ocean px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </main>
    </div>
  );
}
