import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const checks = await prisma.flightCheck.findMany({
    include: {
      participants: {
        include: { member: true },
      },
    },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(checks);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const { route, date, participants } = await req.json();

  if (!route || !date || !Array.isArray(participants) || participants.length === 0) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const check = await prisma.flightCheck.create({
    data: {
      route: String(route),
      date: new Date(date),
      participants: {
        create: participants.map((participant: any) => ({
          memberId: participant.memberId,
          participated: Boolean(participant.participated),
          passed: Boolean(participant.participated) && Boolean(participant.passed),
        })),
      },
    },
    include: {
      participants: {
        include: { member: true },
      },
    },
  });

  return NextResponse.json(check);
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const { id, route, date, participants } = await req.json();
  if (!id || !route || !date || !Array.isArray(participants)) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  await prisma.flightCheck.update({
    where: { id: String(id) },
    data: {
      route: String(route),
      date: new Date(date),
    },
  });

  await prisma.flightCheckParticipant.deleteMany({
    where: { flightCheckId: String(id) },
  });

  await prisma.flightCheckParticipant.createMany({
    data: participants.map((participant: any) => ({
      flightCheckId: String(id),
      memberId: participant.memberId,
      participated: Boolean(participant.participated),
      passed: Boolean(participant.participated) && Boolean(participant.passed),
    })),
  });

  const updated = await prisma.flightCheck.findUnique({
    where: { id: String(id) },
    include: {
      participants: {
        include: { member: true },
      },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const { id } = await req.json();
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  await prisma.flightCheck.delete({ where: { id: String(id) } });
  return NextResponse.json({ message: 'Flugüberprüfung gelöscht' });
}
