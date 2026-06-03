const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');
const { renderDeck } = require('../render/render');

function plan(brandMode) {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 9000,
    client: { name: 'Acme Care' }, brandMode, archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: '25-mile radius, Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }, { name: 'Senior RN', subtitle: 'Clinical Lead' }],
    locations: [{ name: 'Manchester Centre', detail: 'M1 - M4' }],
    tiers: [
      { name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 2', budget: 9000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 3', budget: 14000, allocations: { google_search: 8, meta_feed_image: 42, meta_feed_video: 30, meta_reels: 20 } },
    ],
  };
}

test('renderDeck writes a non-empty pptx with 9 slides', async () => {
  const p = plan('joveo');
  const dm = buildDeckModel(p, projectPlan(p));
  const out = path.join(__dirname, '..', 'out', 'smoke-joveo.pptx');
  const result = await renderDeck(dm, out);
  assert.strictEqual(result.slideCount, 9);
  assert.ok(fs.existsSync(out));
  assert.ok(fs.statSync(out).size > 5000);
});

test('renderDeck works in whitelabel mode without throwing', async () => {
  const p = plan('whitelabel');
  const dm = buildDeckModel(p, projectPlan(p));
  const out = path.join(__dirname, '..', 'out', 'smoke-whitelabel.pptx');
  const result = await renderDeck(dm, out);
  assert.strictEqual(result.slideCount, 9);
  assert.ok(fs.existsSync(out));
});
