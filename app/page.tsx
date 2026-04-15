import Link from 'next/link';
import Navbar from './components/Navbar';
import SectionTitle from './components/SectionTitle';
import InfoCard from './components/InfoCard';
import { prisma } from '@/lib/prisma';

async function getPages() {
  if (!prisma) return [];
  return prisma.handbookPage.findMany({ where: { published: true }, orderBy: { updatedAt: 'desc' } });
}

export default async function HomePage() {
  const pages = await getPages();

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <section className="mx-auto mt-24 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-surface/80 p-10 shadow-glow backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-orange-400">ASD Public Guide</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            Air Support Division Handbuch
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            Offizielles Handbuch für das GTA RP Police Department Air Support Division. Durchsuchen, lernen und Verantwortlichkeiten verstehen.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <InfoCard title="Öffentlicher Bereich" description="Alle Seiten des Handbuchs sind öffentlich zugänglich und responsiv gestaltet." />
            <InfoCard title="Internes Dashboard" description="Verwalte Mitglieder, Ausbildung, Dienstzeiten und Handbuchinhalte im geschützten Adminbereich." />
          </div>
        </div>

        <div className="mt-12">
          <SectionTitle title="Verfügbare Seiten" subtitle="Handbuch" />
          <div className="space-y-4">
            {pages.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-surface p-6 text-slate-300">Keine veröffentlichten Seiten verfügbar.</div>
            ) : (
              pages.map((page: any) => (
                <Link key={page.id} href={`/handbook/${page.slug}`} className="block rounded-3xl border border-white/10 bg-surface p-6 transition hover:border-orange-400/40 hover:bg-surface/95">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{page.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{page.description || 'Keine Beschreibung vorhanden.'}</p>
                    </div>
                    <span className="rounded-full border border-orange-500 px-3 py-1 text-sm text-orange-300">Öffnen</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
