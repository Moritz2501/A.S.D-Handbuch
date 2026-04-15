import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { prisma } from '@/lib/prisma';

async function getPages() {
  if (!prisma) return [];
  return prisma.handbookPage.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' } });
}

export default async function HandbookIndexPage() {
  const pages = await getPages();

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <section className="mx-auto mt-24 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-surface/80 p-10 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Handbuch</p>
          <h1 className="mt-4 text-5xl font-semibold">Offizielle Seiten</h1>
          <p className="mt-4 text-slate-400">Durchsuche alle veröffentlichten Inhalte der Air Support Division.</p>
        </div>
        <div className="mt-10 grid gap-4">
          {pages.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-surface p-6 text-slate-300">Noch keine Seiten veröffentlicht.</div>
          ) : (
            pages.map((page: any) => (
              <Link key={page.id} href={`/handbook/${page.slug}`} className="block rounded-3xl border border-white/10 bg-surface p-6 transition hover:border-orange-400/40 hover:bg-surface/95">
                <h2 className="text-2xl font-semibold text-white">{page.title}</h2>
                <p className="mt-2 text-slate-400">{page.description || 'Keine Beschreibung verfügbar.'}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
