import { FormEvent, useState } from 'react';

import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      window.location.assign('/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Operations</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in</h1>
      <div className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="block text-sm font-medium text-slate-700">Password<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      </div>
      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}
      <button disabled={loading} className="mt-6 w-full rounded-lg bg-sky-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{loading ? 'Signing in...' : 'Login'}</button>
    </form>
  </main>;
}