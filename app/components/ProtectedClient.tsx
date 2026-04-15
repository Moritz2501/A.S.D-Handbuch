'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/status').then((res) => res.json()).then((data) => {
      if (!data.authenticated) {
        router.replace('/internal');
      } else {
        setAuthenticated(true);
      }
    }).catch(() => router.replace('/internal'));
  }, [router]);

  if (authenticated === null) {
    return <div className="min-h-screen bg-background p-8">Lade Authentifizierung …</div>;
  }

  return <>{children}</>;
}
