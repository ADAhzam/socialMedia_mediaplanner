'use strict';

const { JOVEO } = require('./palette');

const MODES = ['joveo', 'cobranded', 'whitelabel'];

// Resolve which marks show + the effective palette + footer text for a brand mode.
// client: { name, primaryColor?, accentColor?, logoPath?, fonts? }
function resolveBrand(mode, client) {
  if (!MODES.includes(mode)) {
    throw new Error(`Unknown brand mode: ${mode} (expected one of ${MODES.join(', ')})`);
  }
  const accent = client.accentColor || JOVEO.CRIMSON;
  const primary = client.primaryColor || JOVEO.NAVY;
  const palette = { ...JOVEO, ACCENT: accent, PRIMARY: primary };

  const showJoveo = mode !== 'whitelabel';
  const showYoke = mode === 'joveo';
  const clientLogoPath = client.logoPath || null;

  // Footer text: Joveo-branded in joveo/cobranded; client-only in whitelabel.
  const footerText = showJoveo
    ? `Joveo Employer Branding  |  Prepared for ${client.name}  |  {DATE}  |  Confidential`
    : `${client.name}  |  Media Plan  |  {DATE}  |  Confidential`;

  return { mode, showJoveo, showYoke, clientLogoPath, palette, footerText };
}

module.exports = { resolveBrand, MODES };
