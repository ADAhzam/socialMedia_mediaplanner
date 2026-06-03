'use strict';

const { projectPlan } = require('../lib');
const { prepareForRender } = require('./gate');
const { buildDeckModel } = require('./viewmodel');
const { renderDeck } = require('./render');

// Full pipeline: plan -> projection -> validation gate -> view model -> rendered deck.
// Throws if hard validation fails (no file written). Returns { outPath, slideCount, warnings }.
async function generate(plan, outPath) {
  const projected = projectPlan(plan);
  const { warnings } = prepareForRender(plan, projected); // throws on hard errors
  const deckModel = buildDeckModel(plan, projected);
  const { slideCount } = await renderDeck(deckModel, outPath);
  return { outPath, slideCount, warnings };
}

module.exports = { generate };
