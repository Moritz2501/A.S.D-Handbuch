import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  // Alle verfügbaren Ausbildungen zurückgeben (unique titles)
  const trainings = await prisma.training.findMany({
    select: {
      title: true,
      completed: true,
    },
  });

  // Unique Ausbildungstitel extrahieren
  const uniqueTrainings = [...new Set(trainings.map(t => t.title))].map(title => ({
    title,
    isCompleted: trainings.some(t => t.title === title && t.completed),
  }));

  return NextResponse.json(uniqueTrainings);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { title } = await req.json();

  // Neue Ausbildung zu allen Flight Students hinzufügen
  const flightStudents = await prisma!.member.findMany({
    where: { rank: 'Flight_Student' },
  });

  const newTrainings = await Promise.all(
    flightStudents.map(student =>
      prisma!.training.create({
        data: {
          memberId: student.id,
          title,
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
  const { oldTitle, newTitle } = await req.json();

  // Alle Trainings mit dem alten Titel umbenennen
  await prisma!.training.updateMany({
    where: { title: oldTitle },
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
  const { title } = await req.json();

  // Alle Trainings mit diesem Titel löschen
  await prisma!.training.deleteMany({
    where: { title },
  });

  return NextResponse.json({ message: 'Ausbildung entfernt' });
}