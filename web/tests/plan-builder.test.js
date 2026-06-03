const { test } = require('node:test');
const assert = require('node:assert');
const { buildPlanFromForm } = require('../lib/plan-builder');

function form() {
  return {
    clientName: 'Acme Care', brandMode: 'joveo', accentColor: '', logoPath: '',
    industry: 'healthcare', geoLabel: 'Manchester', objectiveLabel: 'Employer Branding',
    archetype: 'branding', monthlyBudget: 9000,
    roles: 'Registered Nurse, Healthcare Assistant',
    locations: 'Manchester Centre, Salford',
    modules: { targeting: true, keywords: false },
    insights: { activePassive: { passivePct: 90, activePct: 10, note: 'Built for the 90%' }, competitors: 'Bupa, HC-One' },
  };
}

test('builds a valid engine plan with 3 budget tiers around the monthly budget', () => {
  const p = buildPlanFromForm(form());
  assert.strictEqual(p.client.name, 'Acme Care');
  assert.strictEqual(p.targetBudget, 9000);
  assert.strictEqual(p.tiers.length, 3);
  assert.deepStrictEqual(p.tiers.map(t => t.budget), [5400, 9000, 13500]); // 0.6x,1x,1.5x rounded
  // allocations sum to 100 in each tier
  p.tiers.forEach(t => {
    const sum = Object.values(t.allocations).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 100) < 0.5);
  });
});

test('splits roles/locations and carries module toggles + simple insights', () => {
  const p = buildPlanFromForm(form());
  assert.deepStrictEqual(p.roleGroups.map(r => r.name), ['Registered Nurse', 'Healthcare Assistant']);
  assert.deepStrictEqual(p.locations.map(l => l.name), ['Manchester Centre', 'Salford']);
  assert.strictEqual(p.modules.targeting, true);
  assert.strictEqual(p.insights.activePassive.passivePct, 90);
  assert.ok(Array.isArray(p.insights.activePassive.sources)); // AM-entered -> sources stamped
  assert.deepStrictEqual(p.insights.competitive.competitors.map(c => c.name), ['Bupa', 'HC-One']);
});

test('cobranded carries accent color onto the client', () => {
  const f = form(); f.brandMode = 'cobranded'; f.accentColor = '00A1E0';
  const p = buildPlanFromForm(f);
  assert.strictEqual(p.client.accentColor, '00A1E0');
});
