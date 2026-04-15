import { NextRequest } from 'next/server';
import { createLoginResponse } from '@/lib/auth';

const ADMIN_USER = process.env.ADMIN_USER || 'asdadmin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'asd-secret-password';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body || {};

  if (username !== ADMIN_USER || password !== ADMIN_PASS) {
    return new Response(JSON.stringify({ error: 'Ungültige Zugangsdaten' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return createLoginResponse();
}
