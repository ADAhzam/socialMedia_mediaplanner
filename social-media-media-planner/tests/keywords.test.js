const { test } = require('node:test');
const assert = require('node:assert');
const { buildKeywords } = require('../render/modules/keywords');

function plan() {
  return {
    client: { name: 'Acme Care' },
    geoLabel: 'Manchester',
    roleGroups: [{ name: 'Registered Nurse' }, { name: 'Healthcare Assistant' }],
  };
}

test('produces three cluster types per role with correct match types', () => {
  const k = buildKeywords(plan());
  const nurse = k.clusters.filter(c => c.role === 'Registered Nurse');
  const types = nurse.map(c => c.type);
  assert.ok(types.includes('Function + Location'));
  assert.ok(types.includes('Brand'));
  assert.ok(types.includes('Exploratory'));
  const fnl = nurse.find(c => c.type === 'Function + Location');
  assert.strictEqual(fnl.matchType, 'Phrase');
  assert.strictEqual(nurse.find(c => c.type === 'Brand').matchType, 'Exact');
  assert.strictEqual(nurse.find(c => c.type === 'Exploratory').matchType, 'Broad');
});

test('function+location terms include role + geo; brand terms include the company', () => {
  const k = buildKeywords(plan());
  const fnl = k.clusters.find(c => c.role === 'Registered Nurse' && c.type === 'Function + Location');
  assert.ok(fnl.terms.some(t => /registered nurse jobs manchester/i.test(t)));
  const brand = k.clusters.find(c => c.role === 'Registered Nurse' && c.type === 'Brand');
  assert.ok(brand.terms.some(t => /acme care/i.test(t)));
});

test('standard negatives are present with reasons', () => {
  const k = buildKeywords(plan());
  const terms = k.negatives.map(n => n.term);
  assert.ok(terms.includes('internship'));
  assert.ok(terms.includes('part time'));
  assert.ok(terms.includes('volunteer'));
  assert.ok(k.negatives.every(n => typeof n.reason === 'string' && n.reason.length > 0));
});
