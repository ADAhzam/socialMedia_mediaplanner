const { test } = require('node:test');
const assert = require('node:assert');
const { fmtMoney, fmtK, fmtClicks, fmtRangeK, fmtRangeClicks, fmtPct } = require('../render/format');

test('fmtMoney formats whole dollars with thousands separators', () => {
  assert.strictEqual(fmtMoney(5000), '$5,000');
  assert.strictEqual(fmtMoney(14000), '$14,000');
  assert.strictEqual(fmtMoney(0), '$0');
});

test('fmtK abbreviates thousands and millions', () => {
  assert.strictEqual(fmtK(500), '500');
  assert.strictEqual(fmtK(428000), '428K');
  assert.strictEqual(fmtK(215000), '215K');
  assert.strictEqual(fmtK(1050000), '1.05M');
});

test('fmtClicks rounds and adds thousands separators', () => {
  assert.strictEqual(fmtClicks(1666.6667), '1,667');
  assert.strictEqual(fmtClicks(200), '200');
});

test('fmtRangeK joins with an en-dash', () => {
  assert.strictEqual(fmtRangeK(160000, 400000), '160K – 400K');
});

test('fmtRangeClicks joins click counts with an en-dash', () => {
  assert.strictEqual(fmtRangeClicks(1490, 3600), '1,490 – 3,600');
});

test('fmtPct shows one decimal place', () => {
  assert.strictEqual(fmtPct(1.4), '1.4%');
  assert.strictEqual(fmtPct(1.45), '1.5%');
});
