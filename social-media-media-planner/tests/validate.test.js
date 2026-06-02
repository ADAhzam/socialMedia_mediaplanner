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
