const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');

function plan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 9000,
    client: { name: 'Acme Care' },
    brandMode: 'joveo',
    archetype: 'branding',
    objectiveLabel: 'Employer Branding',
    geoLabel: '25-mile radius, Manchester',
    dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }],
    locations: [{ name: 'Manchester Centre', detail: 'M1 - M4' }],
    tiers: [
      { name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 2', budget: 9000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
    ],
  };
}

test('buildDeckModel carries client + formatted labels + recommended flag', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.strictEqual(dm.client, 'Acme Care');
  assert.strictEqual(dm.tiers.length, 2);
  assert.strictEqual(dm.tiers[0].budgetLabel, '$5,000');
  assert.strictEqual(dm.tiers[1].recommended, true); // 9000 == targetBudget
  const gs = dm.tiers[0].channels.find(c => c.label.startsWith('Google Search'));
  assert.ok(gs.budgetLabel === '$500');
  assert.ok(/–/.test(gs.clicksRangeLabel)); // has en-dash range
  assert.ok(dm.tiers[0].totals.clicksRangeLabel.length > 0);
});

test('buildDeckModel resolves brand and substitutes the date into the footer', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.strictEqual(dm.brand.showJoveo, true);
  assert.ok(dm.brand.footerText.includes('June 2026'));
  assert.ok(!dm.brand.footerText.includes('{DATE}'));
});

test('channel labels are humanized with percent', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  const labels = dm.tiers[0].channels.map(c => c.label);
  assert.ok(labels.includes('Meta Feed Image (50%)'));
});
