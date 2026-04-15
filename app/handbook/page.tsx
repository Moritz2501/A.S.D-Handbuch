import Link from 'next/link';
import Navbar from '@/app/components/Navbar';
import { prisma } from '@/lib/prisma';

async function getPages() {
  if (!prisma) return [];
  return prisma.handbookPage.findMany({ where: { published: true }, orderBy: [{ pageOrder: 'asc' }, { updatedAt: 'desc' }] });
}

export default async function HandbookIndexPage() {
  const pages = await getPages();

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />

      <section className="mx-auto mt-24 max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-surface/85 p-10 shadow-glow backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Handbuch</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white">ASD Handbuch</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Offizielles Handbuch der Air Support Division. Überall verfügbar, einfach zu navigieren und immer aktuell.
            </p>
            <div className="mt-10 rounded-3xl border border-white/10 bg-black/40 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Schnellstart</p>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li>• Klicke auf einen Artikel, um ihn direkt zu öffnen.</li>
                <li>• Alle Seiten sind öffentlich sichtbar.</li>
                <li>• Inhalte werden live aktualisiert.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-surface/85 p-8 shadow-glow backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Inhalte</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Seitenübersicht</h2>
              </div>
              <span className="rounded-full border border-orange-500 px-3 py-1 text-sm text-orange-300">Handbuch</span>
            </div>
            <div className="mt-8 grid gap-4">
              {pages.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-slate-300">Noch keine Seiten veröffentlicht.</div>
              ) : (
                pages.map((page: any) => (
                  <Link
                    key={page.id}
                    href={`/handbook/${page.slug}`}
                    className="group block rounded-3xl border border-white/10 bg-black/30 p-6 transition hover:border-orange-400/40 hover:bg-white/5"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white group-hover:text-orange-300">{page.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{page.description || 'Keine Beschreibung verfügbar.'}</p>
                      </div>
                      <span className="text-sm text-slate-300 transition group-hover:text-orange-300">Ansehen →</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
