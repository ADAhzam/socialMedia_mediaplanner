'use strict';

const { resolveBrand } = require('./brand');
const { fmtMoney, fmtRangeClicks, fmtRangeK, fmtCpc } = require('./format');

const CHANNEL_LABELS = {
  google_search: 'Google Search',
  google_display: 'Google Display',
  meta_feed_image: 'Meta Feed Image',
  meta_feed_video: 'Meta Feed Video',
  meta_reels: 'Meta Reels',
};

function humanizeChannel(channel, pct) {
  const base = CHANNEL_LABELS[channel] || channel;
  return `${base} (${Math.round(pct)}%)`;
}

function buildDeckModel(plan, projected) {
  const brand = resolveBrand(plan.brandMode, plan.client);
  brand.footerText = brand.footerText.replace('{DATE}', plan.dateStr);

  const tiers = projected.tiers.map((t) => {
    const channels = t.channels.map((c) => ({
      label: humanizeChannel(c.channel, c.allocationPct),
      budgetLabel: fmtMoney(c.budget),
      pct: c.allocationPct / 100,
      clicksRangeLabel: fmtRangeClicks(c.clicksRange.low, c.clicksRange.high),
      impressionsRangeLabel: fmtRangeK(c.impressionsRange.low, c.impressionsRange.high),
    }));
    const totalClicksLow = t.channels.reduce((s, c) => s + c.clicksRange.low, 0);
    const totalClicksHigh = t.channels.reduce((s, c) => s + c.clicksRange.high, 0);
    const totalImprLow = t.channels.reduce((s, c) => s + c.impressionsRange.low, 0);
    const totalImprHigh = t.channels.reduce((s, c) => s + c.impressionsRange.high, 0);
    const blendedCpc = t.totals.clicks > 0 ? t.budget / t.totals.clicks : 0;
    return {
      name: t.name,
      budgetLabel: fmtMoney(t.budget),
      recommended: t.recommended,
      channels,
      totals: {
        clicksRangeLabel: fmtRangeClicks(totalClicksLow, totalClicksHigh),
        impressionsRangeLabel: fmtRangeK(totalImprLow, totalImprHigh),
        cpcLabel: fmtCpc(blendedCpc),
      },
    };
  });

  return {
    client: plan.client.name,
    dateStr: plan.dateStr,
    brandMode: plan.brandMode,
    archetype: plan.archetype,
    objectiveLabel: plan.objectiveLabel,
    geoLabel: plan.geoLabel,
    brand,
    roleGroups: plan.roleGroups || [],
    locations: plan.locations || [],
    tiers,
  };
}

module.exports = { buildDeckModel, humanizeChannel, CHANNEL_LABELS };
