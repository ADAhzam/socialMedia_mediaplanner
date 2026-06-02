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

const CTR_BOUNDS = {
  google_search:   [2.0, 15.0],
  google_display:  [0.10, 1.0],
  meta_feed_image: [0.50, 4.0],
  meta_feed_video: [0.40, 3.0],
  meta_reels:      [0.30, 2.5],
};

function validateSoft(plan, projected) {
  const warnings = [];

  projected.tiers.forEach((tier) => {
    tier.channels.forEach((c) => {
      // CPC sanity
      if (c.cpc < 0.40) warnings.push(`Tier "${tier.name}", ${c.channel}: CPC $${c.cpc} below $0.40 — re-check`);
      if (c.cpc > 9.00) warnings.push(`Tier "${tier.name}", ${c.channel}: CPC $${c.cpc} above $9.00 — re-check`);

      // CTR bounds
      const b = CTR_BOUNDS[c.channel];
      if (b && (c.ctr < b[0] || c.ctr > b[1])) {
        warnings.push(`Tier "${tier.name}", ${c.channel}: CTR ${c.ctr}% outside ${b[0]}-${b[1]}%`);
      }

      // min spend
      if (c.budget < 300) {
        warnings.push(`Tier "${tier.name}", ${c.channel}: budget $${c.budget} below $300 — consider removing/redistributing`);
      }
    });

    // Google Search CPC should exceed Meta feed image CPC
    const gs = tier.channels.find((c) => c.channel === 'google_search');
    const mi = tier.channels.find((c) => c.channel === 'meta_feed_image');
    if (gs && mi && !(gs.cpc > mi.cpc)) {
      warnings.push(`Tier "${tier.name}": Google Search CPC ($${gs.cpc}) should exceed Meta CPC ($${mi.cpc})`);
    }
  });

  return warnings;
}

module.exports = { validateHard, hasPlaceholder, validateSoft, CTR_BOUNDS };
