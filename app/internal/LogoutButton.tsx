'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/internal');
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-orange-500 px-4 py-2 text-sm text-orange-300 transition hover:bg-orange-500/10 hover:text-white"
    >
      Logout
    </button>
  );
}
