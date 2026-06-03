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
  s.addText(`${dm.objectiveLabel}`, { x: 0.45, y: 2.3, w: 8, h: 0.45, fontSize: 16, color: p.WHITE, fontFace: 'Calibri' });
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

const MEASUREMENT_ROWS = [
  ['Brand / Awareness', 'Impressions · Reach · Video views', 'Meta (all formats)'],
  ['Engagement', 'Clicks / link clicks · CTR', 'All channels'],
  ['Conversion', 'Careers-page visits · Application starts', 'All channels → ATS'],
  ['Hire (Primary KPI)', 'Applications → Interview → Hire · CPH', 'ATS feedback'],
];

async function renderDeck(deckModel, outPath) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Joveo';
  pres.title = `${deckModel.client} Media Plan`;

  coverSlide(pres, deckModel);
  opportunitySlide(pres, deckModel);
  budgetOptionsSlide(pres, deckModel);
  structureSlide(pres, deckModel);
  allocationSlide(pres, deckModel);
  performanceSlide(pres, deckModel);
  tableSlide(pres, deckModel, 'Measurement Framework', MEASUREMENT_ROWS);
  nextStepsSlide(pres, deckModel);
  closeSlide(pres, deckModel);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pres.writeFile({ fileName: outPath });
  return { outPath, slideCount: 9 };
}

module.exports = { renderDeck };
