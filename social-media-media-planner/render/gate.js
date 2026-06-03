'use strict';

const { validateHard, validateSoft } = require('../lib');

// Blocking gate: throws if any hard rule fails; otherwise returns soft warnings.
function prepareForRender(plan, projected) {
  const errors = validateHard(plan, projected);
  if (errors.length > 0) {
    throw new Error('Cannot render — hard validation failed:\n- ' + errors.join('\n- '));
  }
  return { warnings: validateSoft(plan, projected) };
}

module.exports = { prepareForRender };
