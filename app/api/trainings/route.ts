import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const trainings = await prisma.training.findMany({ include: { member: true } });
  return NextResponse.json(trainings);
}

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { memberId, title, completed } = await req.json();
  const training = await prisma.training.create({
    data: {
      memberId,
      title,
      completed: Boolean(completed),
    },
  });
  return NextResponse.json(training);
}

export async function PATCH(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { id, completed } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }
  const training = await prisma.training.update({
    where: { id },
    data: { completed: Boolean(completed) },
  });
  return NextResponse.json(training);
}
