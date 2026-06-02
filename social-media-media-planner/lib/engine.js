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

function applyOverrides(projection, overrides = {}) {
  return { ...projection, ...overrides };
}

function budgetFromHires({ hires, applyToHireRatio, targetCpa }) {
  if (!(hires > 0) || !(applyToHireRatio > 0) || !(targetCpa > 0)) {
    throw new Error('hires, applyToHireRatio, and targetCpa must all be positive');
  }
  const appsTarget = hires * applyToHireRatio;
  const budget = appsTarget * targetCpa;
  return { appsTarget, budget };
}

function recommendTier(tiers, { targetBudget } = {}) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error('tiers must be a non-empty array');
  }
  if (typeof targetBudget === 'number') {
    let best = 0;
    let bestDist = Infinity;
    tiers.forEach((t, i) => {
      const d = Math.abs(t.budget - targetBudget);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }
  return Math.floor((tiers.length - 1) / 2);
}

module.exports = { applyMargin, projectChannel, toRange, applyBoundary, applyOverrides, budgetFromHires, recommendTier };
