const { test } = require('node:test');
const assert = require('node:assert');
const { resolveBrand } = require('../render/brand');

test('joveo mode shows Joveo + Yoke marks and uses Joveo palette', () => {
  const b = resolveBrand('joveo', { name: 'Acme Care' });
  assert.strictEqual(b.showJoveo, true);
  assert.strictEqual(b.showYoke, true);
  assert.strictEqual(b.palette.ACCENT, b.palette.CRIMSON); // no client color -> accent is crimson
  assert.strictEqual(b.footerText.includes('Joveo'), true);
});

test('cobranded mode shows Joveo + client logo and uses client accent', () => {
  const b = resolveBrand('cobranded', { name: 'Acme Care', accentColor: '00A1E0', logoPath: '/tmp/logo.png' });
  assert.strictEqual(b.showJoveo, true);
  assert.strictEqual(b.clientLogoPath, '/tmp/logo.png');
  assert.strictEqual(b.palette.ACCENT, '00A1E0'); // client accent overrides
});

test('whitelabel mode removes ALL Joveo marks and footer mentions only the client', () => {
  const b = resolveBrand('whitelabel', { name: 'Acme Care' });
  assert.strictEqual(b.showJoveo, false);
  assert.strictEqual(b.showYoke, false);
  assert.strictEqual(b.footerText.includes('Joveo'), false);
  assert.strictEqual(b.footerText.includes('Acme Care'), true);
});

test('unknown mode throws', () => {
  assert.throws(() => resolveBrand('rainbow', { name: 'X' }));
});
