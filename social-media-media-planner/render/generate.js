'use strict';

const { projectPlan } = require('../lib');
const { prepareForRender } = require('./gate');
const { buildDeckModel } = require('./viewmodel');
const { renderDeck, renderDeckBuffer } = require('./render');
const { buildTargeting } = require('./modules/targeting');
const { buildKeywords } = require('./modules/keywords');

// Build toggled modules (targeting/keywords) from the brief if requested and not
// already supplied. Insights are supplied by the skill (researched), never built here.
function withModules(plan) {
  const mods = plan.modules || {};
  const next = { ...plan };
  if (mods.targeting && !next.targeting) next.targeting = buildTargeting(plan);
  if (mods.keywords && !next.keywords) next.keywords = buildKeywords(plan);
  return next;
}

async function generate(plan, outPath) {
  const enriched = withModules(plan);
  const projected = projectPlan(enriched);
  const { warnings } = prepareForRender(enriched, projected); // throws on hard errors
  const deckModel = buildDeckModel(enriched, projected);
  const { slideCount } = await renderDeck(deckModel, outPath);
  return { outPath, slideCount, warnings };
}

async function generateBuffer(plan) {
  const enriched = withModules(plan);
  const projected = projectPlan(enriched);
  const { warnings } = prepareForRender(enriched, projected); // throws on hard errors
  const deckModel = buildDeckModel(enriched, projected);
  const { buffer, slideCount } = await renderDeckBuffer(deckModel);
  return { buffer, slideCount, warnings };
}

module.exports = { generate, generateBuffer, withModules };
