const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { prepareForRender } = require('../render/gate');

function goodPlan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    tiers: [{
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    }],
  };
}

test('a valid plan passes the gate and returns warnings array', () => {
  const plan = goodPlan();
  const res = prepareForRender(plan, projectPlan(plan));
  assert.ok(Array.isArray(res.warnings));
});

test('hard validation errors throw (blocking)', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  assert.throws(() => prepareForRender(plan, projectPlan(plan)), /sum to 100/i);
});

test('soft warnings are surfaced, not thrown', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 2, meta_feed_image: 58, meta_feed_video: 40 }; // GS = $100 < $300
  const res = prepareForRender(plan, projectPlan(plan));
  assert.ok(res.warnings.some(w => /below \$300/i.test(w)));
});
