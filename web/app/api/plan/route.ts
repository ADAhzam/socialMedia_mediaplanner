import { NextRequest, NextResponse } from 'next/server';
import { buildPlanFromForm } from '@/lib/plan-builder';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();
    const eng = await import('@smmp/engine');
    const plan = (eng as any).withModules(buildPlanFromForm(form));
    const projected = (eng as any).projectPlan(plan);
    const { warnings } = (eng as any).prepareForRender(plan, projected); // throws on hard error
    const tiers = projected.tiers.map((t: any) => ({
      name: t.name, budget: t.budget, recommended: t.recommended,
      clicks: Math.round(t.totals.clicks), impressions: Math.round(t.totals.impressions),
    }));
    return NextResponse.json({ ok: true, tiers, warnings });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 400 });
  }
}
