'use strict';

function hasPlaceholder(value) {
  if (typeof value === 'string') return value.includes('{{');
  if (Array.isArray(value)) return value.some(hasPlaceholder);
  if (value && typeof value === 'object') return Object.values(value).some(hasPlaceholder);
  return false;
}

function validateHard(plan, projected) {
  const errors = [];

  // 1. allocations sum to 100 (+/- 0.5) per tier
  plan.tiers.forEach((tier) => {
    const sum = Object.values(tier.allocations).reduce((s, p) => s + p, 0);
    if (Math.abs(sum - 100) > 0.5) {
      errors.push(`Tier "${tier.name}": channel allocations sum to ${sum}, must sum to 100`);
    }
  });

  // 2. channel budgets sum to tier budget (+/- 0.5)
  projected.tiers.forEach((tier) => {
    const sum = tier.channels.reduce((s, c) => s + c.budget, 0);
    if (Math.abs(sum - tier.budget) > 0.5) {
      errors.push(`Tier "${tier.name}": channel budgets sum to ${sum}, must sum to tier budget ${tier.budget}`);
    }
  });

  // 3. no inverted ranges
  projected.tiers.forEach((tier) => {
    tier.channels.forEach((c) => {
      ['clicksRange', 'impressionsRange'].forEach((k) => {
        if (c[k] && c[k].low > c[k].high) {
          errors.push(`Tier "${tier.name}", ${c.channel}: inverted range on ${k}`);
        }
      });
    });
  });

  // 4. no leftover {{placeholders}} anywhere in plan or projection
  if (hasPlaceholder(plan) || hasPlaceholder(projected)) {
    errors.push('Unresolved {{placeholder}} found — every field must be filled before render');
  }

  return errors;
}

module.exports = { validateHard, hasPlaceholder };
