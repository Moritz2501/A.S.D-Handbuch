import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const members = await prisma.member.findMany({ orderBy: { joinedAt: 'desc' } });
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { name, rank, joinedAt } = await req.json();
  const member = await prisma.member.create({
    data: {
      name,
      rank,
      joinedAt: new Date(joinedAt),
    },
  });
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
