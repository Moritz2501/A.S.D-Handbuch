import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

const rankHierarchy = [
  'Flight_Student',
  'Flight_Officer',
  'Senior_Flight_Officer',
  'Flight_Instructor',
  'ASD_Co_Director',
  'ASD_Director',
];

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const { memberId, newRank } = await req.json();

  const member = await prisma!.member.findUnique({
    where: { id: memberId },
    include: { trainings: true },
  });

  if (!member) {
    return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404 });
  }

  // Prüfen, ob der neue Rang gültig ist
  if (!rankHierarchy.includes(newRank)) {
    return new Response(JSON.stringify({ error: 'Invalid rank' }), { status: 400 });
  }

  // Flight Student automatisch befördern, wenn alle Trainings abgeschlossen
  if (member.rank === 'Flight_Student' && newRank === 'Flight_Officer') {
    const allTrainingsCompleted = member.trainings.every(t => t.completed);
    if (!allTrainingsCompleted) {
      return new Response(JSON.stringify({
        error: 'Flight Student muss alle Ausbildungen abschließen, bevor er Flight Officer werden kann'
      }), { status: 400 });
    }
  }

  // Rang aktualisieren
  const updatedMember = await prisma!.member.update({
    where: { id: memberId },
    data: { rank: newRank },
  });

  return NextResponse.json(updatedMember);
}

// Automatische Beförderung für Flight Students
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated(req))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!prisma) {
    return new Response(JSON.stringify({ error: 'Database not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // Alle Flight Students finden, die alle Trainings abgeschlossen haben
  const flightStudents = await prisma!.member.findMany({
    where: { rank: 'Flight_Student' },
    include: { trainings: true },
  });

  const promotions = [];

  for (const student of flightStudents) {
    const allTrainingsCompleted = student.trainings.length > 0 && student.trainings.every(t => t.completed);
    if (allTrainingsCompleted) {
      await prisma!.member.update({
        where: { id: student.id },
        data: { rank: 'Flight_Officer' },
      });
      promotions.push(student);
    }
  }

  return NextResponse.json({
    message: `${promotions.length} Flight Students wurden zu Flight Officers befördert`,
    promoted: promotions
  });
}