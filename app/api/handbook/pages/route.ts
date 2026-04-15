import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const pages = await prisma.handbookPage.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { title, slug, description, published } = await req.json();
  const page = await prisma.handbookPage.create({
    data: {
      title,
      slug,
      description,
      published: Boolean(published),
    },
  });
  return NextResponse.json(page);
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { id, title, description, slug, published, blocks } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }
  const page = await prisma.handbookPage.update({
    where: { id },
    data: {
      title,
      description,
      slug,
      published: Boolean(published),
      blocks: {
        deleteMany: { pageId: id },
        create: blocks?.map((block: any, index: number) => ({
          type: block.type,
          content: block.content,
          order: index,
        })) || [],
      },
    },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
  return NextResponse.json(page);
}
