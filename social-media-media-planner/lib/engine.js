'use strict';

const { getBenchmark } = require('./benchmarks');

// Margin scales cost rates. Higher margin -> higher cost -> fewer clicks.
function applyMargin(rate, marginMultiplier) {
  return rate * marginMultiplier;
}

function projectChannel({ channelBudget, channel, industry, geo, marginMultiplier = 1.0 }) {
  const cpc = applyMargin(getBenchmark(channel, industry, geo, 'cpc'), marginMultiplier);
  const ctr = getBenchmark(channel, industry, geo, 'ctr'); // unaffected by margin
  const clicks = channelBudget / cpc;
  const impressions = clicks * 100 / ctr;
  const cpm = cpc * (ctr / 100) * 1000;
  return { channel, budget: channelBudget, cpc, ctr, cpm, clicks, impressions };
}

module.exports = { applyMargin, projectChannel };
