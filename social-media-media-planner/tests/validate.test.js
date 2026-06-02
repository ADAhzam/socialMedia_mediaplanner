const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib/engine');
const { validateHard } = require('../lib/validate');

function goodPlan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    tiers: [{
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    }],
  };
}

test('a consistent plan produces no hard errors', () => {
  const plan = goodPlan();
  assert.deepStrictEqual(validateHard(plan, projectPlan(plan)), []);
});

test('allocations not summing to 100 is a hard error', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  const errs = validateHard(plan, projectPlan(plan));
  assert.ok(errs.some(e => /sum to 100/i.test(e)));
});

test('a leftover {{placeholder}} anywhere is a hard error', () => {
  const plan = goodPlan();
  plan.tiers[0].name = 'Tier {{n}}';
  const errs = validateHard(plan, projectPlan(plan));
  assert.ok(errs.some(e => /placeholder/i.test(e)));
});

test('an inverted range is a hard error', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  projected.tiers[0].channels[0].clicksRange = { low: 100, high: 10 }; // inverted
  const errs = validateHard(plan, projected);
  assert.ok(errs.some(e => /inverted range/i.test(e)));
});

const { validateSoft } = require('../lib/validate');

test('a realistic plan produces no soft warnings', () => {
  const plan = goodPlan();
  assert.deepStrictEqual(validateSoft(plan, projectPlan(plan)), []);
});

test('CPC above $9.00 warns (override allowed)', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  projected.tiers[0].channels[0].cpc = 12.0; // google_search
  const warns = validateSoft(plan, projected);
  assert.ok(warns.some(w => /CPC/i.test(w) && /google_search/.test(w)));
});

test('a sub-$300 channel budget warns', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 2, meta_feed_image: 58, meta_feed_video: 40 };
  const projected = projectPlan(plan);
  const warns = validateSoft(plan, projected);
  // google_search = 2% of 5000 = $100 < $300
  assert.ok(warns.some(w => /below \$300/i.test(w) && /google_search/.test(w)));
});

test('Google Search CPC not exceeding Meta CPC warns', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  const gs = projected.tiers[0].channels.find(c => c.channel === 'google_search');
  const mi = projected.tiers[0].channels.find(c => c.channel === 'meta_feed_image');
  gs.cpc = 1.0; mi.cpc = 2.0; // invert the expected ordering
  const warns = validateSoft(plan, projected);
  assert.ok(warns.some(w => /Google Search CPC/i.test(w)));
});
