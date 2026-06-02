'use strict';

const benchmarks = require('./benchmarks');
const engine = require('./engine');
const validate = require('./validate');

module.exports = {
  ...benchmarks,
  ...engine,
  ...validate,
};
