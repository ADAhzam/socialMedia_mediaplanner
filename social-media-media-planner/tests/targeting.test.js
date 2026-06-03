const { test } = require('node:test');
const assert = require('node:assert');
const { buildTargeting } = require('../render/modules/targeting');

function plan() {
  return {
    industry: 'healthcare',
    geoLabel: '25-mile radius, Manchester',
    geoExclusions: ['Liverpool'],
    competitors: ['Bupa', 'HC-One'],
    roleGroups: [{ name: 'Registered Nurse' }, { name: 'Healthcare Assistant' }],
  };
}

test('Meta block applies Special Ad Category and fixed career-intent interests', () => {
  const t = buildTargeting(plan());
  assert.strictEqual(t.meta.specialAdCategory, true);
  assert.match(t.meta.locked, /18\+/);
  assert.deepStrictEqual(t.meta.careerIntent, ['Job hunting', 'Career development', 'Employment']);
  assert.ok(t.meta.location.includes('Manchester'));
  assert.ok(t.meta.note.toLowerCase().includes('creative')); // self-select via creative
});

test('Meta interest layers include role titles and the industry interest', () => {
  const t = buildTargeting(plan());
  assert.ok(t.meta.interestFunction.includes('Registered Nurse'));
  assert.ok(t.meta.interestIndustry.length > 0);
});

test('Google block carries in-market audience, competitor job-board URLs, and negative geo', () => {
  const t = buildTargeting(plan());
  assert.ok(t.google.inMarketAudiences.some(a => /jobs/i.test(a)));
  assert.ok(t.google.customIntentUrls.includes('indeed.com'));
  assert.deepStrictEqual(t.google.negativeGeo, ['Liverpool']);
});

test('competitors surface as a Google competitor-conquest note', () => {
  const t = buildTargeting(plan());
  assert.ok(t.google.competitorConquest.includes('Bupa'));
});
