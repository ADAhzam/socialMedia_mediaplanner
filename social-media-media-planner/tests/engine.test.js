const { test } = require('node:test');
const assert = require('node:assert');
const { projectChannel } = require('../lib/engine');

test('projects clicks and impressions from budget at margin 1.0', () => {
  const p = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us',
  });
  assert.strictEqual(p.channel, 'google_search');
  assert.strictEqual(p.budget, 3000);
  assert.ok(Math.abs(p.cpc - 3.0) < 1e-9);
  assert.strictEqual(p.ctr, 6.5);
  // clicks = 3000 / 3.00 = 1000
  assert.ok(Math.abs(p.clicks - 1000) < 1e-6);
  // impressions = 1000 * 100 / 6.5 = 15384.61...
  assert.ok(Math.abs(p.impressions - 15384.615384) < 1e-3);
  // cpm = 3.00 * 0.065 * 1000 = 195
  assert.ok(Math.abs(p.cpm - 195) < 1e-6);
});

const { applyMargin } = require('../lib/engine');

test('applyMargin multiplies a rate', () => {
  assert.ok(Math.abs(applyMargin(3.0, 2.0) - 6.0) < 1e-9);
  assert.ok(Math.abs(applyMargin(3.0, 0.8) - 2.4) < 1e-9);
});

test('higher margin reduces projected clicks; lower margin increases them', () => {
  const base = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
  });
  const fatter = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 2.0,
  });
  const leaner = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 0.5,
  });
  assert.ok(fatter.clicks < base.clicks);   // margin up -> fewer clicks
  assert.ok(leaner.clicks > base.clicks);   // margin down -> more clicks
  assert.ok(Math.abs(fatter.cpc - 6.0) < 1e-9);
});

const { toRange } = require('../lib/engine');

test('toRange uses default low 0.6 / high 1.5 multipliers', () => {
  const r = toRange(1000);
  assert.ok(Math.abs(r.low - 600) < 1e-9);
  assert.ok(Math.abs(r.high - 1500) < 1e-9);
});

test('toRange accepts custom multipliers', () => {
  const r = toRange(1000, { lowMult: 0.6, highMult: 1.45 });
  assert.ok(Math.abs(r.low - 600) < 1e-9);
  assert.ok(Math.abs(r.high - 1450) < 1e-9);
});

test('toRange low never exceeds high', () => {
  const r = toRange(1000);
  assert.ok(r.low <= r.high);
});

const { applyBoundary } = require('../lib/engine');

test('value inside the band is unchanged', () => {
  const r = applyBoundary(9800, { anchor: 10000, tolerancePct: 10 });
  assert.strictEqual(r.value, 9800);
  assert.strictEqual(r.clamped, false);
});

test('value above the band clamps to the high edge', () => {
  const r = applyBoundary(12000, { anchor: 10000, tolerancePct: 10 });
  assert.ok(Math.abs(r.value - 11000) < 1e-9);
  assert.strictEqual(r.clamped, true);
});

test('value below the band clamps to the low edge', () => {
  const r = applyBoundary(8000, { anchor: 10000, tolerancePct: 10 });
  assert.ok(Math.abs(r.value - 9000) < 1e-9);
  assert.strictEqual(r.clamped, true);
});

const { applyOverrides } = require('../lib/engine');

test('overrides replace matching fields and leave others intact', () => {
  const projection = { channel: 'google_search', cpc: 3.0, clicks: 1000, impressions: 15384 };
  const out = applyOverrides(projection, { cpc: 2.5, clicks: 1200 });
  assert.strictEqual(out.cpc, 2.5);
  assert.strictEqual(out.clicks, 1200);
  assert.strictEqual(out.impressions, 15384);
  assert.strictEqual(out.channel, 'google_search');
});

test('applyOverrides does not mutate the input', () => {
  const projection = { cpc: 3.0 };
  applyOverrides(projection, { cpc: 1.0 });
  assert.strictEqual(projection.cpc, 3.0);
});

