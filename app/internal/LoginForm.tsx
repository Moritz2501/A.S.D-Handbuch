'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (res.ok) {
      router.push('/internal/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login fehlgeschlagen');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        <label className="block">
          <span className="text-sm text-slate-300">Benutzername</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            autoComplete="username"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-300">Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#111] px-4 py-3 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            autoComplete="current-password"
            required
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Anmelden …' : 'Login'}
      </button>
    </form>
  );
}
