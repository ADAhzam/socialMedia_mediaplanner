import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET() {
  const eng = await import('@smmp/engine');
  return NextResponse.json({ ok: true, hasGenerate: typeof (eng as any).generateBuffer === 'function' });
}
