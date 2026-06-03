const { test } = require('node:test');
const assert = require('node:assert');
const { generateBuffer } = require('../render/generate');

function plan() {
  return {
    industry: 'healthcare', geo: 'uk', marginMultiplier: 1.0, targetBudget: 9000,
    client: { name: 'Acme Care' }, brandMode: 'joveo', archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: 'Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }], locations: [{ name: 'Manchester', detail: '' }],
    tiers: [
      { name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 2', budget: 9000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
    ],
  };
}

test('generateBuffer returns a non-empty Buffer + slideCount + warnings', async () => {
  const r = await generateBuffer(plan());
  assert.ok(Buffer.isBuffer(r.buffer));
  assert.ok(r.buffer.length > 5000);
  assert.strictEqual(r.slideCount, 9);
  assert.ok(Array.isArray(r.warnings));
});

test('generateBuffer rejects a hard-invalid plan (no buffer)', async () => {
  const p = plan();
  p.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  await assert.rejects(() => generateBuffer(p), /hard validation/i);
});
