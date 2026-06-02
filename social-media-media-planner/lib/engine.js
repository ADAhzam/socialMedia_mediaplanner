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

function toRange(value, { lowMult = 0.6, highMult = 1.5 } = {}) {
  return { low: value * lowMult, high: value * highMult };
}

function applyBoundary(value, { anchor, tolerancePct }) {
  const low = anchor * (1 - tolerancePct / 100);
  const high = anchor * (1 + tolerancePct / 100);
  if (value < low) return { value: low, clamped: true };
  if (value > high) return { value: high, clamped: true };
  return { value, clamped: false };
}

module.exports = { applyMargin, projectChannel, toRange, applyBoundary };
