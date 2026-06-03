import { NextRequest, NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

// Runtime-agnostic constant-time string comparison (length-normalized).
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

function noStore(res: NextResponse): NextResponse {
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('Vary', 'Authorization');
  return res;
}

export function middleware(req: NextRequest) {
  const user = process.env.TEAM_USER;
  const pass = process.env.TEAM_PASS;

  // Fail CLOSED when unconfigured, unless explicitly opted into open access
  // (e.g. local dev). Never silently disable auth in production.
  if (!user || !pass) {
    if (process.env.ALLOW_UNAUTHENTICATED === '1') return noStore(NextResponse.next());
    if (process.env.NODE_ENV !== 'production') return noStore(NextResponse.next());
    return new NextResponse('Server misconfigured: team credentials not set', {
      status: 500,
      headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization' },
    });
  }

  const header = req.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try { decoded = atob(encoded); } catch { decoded = ''; }
    const idx = decoded.indexOf(':');
    const u = idx >= 0 ? decoded.slice(0, idx) : '';
    const p = idx >= 0 ? decoded.slice(idx + 1) : '';
    // Evaluate both comparisons (no short-circuit) to reduce timing signal.
    const okU = safeEqual(u, user);
    const okP = safeEqual(p, pass);
    if (okU && okP) return noStore(NextResponse.next());
  }
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Joveo Media Planner"',
      'Cache-Control': 'no-store',
      'Vary': 'Authorization',
    },
  });
}
