import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

async function getPage(slug: string) {
  if (!prisma) return null;
  return prisma.handbookPage.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return {
    title: page?.title || 'Handbuchseite',
    description: page?.description || 'Air Support Division Handbuchseite',
  };
}

export default async function HandbookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page || !page.published) {
    return (
      <main className="min-h-screen bg-background text-white">
        <Navbar />
        <div className="mx-auto mt-24 max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold">Seite nicht gefunden</h1>
          <p className="mt-4 text-slate-400">Die gewünschte Handbuchseite ist nicht veröffentlicht oder existiert nicht.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      <section className="mx-auto mt-24 max-w-4xl space-y-8 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-surface/80 p-8 shadow-glow backdrop-blur-xl">
          <h1 className="text-4xl font-semibold text-white">{page.title}</h1>
          <p className="mt-3 text-slate-400">{page.description}</p>
        </div>

        <div className="space-y-6">
          {page.blocks.map((block: any) => {
            if (block.type === 'TEXT') {
              return (
                <div key={block.id} className="rounded-3xl border border-white/10 bg-surface p-6 text-slate-200">
                  <div dangerouslySetInnerHTML={{ __html: block.content }} />
                </div>
              );
            }
            if (block.type === 'IMAGE') {
              return (
                <div key={block.id} className="overflow-hidden rounded-3xl border border-white/10 bg-surface">
                  <img src={block.content} alt="Handbuch Bild" className="w-full object-cover" />
                </div>
              );
            }
            if (block.type === 'VIDEO') {
              return (
                <div key={block.id} className="overflow-hidden rounded-3xl border border-white/10 bg-surface p-4">
                  <div className="aspect-video overflow-hidden rounded-3xl bg-black">
                    <iframe
                      src={block.content}
                      title="Video Embed"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                </div>
              );
            }
            if (block.type === 'DIVIDER') {
              return <hr key={block.id} className="border-slate-700" />;
            }
            return null;
          })}
        </div>
      </section>
    </main>
  );
}
