const { test } = require('node:test');
const assert = require('node:assert');
const { validateInsights } = require('../render/modules/insights');

test('no insights -> no warnings', () => {
  assert.deepStrictEqual(validateInsights({}), []);
});

test('insight without sources -> warning', () => {
  const plan = { insights: { marketLandscape: { talentPool: '12,000', sources: [] } } };
  const warns = validateInsights(plan);
  assert.ok(warns.some(w => /marketLandscape/.test(w) && /citation|source/i.test(w)));
});

test('insight with sources -> no warning for that insight', () => {
  const plan = { insights: { activePassive: { passivePct: 90, sources: ['https://example.com/report'] } } };
  assert.deepStrictEqual(validateInsights(plan), []);
});