test('empty overrides return an equivalent object', () => {
  const projection = { cpc: 3.0, clicks: 1000 };
  assert.deepStrictEqual(applyOverrides(projection, {}), projection);
});

const { budgetFromHires } = require('../lib/engine');

test('computes apps target and budget from hires (BAYADA example)', () => {
  const r = budgetFromHires({ hires: 8, applyToHireRatio: 50, targetCpa: 92.5 });
  assert.strictEqual(r.appsTarget, 400);
  assert.ok(Math.abs(r.budget - 37000) < 1e-6);
});

test('throws on non-positive inputs', () => {
  assert.throws(() => budgetFromHires({ hires: 0, applyToHireRatio: 50, targetCpa: 92.5 }));
  assert.throws(() => budgetFromHires({ hires: 8, applyToHireRatio: 0, targetCpa: 92.5 }));
  assert.throws(() => budgetFromHires({ hires: 8, applyToHireRatio: 50, targetCpa: -1 }));
});

const { recommendTier } = require('../lib/engine');

test('recommends the tier nearest a target budget', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }, { budget: 14000 }];
  assert.strictEqual(recommendTier(tiers, { targetBudget: 8000 }), 1);
});

test('falls back to the median tier when no target given', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }, { budget: 14000 }];
  assert.strictEqual(recommendTier(tiers, {}), 1);
});

test('never recommends an out-of-range index', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }];
  const idx = recommendTier(tiers, { targetBudget: 999999 });
  assert.ok(idx >= 0 && idx < tiers.length);
});

const { projectPlan } = require('../lib/engine');

const samplePlan = {
  industry: 'general_recruitment',
  geo: 'us',
  marginMultiplier: 1.0,
  targetBudget: 9000,
  tiers: [
    {
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    },
    {
      name: 'Tier 2', budget: 9000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    },
  ],
};

test('projectPlan splits budget by allocation and totals clicks', () => {
  const out = projectPlan(samplePlan);
  const t1 = out.tiers[0];
  const gs = t1.channels.find(c => c.channel === 'google_search');
  // 10% of 5000 = 500 budget; 500 / 3.00 = 166.67 clicks
  assert.ok(Math.abs(gs.budget - 500) < 1e-6);
  assert.ok(Math.abs(gs.clicks - 166.6667) < 1e-3);
  // totals = sum of channel clicks
  const summed = t1.channels.reduce((s, c) => s + c.clicks, 0);
  assert.ok(Math.abs(t1.totals.clicks - summed) < 1e-6);
  // each channel carries ranges
  assert.ok(gs.clicksRange.low <= gs.clicksRange.high);
  assert.ok(gs.impressionsRange.low <= gs.impressionsRange.high);
});

test('projectPlan marks exactly one recommended tier (nearest targetBudget)', () => {
  const out = projectPlan(samplePlan);
  const flagged = out.tiers.filter(t => t.recommended);
  assert.strictEqual(flagged.length, 1);
  assert.strictEqual(out.tiers[1].recommended, true); // 9000 == targetBudget
});

test('projectPlan applies a per-channel boundary clamp on clicks', () => {
  const plan = {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
    tiers: [{
      name: 'T', budget: 5000,
      allocations: { google_search: 100 },
      boundaries: { google_search: { metric: 'clicks', anchor: 1000, tolerancePct: 10 } },
    }],
  };
  const gs = projectPlan(plan).tiers[0].channels[0];
  // raw clicks = 5000/3 = 1666.67 -> clamped to 1100 (1000 +10%)
  assert.ok(Math.abs(gs.clicks - 1100) < 1e-6);
  assert.strictEqual(gs.clamped, true);
});

test('projectPlan applies per-channel overrides last', () => {
  const plan = {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
    tiers: [{
      name: 'T', budget: 5000,
      allocations: { google_search: 100 },
      overrides: { google_search: { cpc: 2.0 } },
    }],
  };
  const gs = projectPlan(plan).tiers[0].channels[0];
  assert.strictEqual(gs.cpc, 2.0);
});
