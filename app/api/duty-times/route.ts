import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const dutyTimes = await prisma.dutyTime.findMany({ include: { member: true }, orderBy: { startDate: 'desc' } });
  return NextResponse.json(dutyTimes);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const { memberId, startDate, endDate, hours, minutes, isVacation } = await req.json();
  const dutyTime = await prisma.dutyTime.create({
    data: {
      memberId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      hours: Number(hours) || 0,
      minutes: Number(minutes) || 0,
      isVacation: Boolean(isVacation),
    },
  });
  return NextResponse.json(dutyTime);
}
