'use strict';

const { validateHard, validateSoft } = require('../lib');
const { validateInsights } = require('./modules/insights');

function prepareForRender(plan, projected) {
  const errors = validateHard(plan, projected);
  if (errors.length > 0) {
    throw new Error('Cannot render — hard validation failed:\n- ' + errors.join('\n- '));
  }
  const warnings = [...validateSoft(plan, projected), ...validateInsights(plan)];
  return { warnings };
}

module.exports = { prepareForRender };
