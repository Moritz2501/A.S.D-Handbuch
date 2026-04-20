import type { Metadata } from 'next';
import './globals.css';
import Footer from './components/Footer';
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
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
          <ServiceWorkerRegister />
        </div>
      </body>
    </html>
  );
}
