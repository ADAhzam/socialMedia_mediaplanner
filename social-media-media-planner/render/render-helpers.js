'use strict';

// Factory: never reuse a shadow object across shapes (pptxgenjs mutates it).
function makeShadow() {
  return { type: 'outer', blur: 8, offset: 3, angle: 135, color: '000000', opacity: 0.10 };
}

// Footer on every content slide; text already has the date substituted by the viewmodel.
function addFooter(pres, slide, footerText, palette) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.275,
    fill: { color: palette.OFFWHT }, line: { color: palette.MGRAY, width: 0.5 },
  });
  slide.addText(footerText, {
    x: 0.2, y: 5.36, w: 9.6, h: 0.25,
    fontSize: 8, color: '999999', fontFace: 'Calibri', align: 'center', valign: 'middle',
  });
}

// Light content slide with header bar + accent strip + title (+ optional RECOMMENDED tag).
function contentSlide(pres, deckModel, title, tag = '') {
  const p = deckModel.brand.palette;
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: p.LGRAY }, line: { color: p.LGRAY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.65, fill: { color: p.WHITE }, line: { color: p.MGRAY, width: 0.5 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.07, h: 0.65, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
  s.addText(title, { x: 0.25, y: 0.08, w: 7.5, h: 0.48, fontSize: 20, bold: true, color: p.NAVY, fontFace: 'Calibri', valign: 'middle' });
  if (tag) {
    s.addShape(pres.shapes.RECTANGLE, { x: 8.0, y: 0.12, w: 1.6, h: 0.4, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
    s.addText(tag, { x: 8.0, y: 0.12, w: 1.6, h: 0.4, fontSize: 10, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
  }
  addFooter(pres, s, deckModel.brand.footerText, p);
  return s;
}

// Dark full-bleed slide (cover/close); no footer.
function darkSlide(pres, deckModel) {
  const p = deckModel.brand.palette;
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: p.NAVY }, line: { color: p.NAVY } });
  return s;
}

function statCard(pres, slide, x, y, w, h, bigText, labelText, palette, bigColor, bgColor) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: bgColor || palette.WHITE }, line: { color: palette.MGRAY, width: 0.5 }, shadow: makeShadow() });
  slide.addText(bigText, { x, y: y + 0.08, w, h: h * 0.52, fontSize: 26, bold: true, color: bigColor || palette.ACCENT, align: 'center', valign: 'bottom', fontFace: 'Calibri' });
  slide.addText(labelText, { x, y: y + h * 0.58, w, h: h * 0.38, fontSize: 9.5, color: palette.DGRAY, align: 'center', valign: 'top', fontFace: 'Calibri' });
}

// Horizontal budget bar (label | bar | value). pct is 0..1. barMaxW caps width to avoid overflow.
function budgetBarRow(pres, slide, x, y, label, valueLabel, pct, color, palette, rowH = 0.42, barMaxW = 4.6) {
  const barW = Math.max(barMaxW * pct, 0.05);
  slide.addText(label, { x, y, w: 3.0, h: rowH, fontSize: 10, color: palette.WHITE, fontFace: 'Calibri', valign: 'middle' });
  slide.addShape(pres.shapes.RECTANGLE, { x: x + 3.1, y: y + 0.05, w: barW, h: rowH - 0.1, fill: { color }, line: { color } });
  slide.addText(valueLabel, { x: x + 3.1 + barW + 0.1, y, w: 1.6, h: rowH, fontSize: 10, bold: true, color: palette.WHITE, fontFace: 'Calibri', valign: 'middle' });
}

module.exports = { makeShadow, addFooter, contentSlide, darkSlide, statCard, budgetBarRow };
