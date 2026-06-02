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

function projectPlan(plan) {
  const { industry, geo, marginMultiplier = 1.0, targetBudget, tiers } = plan;
  const projectedTiers = tiers.map((tier) => {
    const channels = Object.entries(tier.allocations).map(([channel, pct]) => {
      const channelBudget = tier.budget * (pct / 100);
      let p = projectChannel({ channelBudget, channel, industry, geo, marginMultiplier });

      // per-channel boundary on a chosen metric
      const b = tier.boundaries && tier.boundaries[channel];
      let clamped = false;
      if (b) {
        const r = applyBoundary(p[b.metric], { anchor: b.anchor, tolerancePct: b.tolerancePct });
        p = { ...p, [b.metric]: r.value };
        p = reconcileRow(p, b.metric);
        clamped = r.clamped;
      }

      // per-channel overrides (applied last)
      const o = tier.overrides && tier.overrides[channel];
      if (o) p = applyOverrides(p, o);

      return {
        ...p,
        allocationPct: pct,
        clamped,
        clicksRange: toRange(p.clicks, { lowMult: 0.6, highMult: 1.45 }),
        impressionsRange: toRange(p.impressions, { lowMult: 0.6, highMult: 1.5 }),
      };
    });

    const totals = {
      clicks: channels.reduce((s, c) => s + c.clicks, 0),
      impressions: channels.reduce((s, c) => s + c.impressions, 0),
    };
    return { name: tier.name, budget: tier.budget, channels, totals, recommended: false };
  });

  const recIdx = recommendTier(projectedTiers, { targetBudget });
  projectedTiers[recIdx].recommended = true;
  return { tiers: projectedTiers };
}

// After a metric is steered (boundary clamp), recompute dependent metrics so the
// row stays internally consistent. Holds budget and ctr fixed; derives cpc from
// the driver metric. driverField in {'clicks','impressions','cpc','cpm','budget','ctr'}.
function reconcileRow(row, driverField) {
  const budget = row.budget;
  const ctr = row.ctr;
  let cpc;
  if (driverField === 'clicks') {
    cpc = budget / row.clicks;
  } else if (driverField === 'impressions') {
    const clicks = row.impressions * ctr / 100;
    cpc = budget / clicks;
  } else if (driverField === 'cpm') {
    cpc = row.cpm / ((ctr / 100) * 1000);
  } else {
    // 'cpc', 'budget', 'ctr', or anything else: keep existing cpc
    cpc = row.cpc;
  }
  const clicks = budget / cpc;
  const impressions = clicks * 100 / ctr;
  const cpm = cpc * (ctr / 100) * 1000;
  return { ...row, budget, ctr, cpc, clicks, impressions, cpm };
}

module.exports = { applyMargin, projectChannel, toRange, applyBoundary, applyOverrides, budgetFromHires, recommendTier, projectPlan, reconcileRow };
