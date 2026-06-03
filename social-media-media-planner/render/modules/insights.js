'use strict';

const INSIGHT_KEYS = ['marketLandscape', 'activePassive', 'competitive'];

// Insights are web-researched + AM-approved (supplied on plan.insights), never
// fabricated here. This only warns (soft) when an included insight lacks citations.
function validateInsights(plan) {
  const warnings = [];
  const insights = plan.insights || {};
  INSIGHT_KEYS.forEach((key) => {
    const ins = insights[key];
    if (!ins) return;
    const sources = ins.sources;
    if (!Array.isArray(sources) || sources.length === 0) {
      warnings.push(`Insight "${key}" has no citation/source — verify before sending to client`);
    }
  });
  return warnings;
}

module.exports = { validateInsights, INSIGHT_KEYS };
