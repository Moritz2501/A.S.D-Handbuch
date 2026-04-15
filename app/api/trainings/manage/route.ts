import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const trainings = await prisma.training.findMany({
    select: {
      title: true,
      category: true,
      completed: true,
    },
  });

  const uniqueMap = trainings.reduce((map, training) => {
    const key = `${training.category}:${training.title}`;
    if (!map.has(key)) {
      map.set(key, { title: training.title, category: training.category, isCompleted: training.completed });
    } else if (training.completed) {
      map.get(key)!.isCompleted = true;
    }
    return map;
  }, new Map<string, { title: string; category: string; isCompleted: boolean }>());

  return NextResponse.json(Array.from(uniqueMap.values()));
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { title, category } = await req.json();

  const trainingCategory = category === 'FORTBILDUNG' ? 'FORTBILDUNG' : 'AUSBILDUNG';
  const memberFilter = trainingCategory === 'FORTBILDUNG'
    ? { rank: { in: ['Flight_Officer', 'Senior_Flight_Officer', 'Flight_Instructor'] as const } }
    : { rank: 'Flight_Student' as const };

  const members = await prisma!.member.findMany({ where: memberFilter as any });

  const newTrainings = await Promise.all(
    members.map(member =>
      prisma!.training.create({
        data: {
          memberId: member.id,
          title,
          category: trainingCategory,
          completed: false,
        },
      })
    )
  );

  return NextResponse.json({ message: 'Ausbildung hinzugefügt', trainings: newTrainings });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { oldTitle, newTitle, category } = await req.json();
  const trainingCategory = category === 'FORTBILDUNG' ? 'FORTBILDUNG' : 'AUSBILDUNG';

  await prisma!.training.updateMany({
    where: { title: oldTitle, category: trainingCategory },
    data: { title: newTitle },
  });

  return NextResponse.json({ message: 'Ausbildung umbenannt' });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { title, category } = await req.json();
  const trainingCategory = category === 'FORTBILDUNG' ? 'FORTBILDUNG' : 'AUSBILDUNG';

  // Alle Trainings mit diesem Titel löschen
  await prisma!.training.deleteMany({
    where: { title, category: trainingCategory },
  });

  return NextResponse.json({ message: 'Ausbildung entfernt' });
}