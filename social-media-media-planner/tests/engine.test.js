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
