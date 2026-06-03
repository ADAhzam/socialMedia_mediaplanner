'use strict';
const { PRESETS } = require('./presets');

const TIER_NAMES = ['Tier 1', 'Tier 2', 'Tier 3'];
const TIER_FACTORS = [0.6, 1.0, 1.5];

function splitList(s) {
  return String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
}

function buildPlanFromForm(form) {
  const archetype = form.archetype === 'jobad' ? 'jobad' : 'branding';
  const presets = PRESETS[archetype];
  const monthly = Number(form.monthlyBudget) || 0;

  const tiers = TIER_FACTORS.map((f, i) => ({
    name: TIER_NAMES[i],
    budget: Math.round((monthly * f) / 100) * 100, // round to nearest $100
    allocations: presets[i],
  }));

  const plan = {
    industry: form.industry,
    geo: form.geo || 'uk',
    marginMultiplier: Number(form.marginMultiplier) || 1.0,
    targetBudget: monthly,
    client: { name: form.clientName },
    brandMode: form.brandMode || 'joveo',
    archetype,
    objectiveLabel: form.objectiveLabel || (archetype === 'jobad' ? 'Recruitment' : 'Employer Branding'),
    geoLabel: form.geoLabel || '',
    dateStr: form.dateStr || '',
    roleGroups: splitList(form.roles).map((name) => ({ name, subtitle: '' })),
    locations: splitList(form.locations).map((name) => ({ name, detail: '' })),
    tiers,
  };

  if (form.accentColor) plan.client.accentColor = form.accentColor;
  if (form.logoPath) plan.client.logoPath = form.logoPath;
  if (form.modules) plan.modules = { targeting: !!form.modules.targeting, keywords: !!form.modules.keywords };

  // Simple AM-entered insights (no web research): stamp a sources marker so the
  // gate does not warn (the AM is the source of record here).
  const ins = {};
  if (form.insights && form.insights.activePassive) {
    const ap = form.insights.activePassive;
    ins.activePassive = { passivePct: Number(ap.passivePct), activePct: Number(ap.activePct), note: ap.note || '', sources: ['AM-provided'] };
  }
  if (form.insights && form.insights.competitors) {
    const names = splitList(form.insights.competitors);
    if (names.length) ins.competitive = { competitors: names.map((name) => ({ name, note: '' })), sources: ['AM-provided'] };
  }
  if (Object.keys(ins).length) plan.insights = ins;

  return plan;
}

module.exports = { buildPlanFromForm };
