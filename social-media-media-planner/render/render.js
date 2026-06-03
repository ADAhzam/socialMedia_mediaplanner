'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const { contentSlide, darkSlide, statCard, budgetBarRow, makeShadow, addFooter } = require('./render-helpers');

function coverSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  if (dm.brand.showJoveo) {
    s.addText(dm.brand.showYoke ? 'joveo | yoke' : 'joveo', { x: 0.45, y: 0.4, w: 6, h: 0.5, fontSize: 22, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  }
  // Client logo — prominent, top-right (PRD: client-branded reports). Only if a path was provided.
  if (dm.brand.clientLogoPath) {
    s.addImage({ path: dm.brand.clientLogoPath, x: 7.9, y: 0.35, w: 1.65, h: 0.7, sizing: { type: 'contain', w: 1.65, h: 0.7 } });
  }
  s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 1.1, w: 9.1, h: 0.02, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
  s.addText([{ text: dm.client, options: { color: p.WHITE } }], { x: 0.45, y: 1.3, w: 8.5, h: 0.9, fontSize: 42, bold: true, fontFace: 'Calibri' });
  s.addText(dm.archetype === 'jobad' ? 'Recruitment Media Plan' : 'Employer Branding Media Plan', { x: 0.45, y: 2.3, w: 8, h: 0.45, fontSize: 16, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`${dm.objectiveLabel} · ${dm.geoLabel}`, { x: 0.45, y: 2.85, w: 8.5, h: 0.35, fontSize: 12, color: p.SUBTLE, fontFace: 'Calibri' });
  return s;
}

function opportunitySlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'The Opportunity');
  s.addText('TARGET LOCATIONS', { x: 0.45, y: 0.85, w: 9, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  dm.locations.slice(0, 5).forEach((loc, i) => {
    const x = 0.45 + i * 1.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.15, w: 1.75, h: 0.65, fill: { color: i === 0 ? p.ACCENT : p.LGRAY }, line: { color: p.MGRAY, width: 0.5 } });
    s.addText(loc.name, { x, y: 1.2, w: 1.75, h: 0.32, fontSize: 10, bold: true, color: i === 0 ? p.WHITE : p.NAVY, align: 'center', fontFace: 'Calibri' });
    s.addText(loc.detail || '', { x, y: 1.5, w: 1.75, h: 0.25, fontSize: 8.5, color: i === 0 ? p.WHITE : p.DGRAY, align: 'center', fontFace: 'Calibri' });
  });
  s.addText('ROLE CATEGORIES', { x: 0.45, y: 2.0, w: 9, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  dm.roleGroups.slice(0, 6).forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.45 + col * 4.6, y = 2.3 + row * 0.62;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.45, h: 0.55, fill: { color: p.WHITE }, line: { color: p.NAVY, width: 0.7 } });
    s.addText(r.name, { x: x + 0.1, y: y + 0.05, w: 4.2, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(r.subtitle || '', { x: x + 0.1, y: y + 0.3, w: 4.2, h: 0.22, fontSize: 8.5, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function budgetOptionsSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  s.addText('Budget Options', { x: 0.45, y: 0.2, w: 8, h: 0.6, fontSize: 30, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  const xs = [0.3, 3.47, 6.63];
  dm.tiers.slice(0, 3).forEach((t, i) => {
    const x = xs[i];
    if (t.recommended) {
      s.addShape(pres.shapes.RECTANGLE, { x, y: 0.95, w: 2.9, h: 0.32, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
      s.addText('★ RECOMMENDED', { x, y: 0.95, w: 2.9, h: 0.32, fontSize: 9, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    }
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.9, h: 3.6, fill: { color: p.WHITE }, line: { color: p.MGRAY, width: 0.5 }, shadow: makeShadow() });
    s.addText(t.name.toUpperCase(), { x: x + 0.15, y: 1.45, w: 2.6, h: 0.3, fontSize: 9, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.budgetLabel, { x: x + 0.15, y: 1.7, w: 2.6, h: 0.6, fontSize: 26, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText('per month', { x: x + 0.15, y: 2.3, w: 2.6, h: 0.25, fontSize: 10, color: p.DGRAY, fontFace: 'Calibri' });
    s.addText('CHANNELS', { x: x + 0.15, y: 2.65, w: 2.6, h: 0.22, fontSize: 9, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.channels.map(c => '• ' + c.label.replace(/\s*\(\d+%\)/, '')).join('\n'), { x: x + 0.15, y: 2.88, w: 2.6, h: 0.9, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
    s.addText('PROJECTED', { x: x + 0.15, y: 3.85, w: 2.6, h: 0.22, fontSize: 9, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.totals.clicksRangeLabel + ' clicks / mo', { x: x + 0.15, y: 4.07, w: 2.6, h: 0.25, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.totals.impressionsRangeLabel + ' impr / mo', { x: x + 0.15, y: 4.32, w: 2.6, h: 0.25, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
  });
  addFooter(pres, s, dm.brand.footerText, p);
  return s;
}

function structureSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'Campaign Structure');
  s.addText('A channel-led approach across the funnel', { x: 0.25, y: 0.62, w: 9, h: 0.3, fontSize: 11, color: p.DGRAY, fontFace: 'Calibri' });
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  rec.channels.slice(0, 6).forEach((c, i) => {
    const x = 0.35 + (i % 3) * 3.1, y = 1.1 + Math.floor(i / 3) * 1.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.95, h: 1.7, fill: { color: p.WHITE }, line: { color: p.NAVY, width: 0.7 }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.95, h: 0.5, fill: { color: i === 0 ? p.NAVY : i === 1 ? p.ACCENT : p.BLUE }, line: { color: p.MGRAY } });
    s.addText(c.label, { x: x + 0.12, y: y + 0.08, w: 2.7, h: 0.34, fontSize: 10, bold: true, color: p.WHITE, fontFace: 'Calibri', valign: 'middle' });
    s.addText(c.budgetLabel + ' / mo', { x: x + 0.12, y: y + 0.6, w: 2.7, h: 0.4, fontSize: 14, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText(c.clicksRangeLabel + ' clicks', { x: x + 0.12, y: y + 1.05, w: 2.7, h: 0.3, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function allocationSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText('Budget Allocation', { x: 0.45, y: 0.2, w: 8, h: 0.6, fontSize: 28, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`${rec.budgetLabel} / month · ${rec.name}`, { x: 0.45, y: 0.78, w: 8, h: 0.3, fontSize: 11, color: p.SUBTLE, fontFace: 'Calibri' });
  const colors = [p.ACCENT, p.BLUE, p.MGRAY, p.GREEN, p.SUBTLE];
  rec.channels.slice(0, 6).forEach((c, i) => {
    budgetBarRow(pres, s, 0.45, 1.3 + i * 0.62, c.label, c.budgetLabel, c.pct, colors[i % colors.length], p);
  });
  addFooter(pres, s, dm.brand.footerText, p);
  return s;
}

function performanceSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText('Projected Performance', { x: 0.45, y: 0.15, w: 9, h: 0.55, fontSize: 28, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`What ${rec.budgetLabel} / month delivers`, { x: 0.45, y: 0.7, w: 9, h: 0.3, fontSize: 11, color: p.SUBTLE, fontFace: 'Calibri' });
  const cards = [
    { big: rec.budgetLabel, label: 'Monthly Investment', bg: p.ACCENT, color: p.WHITE },
    { big: rec.totals.clicksRangeLabel, label: 'Est. Clicks / mo', bg: p.WHITE, color: p.NAVY },
    { big: rec.totals.impressionsRangeLabel, label: 'Est. Impressions / mo', bg: p.OFFWHT, color: p.NAVY },
    { big: rec.totals.cpcLabel, label: 'Avg CPC (blended)', bg: p.WHITE, color: p.NAVY },
  ];
  cards.forEach((c, i) => {
    const x = 0.45 + i * 2.32;
    statCard(pres, s, x, 1.1, 2.15, 1.3, c.big, c.label, p, c.color, c.bg);
  });
  addFooter(pres, s, dm.brand.footerText, p);
  return s;
}

function tableSlide(pres, dm, title, rows) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, title);
  const header = [
    { text: 'KPI Category', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
    { text: 'Metric', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
    { text: 'Channel / Source', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
  ];
  const body = rows.map((r, i) => r.map((cell) => ({ text: cell, options: { color: p.DGRAY, fill: { color: i % 2 === 0 ? p.WHITE : p.OFFWHT } } })));
  s.addTable([header, ...body], { x: 0.4, y: 0.9, w: 9.2, colW: [2.6, 4.0, 2.6], fontSize: 10, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.5 });
  return s;
}

function nextStepsSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'Next Steps');
  const steps = [
    ['Confirm Budget Tier', 'Select a tier to lock the plan and brief the build team.'],
    ['Finalise Geo & Role Priorities', 'Confirm which locations and roles go live first.'],
    ['Tracking & Pixel Setup', 'Install Meta Pixel + Google Tag and configure UTMs.'],
    ['Creative & Asset Collection', 'Gather approved imagery, video, and copy per channel.'],
    ['Build & Launch', 'Internal QA → client review → sign-off → live.'],
  ];
  steps.forEach((st, i) => {
    const y = 0.85 + i * 0.82;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y, w: 0.42, h: 0.42, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
    s.addText(String(i + 1), { x: 0.45, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    s.addText(st[0], { x: 0.95, y, w: 8.5, h: 0.3, fontSize: 11, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText(st[1], { x: 0.95, y: y + 0.3, w: 8.5, h: 0.4, fontSize: 10, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function closeSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  s.addText([{ text: `Let's Build ${dm.client}'s Plan`, options: { color: p.WHITE } }], { x: 0.45, y: 1.4, w: 9, h: 1.2, fontSize: 38, bold: true, fontFace: 'Calibri' });
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText(`${rec.budgetLabel} / month · ${rec.totals.clicksRangeLabel} projected clicks`, { x: 0.45, y: 2.7, w: 9, h: 0.4, fontSize: 13, color: p.SUBTLE, fontFace: 'Calibri' });
  if (dm.brand.showJoveo) {
    s.addText(dm.brand.showYoke ? 'joveo | yoke' : 'joveo', { x: 0.45, y: 4.8, w: 6, h: 0.4, fontSize: 18, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  }
  return s;
}

function targetingSlide(pres, dm) {
  const p = dm.brand.palette;
  const t = dm.modules.targeting;
  const s = contentSlide(pres, dm, 'Audience Targeting Strategy');
  // Meta panel (left)
  s.addText('META — Special Ad Category (Recruitment)', { x: 0.45, y: 0.8, w: 4.5, h: 0.28, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  const metaLines = [
    `Location: ${t.meta.location}`,
    t.meta.locked,
    `Function: ${(t.meta.interestFunction || []).join(', ')}`,
    `Industry: ${(t.meta.interestIndustry || []).join(', ')}`,
    `Career intent: ${(t.meta.careerIntent || []).join(', ')}`,
    `Retargeting: ${(t.meta.retargeting || []).join('; ')}`,
  ];
  s.addText(metaLines.map(l => '• ' + l).join('\n'), { x: 0.45, y: 1.1, w: 4.5, h: 2.6, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'top' });
  s.addText(t.meta.note, { x: 0.45, y: 3.7, w: 4.5, h: 0.9, fontSize: 9, italic: true, color: p.ACCENT, fontFace: 'Calibri', valign: 'top' });
  // Google panel (right)
  s.addText('GOOGLE — Intent & Conquest', { x: 5.1, y: 0.8, w: 4.45, h: 0.28, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  const gLines = [
    `In-market: ${(t.google.inMarketAudiences || []).join(', ')}`,
    `Custom-intent URLs: ${(t.google.customIntentUrls || []).join(', ')}`,
    `Geo: ${t.google.geo}`,
    `Negative geo: ${(t.google.negativeGeo || []).join(', ') || 'none'}`,
    t.google.competitorConquest,
  ];
  s.addText(gLines.map(l => '• ' + l).join('\n'), { x: 5.1, y: 1.1, w: 4.45, h: 3.0, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'top' });
  return s;
}

function keywordSlide(pres, dm) {
  const p = dm.brand.palette;
  const k = dm.modules.keywords;
  const s = contentSlide(pres, dm, 'Keyword Strategy');
  const header = ['Role', 'Type', 'Match', 'Example terms'].map(h => ({ text: h, options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } }));
  const rows = k.clusters.slice(0, 8).map((c, i) => [c.role, c.type, c.matchType, (c.terms || []).slice(0, 3).join('; ')]
    .map(cell => ({ text: cell, options: { color: p.DGRAY, fill: { color: i % 2 ? p.OFFWHT : p.WHITE } } })));
  s.addTable([header, ...rows], { x: 0.4, y: 0.85, w: 9.2, colW: [2.2, 1.9, 1.0, 4.1], fontSize: 9, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.36 });
  const negs = (k.negatives || []).map(n => n.term).join(' · ');
  s.addText('Negative keywords: ' + negs, { x: 0.4, y: 4.55, w: 9.2, h: 0.5, fontSize: 9, italic: true, color: p.ACCENT, fontFace: 'Calibri' });
  return s;
}

function marketLandscapeSlide(pres, dm) {
  const p = dm.brand.palette;
  const m = dm.modules.insights.marketLandscape;
  const s = contentSlide(pres, dm, 'Market Landscape: Supply & Demand');
  const cards = [
    { big: m.talentPool, label: 'Talent Pool' },
    { big: m.activeSeekers, label: 'Active Seekers' },
    { big: m.supplyDemand, label: 'Supply : Demand' },
    { big: m.timeToFill, label: 'Avg Time-to-Fill' },
  ];
  cards.forEach((c, i) => statCard(pres, s, 0.45 + i * 2.32, 0.85, 2.15, 1.2, String(c.big), c.label, p, p.NAVY, p.WHITE));
  const header = ['Metric', 'Value', 'Strategic Implication'].map(h => ({ text: h, options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } }));
  const rows = (m.rows || []).slice(0, 5).map((r, i) => r.map(cell => ({ text: String(cell), options: { color: p.DGRAY, fill: { color: i % 2 ? p.OFFWHT : p.WHITE } } })));
  s.addTable([header, ...rows], { x: 0.4, y: 2.25, w: 9.2, colW: [2.6, 2.0, 4.6], fontSize: 9.5, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.42 });
  if (m.sources && m.sources.length) {
    s.addText('Sources: ' + m.sources.join(' · '), { x: 0.4, y: 4.9, w: 9.2, h: 0.3, fontSize: 7.5, color: '999999', fontFace: 'Calibri' });
  }
  return s;
}

function activePassiveSlide(pres, dm) {
  const p = dm.brand.palette;
  const a = dm.modules.insights.activePassive;
  const s = contentSlide(pres, dm, 'Active vs Passive Audience');
  s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 1.0, w: 5.6, h: 3.0, fill: { color: p.NAVY }, line: { color: p.NAVY } });
  s.addText(`${a.passivePct}%`, { x: 0.45, y: 1.2, w: 5.6, h: 1.4, fontSize: 60, bold: true, color: p.WHITE, align: 'center', fontFace: 'Calibri' });
  s.addText('Passively employed', { x: 0.45, y: 2.7, w: 5.6, h: 0.4, fontSize: 14, color: p.SUBTLE, align: 'center', fontFace: 'Calibri' });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.0, w: 3.35, h: 3.0, fill: { color: p.LGRAY }, line: { color: p.MGRAY } });
  s.addText(`${a.activePct}%`, { x: 6.2, y: 1.3, w: 3.35, h: 1.0, fontSize: 40, bold: true, color: p.NAVY, align: 'center', fontFace: 'Calibri' });
  s.addText('Actively looking', { x: 6.2, y: 2.4, w: 3.35, h: 0.4, fontSize: 12, color: p.DGRAY, align: 'center', fontFace: 'Calibri' });
  if (a.note) s.addText(a.note, { x: 0.45, y: 4.2, w: 9.1, h: 0.5, fontSize: 11, italic: true, color: p.ACCENT, align: 'center', fontFace: 'Calibri' });
  return s;
}

function competitiveSlide(pres, dm) {
  const p = dm.brand.palette;
  const c = dm.modules.insights.competitive;
  const s = contentSlide(pres, dm, 'Competitive Landscape');
  (c.competitors || []).slice(0, 6).forEach((comp, i) => {
    const y = 0.9 + i * 0.62;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y, w: 9.1, h: 0.52, fill: { color: i % 2 ? p.OFFWHT : p.WHITE }, line: { color: p.MGRAY, width: 0.5 } });
    s.addText(comp.name, { x: 0.6, y: y + 0.05, w: 3.0, h: 0.42, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri', valign: 'middle' });
    s.addText(comp.note || '', { x: 3.7, y: y + 0.05, w: 5.7, h: 0.42, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'middle' });
  });
  if (c.sources && c.sources.length) {
    s.addText('Sources: ' + c.sources.join(' · '), { x: 0.45, y: 4.9, w: 9.1, h: 0.3, fontSize: 7.5, color: '999999', fontFace: 'Calibri' });
  }
  return s;
}

const MEASUREMENT_ROWS = [
  ['Brand / Awareness', 'Impressions · Reach · Video views', 'Meta (all formats)'],
  ['Engagement', 'Clicks / link clicks · CTR', 'All channels'],
  ['Conversion', 'Careers-page visits · Application starts', 'All channels → ATS'],
  ['Hire (Primary KPI)', 'Applications → Interview → Hire · CPH', 'ATS feedback'],
];

async function renderDeck(deckModel, outPath) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = deckModel.brand.showJoveo ? 'Joveo' : deckModel.client;
  pres.company = deckModel.brand.showJoveo ? 'Joveo' : deckModel.client;
  pres.title = `${deckModel.client} Media Plan`;

  const mods = deckModel.modules || {};
  const ins = mods.insights || {};
  const builders = [
    coverSlide, opportunitySlide, budgetOptionsSlide, structureSlide,
    allocationSlide, performanceSlide,
    (pr, dm) => tableSlide(pr, dm, 'Measurement Framework', MEASUREMENT_ROWS),
  ];
  if (mods.targeting) builders.push(targetingSlide);
  if (mods.keywords) builders.push(keywordSlide);
  if (ins.marketLandscape) builders.push(marketLandscapeSlide);
  if (ins.activePassive) builders.push(activePassiveSlide);
  if (ins.competitive) builders.push(competitiveSlide);
  builders.push(nextStepsSlide, closeSlide);

  builders.forEach((b) => b(pres, deckModel));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pres.writeFile({ fileName: outPath });
  return { outPath, slideCount: builders.length };
}

module.exports = { renderDeck };
