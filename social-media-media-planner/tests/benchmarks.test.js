const { test } = require('node:test');
const assert = require('node:assert');
const { getBenchmark, BENCHMARKS, GEO_MULTIPLIER } = require('../lib/benchmarks');

test('returns base CPC for US (multiplier 1.0)', () => {
  assert.strictEqual(getBenchmark('google_search', 'general_recruitment', 'us', 'cpc'), 3.0);
});

test('applies geo multiplier to CPC', () => {
  // 3.00 * 1.15 (uk) = 3.45
  assert.ok(Math.abs(getBenchmark('google_search', 'general_recruitment', 'uk', 'cpc') - 3.45) < 1e-9);
});

test('does not apply geo multiplier to CTR', () => {
  assert.strictEqual(getBenchmark('google_search', 'general_recruitment', 'uk', 'ctr'), 6.5);
});

test('derives CPM from CPC and CTR', () => {
  // 3.00 * (6.5/100) * 1000 = 195
  assert.ok(Math.abs(getBenchmark('google_search', 'general_recruitment', 'us', 'cpm') - 195) < 1e-9);
});

test('throws on unknown channel/industry/metric', () => {
  assert.throws(() => getBenchmark('tiktok', 'general_recruitment', 'us', 'cpc'));
  assert.throws(() => getBenchmark('google_search', 'aerospace', 'us', 'cpc'));
  assert.throws(() => getBenchmark('google_search', 'general_recruitment', 'us', 'roi'));
});

test('tables are exported and non-empty', () => {
  assert.ok(Object.keys(BENCHMARKS).length >= 5);
  assert.strictEqual(GEO_MULTIPLIER.us, 1.0);
});
