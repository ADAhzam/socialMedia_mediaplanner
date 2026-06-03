import { NextRequest, NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

export function middleware(req: NextRequest) {
  const user = process.env.TEAM_USER;
  const pass = process.env.TEAM_PASS;
  if (!user || !pass) return NextResponse.next(); // not configured -> open (e.g. local dev)

  const header = req.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [u, p] = Buffer.from(encoded, 'base64').toString().split(':');
    if (u === user && p === pass) return NextResponse.next();
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Joveo Media Planner"' },
  });
}
