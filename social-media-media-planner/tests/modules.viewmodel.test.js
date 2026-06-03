const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');

function basePlan() {
  return {
    industry: 'healthcare', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    client: { name: 'Acme Care' }, brandMode: 'joveo', archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: 'Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }], locations: [{ name: 'Manchester', detail: '' }],
    tiers: [{ name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } }],
  };
}

test('no modules -> deckModel.modules is an empty object', () => {
  const p = basePlan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.deepStrictEqual(dm.modules, {});
});

test('attached modules are carried onto the deckModel', () => {
  const p = basePlan();
  p.targeting = { meta: { location: 'Manchester' }, google: {} };
  p.keywords = { clusters: [{ role: 'Registered Nurse', type: 'Brand', matchType: 'Exact', terms: ['acme care careers'] }], negatives: [] };
  p.insights = { activePassive: { passivePct: 90, activePct: 10, sources: ['x'] } };
  const dm = buildDeckModel(p, projectPlan(p));
  assert.ok(dm.modules.targeting);
  assert.ok(dm.modules.keywords);
  assert.strictEqual(dm.modules.insights.activePassive.passivePct, 90);
});
