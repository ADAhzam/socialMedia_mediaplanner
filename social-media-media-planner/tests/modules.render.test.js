const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');
const { renderDeck } = require('../render/render');

function basePlan() {
  return {
    industry: 'healthcare', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    client: { name: 'Acme Care' }, brandMode: 'joveo', archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: 'Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }], locations: [{ name: 'Manchester', detail: '' }],
    tiers: [{ name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } }],
  };
}

test('no modules -> 9 slides', async () => {
  const p = basePlan();
  const dm = buildDeckModel(p, projectPlan(p));
  const r = await renderDeck(dm, path.join(__dirname, '..', 'out', 'mod-none.pptx'));
  assert.strictEqual(r.slideCount, 9);
});

test('all modules on -> 9 base + targeting + keywords + 3 insights = 14 slides', async () => {
  const p = basePlan();
  p.targeting = { meta: { location: 'Manchester', locked: 'Age 18+, all', interestFunction: ['Registered Nurse'], interestIndustry: ['Healthcare'], careerIntent: ['Job hunting'], retargeting: ['Page visitors'], note: 'broad', specialAdCategory: true }, google: { inMarketAudiences: ['Jobs – Healthcare'], customIntentUrls: ['indeed.com'], geo: 'Manchester', negativeGeo: [], competitorConquest: 'Bupa' } };
  p.keywords = { clusters: [{ role: 'Registered Nurse', type: 'Brand', matchType: 'Exact', terms: ['acme care careers'] }], negatives: [{ term: 'internship', reason: 'wrong seniority' }] };
  p.insights = {
    marketLandscape: { talentPool: '12,000', activeSeekers: '1,200', supplyDemand: '8:1', timeToFill: '45 days', rows: [['Passive candidates', '90%', 'Reach proactively']], sources: ['x'] },
    activePassive: { passivePct: 90, activePct: 10, note: 'Built for the 90%', sources: ['x'] },
    competitive: { competitors: [{ name: 'Bupa', note: 'Active on Indeed' }], sources: ['x'] },
  };
  const dm = buildDeckModel(p, projectPlan(p));
  const r = await renderDeck(dm, path.join(__dirname, '..', 'out', 'mod-all.pptx'));
  assert.strictEqual(r.slideCount, 14);
  assert.ok(fs.existsSync(r.outPath));
});

test('partial: only targeting + active/passive -> 11 slides', async () => {
  const p = basePlan();
  p.targeting = { meta: { location: 'M', locked: 'x', interestFunction: [], interestIndustry: [], careerIntent: [], retargeting: [], note: 'n', specialAdCategory: true }, google: { inMarketAudiences: [], customIntentUrls: [], geo: 'M', negativeGeo: [], competitorConquest: '' } };
  p.insights = { activePassive: { passivePct: 90, activePct: 10, note: '', sources: ['x'] } };
  const dm = buildDeckModel(p, projectPlan(p));
  const r = await renderDeck(dm, path.join(__dirname, '..', 'out', 'mod-partial.pptx'));
  assert.strictEqual(r.slideCount, 11);
});
