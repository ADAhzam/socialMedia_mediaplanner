import { NextRequest, NextResponse } from 'next/server';
import { buildPlanFromForm } from '@/lib/plan-builder';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();
    const eng = await import('@smmp/engine');
    const plan = buildPlanFromForm(form);
    const { buffer } = await (eng as any).generateBuffer(plan); // throws on hard error
    const safe = String(form.clientName || 'media-plan').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${safe}-media-plan.pptx"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 400 });
  }
}
