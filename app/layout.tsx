import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegister from './components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'ASD Handbuch',
  description: 'Air Support Division Handbuch und Admin Dashboard',
  metadataBase: new URL('https://example.com'),
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="bg-background text-white antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
