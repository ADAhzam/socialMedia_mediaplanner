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
