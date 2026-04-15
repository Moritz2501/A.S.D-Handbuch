import { prisma } from '@/lib/prisma';
import Navbar from '@/app/components/Navbar';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type BlockLayout = 'full' | 'half';

const layoutPrefix = /^\[\[layout:(full|half)\]\]/;

function parseBlockLayout(content: string): { layout: BlockLayout; content: string } {
  const match = content.match(layoutPrefix);
  if (!match) {
    return { layout: 'full', content };
  }
  return {
    layout: match[1] === 'half' ? 'half' : 'full',
    content: content.replace(layoutPrefix, ''),
  };
}

async function getPage(slug: string) {
  if (!prisma) return null;
  return prisma.handbookPage.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
}

async function getPages() {
  if (!prisma) return [];
  return prisma.handbookPage.findMany({ where: { published: true }, orderBy: [{ pageOrder: 'asc' }, { updatedAt: 'desc' }] });
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
  const pages = await getPages();

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
      <section className="mx-auto mt-24 max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/10 bg-surface/85 p-6 shadow-glow backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Navigation</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Seiten</h2>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {pages.map((item: any) => (
                <a
                  key={item.id}
                  href={`/handbook/${item.slug}`}
                  className={`block rounded-2xl border px-4 py-3 text-sm transition ${item.slug === slug ? 'border-orange-400 bg-orange-500/10 text-orange-300' : 'border-white/10 bg-black/20 text-slate-300 hover:border-orange-400/40 hover:bg-white/5'}`}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </aside>

          <article className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-surface/80 p-8 shadow-glow backdrop-blur-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-orange-400">Handbuchseite</p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">{page.title}</h1>
                </div>
                <div className="text-right text-sm text-slate-400">
                  {page.updatedAt ? <p>Zuletzt aktualisiert: {new Date(page.updatedAt).toLocaleDateString('de-DE')}</p> : null}
                  <p className="mt-2">{page.description}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {page.blocks.map((block: any) => {
                const parsedBlock = parseBlockLayout(block.content || '');
                const isFullWidth = block.type === 'DIVIDER' || parsedBlock.layout === 'full';
                const blockWidthClass = isFullWidth ? 'md:col-span-2' : 'md:col-span-1';

                if (block.type === 'TEXT') {
                  return (
                    <section key={block.id} className={`rounded-3xl border border-white/10 bg-surface p-6 text-slate-200 shadow-sm ${blockWidthClass}`}>
                      <div dangerouslySetInnerHTML={{ __html: parsedBlock.content }} />
                    </section>
                  );
                }
                if (block.type === 'IMAGE') {
                  return (
                    <section key={block.id} className={`overflow-hidden rounded-3xl border border-white/10 bg-surface shadow-sm ${blockWidthClass}`}>
                      <img src={parsedBlock.content} alt="Handbuch Bild" className="w-full object-cover" />
                    </section>
                  );
                }
                if (block.type === 'VIDEO') {
                  return (
                    <section key={block.id} className={`overflow-hidden rounded-3xl border border-white/10 bg-surface p-4 shadow-sm ${blockWidthClass}`}>
                      <div className="aspect-video overflow-hidden rounded-3xl bg-black">
                        <iframe
                          src={parsedBlock.content}
                          title="Video Embed"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    </section>
                  );
                }
                if (block.type === 'DIVIDER') {
                  return <hr key={block.id} className={`border-slate-700 ${blockWidthClass}`} />;
                }
                return null;
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
