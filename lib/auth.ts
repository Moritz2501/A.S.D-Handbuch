import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'asd_session';
const SECRET = process.env.ADMIN_PASSWORD || 'asd-secret-password';

export function isAuthenticated(req: Request | NextRequest) {
  const cookieStore = cookies();
  const value = cookieStore.get(AUTH_COOKIE)?.value;
  return value === SECRET;
}

export function requireAuth(req: Request | NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.redirect(new URL('/internal', req.url));
  }
  return null;
}

export function createLoginResponse() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({
    name: AUTH_COOKIE,
    value: SECRET,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
  });
  return res;
}

export function createLogoutResponse() {
  const res = NextResponse.json({ success: true });
  res.cookies.set({ name: AUTH_COOKIE, value: '', path: '/', maxAge: 0 });
  return res;
}
