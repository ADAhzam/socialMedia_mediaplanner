# Social Media Media Planner — Optional Modules Implementation Plan (Plan 3 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three optional, AM-reviewed modules that render into the report as extra slides, toggled per plan: **Audience Targeting**, **Keyword Plan**, and **Market/Competitive Insights**. Targeting and keywords are generated deterministically from the brief (then AM-editable); insights are web-researched by the skill (cited, AM-approved) and rendered from the approved data.

**Architecture:** Two deterministic, unit-tested generators (`modules/targeting.js`, `modules/keywords.js`) build draft module data from the plan. Insights are NOT code-generated — the skill researches and the AM approves; code only validates and renders them. `viewmodel.js` is extended to carry a `modules` block; `render.js` gains module slide builders inserted between Measurement and Next Steps, and its slide count becomes dynamic. `gate.js` gains a soft check warning when an included insight lacks citations. `generate.js` builds toggled modules and threads them through. `SKILL.md` + new references document the toggles, the insights web-research flow, and per-module review loops.

**Tech Stack:** Node.js (v24), CommonJS, `node:test`, pptxgenjs (already installed). Branch: `feature/smmp-modules` (off `release`, already checked out). Consumes Plan 1 engine (`lib/`) and Plan 2 renderer (`render/`).

**Scope:** The three modules above, optional per plan, rendered into the Minimal deck. **Out of scope:** UTM generation, the operational tracker, Intermediate/Maximalist depth, live benchmark data.

**Conventions:**
- Module data lives on the plan as `plan.targeting`, `plan.keywords`, `plan.insights` (objects). Toggles: `plan.modules = { targeting: bool, keywords: bool }`; insights are included per-key when `plan.insights.<key>` is present.
- Generators are deterministic and pure (testable). Insights are supplied (researched) by the skill, never fabricated by code.
- All formatting via `render/format.js`; all rendering via pptxgenjs helpers from Plan 2.
- Run tests from `social-media-media-planner/` with `node --test "tests/"*.test.js`.

---

## File Structure

```
social-media-media-planner/
  lib/                       # Plan 1 engine (unchanged)
  render/
    modules/
      targeting.js           # NEW: buildTargeting(plan) -> targeting spec
      keywords.js            # NEW: buildKeywords(plan) -> clusters + negatives
      insights.js            # NEW: validateInsights(plan) -> warnings (no fabrication)
    viewmodel.js             # MODIFY: carry a `modules` block
    render.js                # MODIFY: module slide builders + dynamic slideCount
    gate.js                  # MODIFY: merge module warnings
    generate.js              # MODIFY: build toggled modules, thread through
  tests/
    targeting.test.js        # NEW
    keywords.test.js         # NEW
    insights.test.js         # NEW
    modules.viewmodel.test.js# NEW
    modules.render.test.js   # NEW
  SKILL.md                   # MODIFY: module toggles + insights research flow
  references/
    targeting-spec.md        # NEW
    keyword-spec.md          # NEW
    insights-research.md     # NEW
```

---

## Task M1: targeting.js — deterministic audience-spec generator

**Files:**
- Create: `social-media-media-planner/render/modules/targeting.js`
- Test: `social-media-media-planner/tests/targeting.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/targeting.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildTargeting } = require('../render/modules/targeting');

function plan() {
  return {
    industry: 'healthcare',
    geoLabel: '25-mile radius, Manchester',
    geoExclusions: ['Liverpool'],
    competitors: ['Bupa', 'HC-One'],
    roleGroups: [{ name: 'Registered Nurse' }, { name: 'Healthcare Assistant' }],
  };
}

test('Meta block applies Special Ad Category and fixed career-intent interests', () => {
  const t = buildTargeting(plan());
  assert.strictEqual(t.meta.specialAdCategory, true);
  assert.match(t.meta.locked, /18\+/);
  assert.deepStrictEqual(t.meta.careerIntent, ['Job hunting', 'Career development', 'Employment']);
  assert.ok(t.meta.location.includes('Manchester'));
  assert.ok(t.meta.note.toLowerCase().includes('creative')); // self-select via creative
});

test('Meta interest layers include role titles and the industry interest', () => {
  const t = buildTargeting(plan());
  assert.ok(t.meta.interestFunction.includes('Registered Nurse'));
  assert.ok(t.meta.interestIndustry.length > 0);
});

test('Google block carries in-market audience, competitor job-board URLs, and negative geo', () => {
  const t = buildTargeting(plan());
  assert.ok(t.google.inMarketAudiences.some(a => /jobs/i.test(a)));
  assert.ok(t.google.customIntentUrls.includes('indeed.com'));
  assert.deepStrictEqual(t.google.negativeGeo, ['Liverpool']);
});

test('competitors surface as a Google competitor-conquest note', () => {
  const t = buildTargeting(plan());
  assert.ok(t.google.competitorConquest.includes('Bupa'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/targeting.test.js`
Expected: FAIL — `Cannot find module '../render/modules/targeting'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/modules/targeting.js`:
```js
'use strict';

const INDUSTRY_INTERESTS = {
  general_recruitment: ['Employment', 'Recruitment'],
  healthcare: ['Healthcare', 'Nursing', 'Healthcare careers'],
  software_tech: ['Software', 'Technology', 'Information technology'],
  logistics: ['Logistics', 'Supply chain', 'Transportation'],
  retail_hospitality: ['Retail', 'Hospitality', 'Customer service'],
};

const INDUSTRY_LABEL = {
  general_recruitment: 'General Recruitment',
  healthcare: 'Healthcare',
  software_tech: 'Software & Tech',
  logistics: 'Logistics & Supply Chain',
  retail_hospitality: 'Retail & Hospitality',
};

// Deterministic audience spec from the brief. AM edits afterward.
function buildTargeting(plan) {
  const roles = (plan.roleGroups || []).map((r) => r.name);
  const industry = plan.industry;
  const competitors = plan.competitors || [];

  return {
    meta: {
      location: plan.geoLabel,
      specialAdCategory: true,
      locked: 'Age 18+, all genders (Special Ad Category: Recruitment)',
      interestFunction: roles,
      interestIndustry: INDUSTRY_INTERESTS[industry] || [],
      careerIntent: ['Job hunting', 'Career development', 'Employment'],
      retargeting: [
        'Careers-page visitors (30 / 60 / 90-day)',
        'Video viewers (25%+ completion)',
        'Lookalike of hired pool (when available)',
      ],
      note: 'Special Ad Category disables detailed-targeting exclusions — keep audiences broad and let role-specific creative self-select.',
    },
    google: {
      inMarketAudiences: [`Jobs – ${INDUSTRY_LABEL[industry] || 'Recruitment'}`, 'Employment Services'],
      customIntentUrls: ['indeed.com', 'linkedin.com/jobs', 'glassdoor.com'],
      geo: plan.geoLabel,
      negativeGeo: plan.geoExclusions || [],
      competitorConquest: competitors.length
        ? `Bid on competitor brand terms: ${competitors.join(', ')}`
        : 'No competitors provided',
    },
  };
}

module.exports = { buildTargeting, INDUSTRY_INTERESTS, INDUSTRY_LABEL };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/targeting.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/modules/targeting.js social-media-media-planner/tests/targeting.test.js
git commit -m "feat(modules): deterministic audience-targeting generator"
```

---

## Task M2: keywords.js — deterministic keyword + negative generator

**Files:**
- Create: `social-media-media-planner/render/modules/keywords.js`
- Test: `social-media-media-planner/tests/keywords.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/keywords.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { buildKeywords } = require('../render/modules/keywords');

function plan() {
  return {
    client: { name: 'Acme Care' },
    geoLabel: 'Manchester',
    roleGroups: [{ name: 'Registered Nurse' }, { name: 'Healthcare Assistant' }],
  };
}

test('produces three cluster types per role with correct match types', () => {
  const k = buildKeywords(plan());
  const nurse = k.clusters.filter(c => c.role === 'Registered Nurse');
  const types = nurse.map(c => c.type);
  assert.ok(types.includes('Function + Location'));
  assert.ok(types.includes('Brand'));
  assert.ok(types.includes('Exploratory'));
  const fnl = nurse.find(c => c.type === 'Function + Location');
  assert.strictEqual(fnl.matchType, 'Phrase');
  assert.strictEqual(nurse.find(c => c.type === 'Brand').matchType, 'Exact');
  assert.strictEqual(nurse.find(c => c.type === 'Exploratory').matchType, 'Broad');
});

test('function+location terms include role + geo; brand terms include the company', () => {
  const k = buildKeywords(plan());
  const fnl = k.clusters.find(c => c.role === 'Registered Nurse' && c.type === 'Function + Location');
  assert.ok(fnl.terms.some(t => /registered nurse jobs manchester/i.test(t)));
  const brand = k.clusters.find(c => c.role === 'Registered Nurse' && c.type === 'Brand');
  assert.ok(brand.terms.some(t => /acme care/i.test(t)));
});

test('standard negatives are present with reasons', () => {
  const k = buildKeywords(plan());
  const terms = k.negatives.map(n => n.term);
  assert.ok(terms.includes('internship'));
  assert.ok(terms.includes('part time'));
  assert.ok(terms.includes('volunteer'));
  assert.ok(k.negatives.every(n => typeof n.reason === 'string' && n.reason.length > 0));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/keywords.test.js`
Expected: FAIL — `Cannot find module '../render/modules/keywords'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/modules/keywords.js`:
```js
'use strict';

const STANDARD_NEGATIVES = [
  { term: 'internship', reason: 'Intern roles — wrong seniority' },
  { term: 'summer internship', reason: 'Seasonal intern — wrong audience' },
  { term: 'part time', reason: 'Part-time seekers — roles are full-time' },
  { term: 'volunteer', reason: 'Volunteer intent — not hiring' },
  { term: 'freelance', reason: 'Freelance/contract — roles are permanent' },
  { term: 'work from home', reason: 'Remote-only seekers — roles are on-site/hybrid' },
];

function buildKeywords(plan) {
  const company = (plan.client && plan.client.name) || 'the employer';
  const loc = plan.geoLabel || '';
  const roles = (plan.roleGroups || []).map((r) => r.name);

  const clusters = [];
  roles.forEach((role) => {
    const r = role.toLowerCase();
    clusters.push({
      role, type: 'Function + Location', matchType: 'Phrase',
      terms: [
        `${r} jobs ${loc}`.trim(),
        `${r} jobs`,
        `${r} vacancies ${loc}`.trim(),
      ],
    });
    clusters.push({
      role, type: 'Brand', matchType: 'Exact',
      terms: [
        `${company.toLowerCase()} ${r} jobs`,
        `${company.toLowerCase()} careers`,
      ],
    });
    clusters.push({
      role, type: 'Exploratory', matchType: 'Broad',
      terms: [
        `${r} jobs hiring`,
        `${r} career opportunities`,
      ],
    });
  });

  return { clusters, negatives: STANDARD_NEGATIVES.slice() };
}

module.exports = { buildKeywords, STANDARD_NEGATIVES };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/keywords.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/modules/keywords.js social-media-media-planner/tests/keywords.test.js
git commit -m "feat(modules): deterministic keyword + negative-keyword generator"
```

---

## Task M3: insights.js — module validation (warn on missing citations)

**Files:**
- Create: `social-media-media-planner/render/modules/insights.js`
- Test: `social-media-media-planner/tests/insights.test.js`

Insights are researched + supplied by the skill (not code). This module only validates that supplied insights carry citations (soft warning otherwise) — insights reaching a client must be sourced.

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/insights.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { validateInsights } = require('../render/modules/insights');

test('no insights -> no warnings', () => {
  assert.deepStrictEqual(validateInsights({}), []);
});

test('insight without sources -> warning', () => {
  const plan = { insights: { marketLandscape: { talentPool: '12,000', sources: [] } } };
  const warns = validateInsights(plan);
  assert.ok(warns.some(w => /marketLandscape/.test(w) && /citation|source/i.test(w)));
});

test('insight with sources -> no warning for that insight', () => {
  const plan = { insights: { activePassive: { passivePct: 90, sources: ['https://example.com/report'] } } };
  assert.deepStrictEqual(validateInsights(plan), []);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/insights.test.js`
Expected: FAIL — `Cannot find module '../render/modules/insights'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/modules/insights.js`:
```js
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/insights.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/modules/insights.js social-media-media-planner/tests/insights.test.js
git commit -m "feat(modules): insights citation validation (soft warn)"
```

---

## Task M4: viewmodel — carry a `modules` block

**Files:**
- Modify: `social-media-media-planner/render/viewmodel.js`
- Test: `social-media-media-planner/tests/modules.viewmodel.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/modules.viewmodel.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');

function basePlan() {
  return {
    industry: 'healthcare', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    client: { name: 'Acme Care' }, brandMode: 'joveo', archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: 'Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }], locations: [{ name: 'Manchester', detail: '' }],
    tiers: [{ name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } }],
  };
}

test('no modules -> deckModel.modules is an empty object', () => {
  const p = basePlan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.deepStrictEqual(dm.modules, {});
});

test('attached modules are carried onto the deckModel', () => {
  const p = basePlan();
  p.targeting = { meta: { location: 'Manchester' }, google: {} };
  p.keywords = { clusters: [{ role: 'Registered Nurse', type: 'Brand', matchType: 'Exact', terms: ['acme care careers'] }], negatives: [] };
  p.insights = { activePassive: { passivePct: 90, activePct: 10, sources: ['x'] } };
  const dm = buildDeckModel(p, projectPlan(p));
  assert.ok(dm.modules.targeting);
  assert.ok(dm.modules.keywords);
  assert.strictEqual(dm.modules.insights.activePassive.passivePct, 90);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/modules.viewmodel.test.js`
Expected: FAIL — `dm.modules` is undefined.

- [ ] **Step 3: Modify `viewmodel.js`**

In `social-media-media-planner/render/viewmodel.js`, in the returned object of `buildDeckModel`, add a `modules` field built from the plan (place it after `tiers`):
```js
    modules: {
      ...(plan.targeting ? { targeting: plan.targeting } : {}),
      ...(plan.keywords ? { keywords: plan.keywords } : {}),
      ...(plan.insights ? { insights: plan.insights } : {}),
    },
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/modules.viewmodel.test.js`
Expected: PASS. Also run `node --test tests/viewmodel.test.js` to confirm no regression.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/viewmodel.js social-media-media-planner/tests/modules.viewmodel.test.js
git commit -m "feat(modules): carry targeting/keywords/insights onto the deck model"
```

---

## Task M5: render — module slides + dynamic slide count

**Files:**
- Modify: `social-media-media-planner/render/render.js`
- Test: `social-media-media-planner/tests/modules.render.test.js`

Adds builders for: Audience Targeting (light), Keyword Strategy (light, table), and up to three Insight slides (Market Landscape stat cards + table; Active vs Passive split; Competitive Landscape). They are inserted **between Measurement and Next Steps**. `renderDeck` becomes module-aware and returns the **actual** slide count.

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/modules.render.test.js`:
```js
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/modules.render.test.js`
Expected: FAIL — slide counts are 9 (module slides not yet built / count not dynamic).

- [ ] **Step 3: Modify `render.js`**

3a. Add these builder functions (place them before `renderDeck`):
```js
function targetingSlide(pres, dm) {
  const p = dm.brand.palette;
  const t = dm.modules.targeting;
  const s = contentSlide(pres, dm, 'Audience Targeting Strategy');
  // Meta panel (left)
  s.addText('META — Special Ad Category (Recruitment)', { x: 0.45, y: 0.8, w: 4.5, h: 0.28, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  const metaLines = [
    `Location: ${t.meta.location}`,
    t.meta.locked,
    `Function: ${(t.meta.interestFunction || []).join(', ')}`,
    `Industry: ${(t.meta.interestIndustry || []).join(', ')}`,
    `Career intent: ${(t.meta.careerIntent || []).join(', ')}`,
    `Retargeting: ${(t.meta.retargeting || []).join('; ')}`,
  ];
  s.addText(metaLines.map(l => '• ' + l).join('\n'), { x: 0.45, y: 1.1, w: 4.5, h: 2.6, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'top' });
  s.addText(t.meta.note, { x: 0.45, y: 3.7, w: 4.5, h: 0.9, fontSize: 9, italic: true, color: p.ACCENT, fontFace: 'Calibri', valign: 'top' });
  // Google panel (right)
  s.addText('GOOGLE — Intent & Conquest', { x: 5.1, y: 0.8, w: 4.45, h: 0.28, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  const gLines = [
    `In-market: ${(t.google.inMarketAudiences || []).join(', ')}`,
    `Custom-intent URLs: ${(t.google.customIntentUrls || []).join(', ')}`,
    `Geo: ${t.google.geo}`,
    `Negative geo: ${(t.google.negativeGeo || []).join(', ') || 'none'}`,
    t.google.competitorConquest,
  ];
  s.addText(gLines.map(l => '• ' + l).join('\n'), { x: 5.1, y: 1.1, w: 4.45, h: 3.0, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'top' });
  return s;
}

function keywordSlide(pres, dm) {
  const p = dm.brand.palette;
  const k = dm.modules.keywords;
  const s = contentSlide(pres, dm, 'Keyword Strategy');
  const header = ['Role', 'Type', 'Match', 'Example terms'].map(h => ({ text: h, options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } }));
  const rows = k.clusters.slice(0, 8).map((c, i) => [c.role, c.type, c.matchType, (c.terms || []).slice(0, 3).join('; ')]
    .map(cell => ({ text: cell, options: { color: p.DGRAY, fill: { color: i % 2 ? p.OFFWHT : p.WHITE } } })));
  s.addTable([header, ...rows], { x: 0.4, y: 0.85, w: 9.2, colW: [2.2, 1.9, 1.0, 4.1], fontSize: 9, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.36 });
  const negs = (k.negatives || []).map(n => n.term).join(' · ');
  s.addText('Negative keywords: ' + negs, { x: 0.4, y: 4.55, w: 9.2, h: 0.5, fontSize: 9, italic: true, color: p.ACCENT, fontFace: 'Calibri' });
  return s;
}

function marketLandscapeSlide(pres, dm) {
  const p = dm.brand.palette;
  const m = dm.modules.insights.marketLandscape;
  const s = contentSlide(pres, dm, 'Market Landscape: Supply & Demand');
  const cards = [
    { big: m.talentPool, label: 'Talent Pool' },
    { big: m.activeSeekers, label: 'Active Seekers' },
    { big: m.supplyDemand, label: 'Supply : Demand' },
    { big: m.timeToFill, label: 'Avg Time-to-Fill' },
  ];
  cards.forEach((c, i) => statCard(pres, s, 0.45 + i * 2.32, 0.85, 2.15, 1.2, String(c.big), c.label, p, p.NAVY, p.WHITE));
  const header = ['Metric', 'Value', 'Strategic Implication'].map(h => ({ text: h, options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } }));
  const rows = (m.rows || []).slice(0, 5).map((r, i) => r.map(cell => ({ text: String(cell), options: { color: p.DGRAY, fill: { color: i % 2 ? p.OFFWHT : p.WHITE } } })));
  s.addTable([header, ...rows], { x: 0.4, y: 2.25, w: 9.2, colW: [2.6, 2.0, 4.6], fontSize: 9.5, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.42 });
  if (m.sources && m.sources.length) {
    s.addText('Sources: ' + m.sources.join(' · '), { x: 0.4, y: 4.9, w: 9.2, h: 0.3, fontSize: 7.5, color: '999999', fontFace: 'Calibri' });
  }
  return s;
}

function activePassiveSlide(pres, dm) {
  const p = dm.brand.palette;
  const a = dm.modules.insights.activePassive;
  const s = contentSlide(pres, dm, 'Active vs Passive Audience');
  s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 1.0, w: 5.6, h: 3.0, fill: { color: p.NAVY }, line: { color: p.NAVY } });
  s.addText(`${a.passivePct}%`, { x: 0.45, y: 1.2, w: 5.6, h: 1.4, fontSize: 60, bold: true, color: p.WHITE, align: 'center', fontFace: 'Calibri' });
  s.addText('Passively employed', { x: 0.45, y: 2.7, w: 5.6, h: 0.4, fontSize: 14, color: p.SUBTLE, align: 'center', fontFace: 'Calibri' });
  s.addShape(pres.shapes.RECTANGLE, { x: 6.2, y: 1.0, w: 3.35, h: 3.0, fill: { color: p.LGRAY }, line: { color: p.MGRAY } });
  s.addText(`${a.activePct}%`, { x: 6.2, y: 1.3, w: 3.35, h: 1.0, fontSize: 40, bold: true, color: p.NAVY, align: 'center', fontFace: 'Calibri' });
  s.addText('Actively looking', { x: 6.2, y: 2.4, w: 3.35, h: 0.4, fontSize: 12, color: p.DGRAY, align: 'center', fontFace: 'Calibri' });
  if (a.note) s.addText(a.note, { x: 0.45, y: 4.2, w: 9.1, h: 0.5, fontSize: 11, italic: true, color: p.ACCENT, align: 'center', fontFace: 'Calibri' });
  return s;
}

function competitiveSlide(pres, dm) {
  const p = dm.brand.palette;
  const c = dm.modules.insights.competitive;
  const s = contentSlide(pres, dm, 'Competitive Landscape');
  (c.competitors || []).slice(0, 6).forEach((comp, i) => {
    const y = 0.9 + i * 0.62;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y, w: 9.1, h: 0.52, fill: { color: i % 2 ? p.OFFWHT : p.WHITE }, line: { color: p.MGRAY, width: 0.5 } });
    s.addText(comp.name, { x: 0.6, y: y + 0.05, w: 3.0, h: 0.42, fontSize: 11, bold: true, color: p.NAVY, fontFace: 'Calibri', valign: 'middle' });
    s.addText(comp.note || '', { x: 3.7, y: y + 0.05, w: 5.7, h: 0.42, fontSize: 9.5, color: p.DGRAY, fontFace: 'Calibri', valign: 'middle' });
  });
  if (c.sources && c.sources.length) {
    s.addText('Sources: ' + c.sources.join(' · '), { x: 0.45, y: 4.9, w: 9.1, h: 0.3, fontSize: 7.5, color: '999999', fontFace: 'Calibri' });
  }
  return s;
}
```

3b. Replace the body of `renderDeck` so it builds a **list of builders** (base + conditional modules, inserted between measurement and next-steps) and returns the real count:
```js
async function renderDeck(deckModel, outPath) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = deckModel.brand.showJoveo ? 'Joveo' : deckModel.client;
  pres.company = deckModel.brand.showJoveo ? 'Joveo' : deckModel.client;
  pres.title = `${deckModel.client} Media Plan`;

  const mods = deckModel.modules || {};
  const ins = mods.insights || {};
  const builders = [
    coverSlide, opportunitySlide, budgetOptionsSlide, structureSlide,
    allocationSlide, performanceSlide,
    (pr, dm) => tableSlide(pr, dm, 'Measurement Framework', MEASUREMENT_ROWS),
  ];
  if (mods.targeting) builders.push(targetingSlide);
  if (mods.keywords) builders.push(keywordSlide);
  if (ins.marketLandscape) builders.push(marketLandscapeSlide);
  if (ins.activePassive) builders.push(activePassiveSlide);
  if (ins.competitive) builders.push(competitiveSlide);
  builders.push(nextStepsSlide, closeSlide);

  builders.forEach((b) => b(pres, deckModel));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pres.writeFile({ fileName: outPath });
  return { outPath, slideCount: builders.length };
}
```
(Keep all existing slide builders and the `MEASUREMENT_ROWS` constant. Note `tableSlide` is wrapped so it fits the `(pres, dm)` builder signature.)

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/modules.render.test.js`
Expected: PASS (9 / 14 / 11). Also run `node --test tests/render.smoke.test.js` to confirm the base deck still reports 9.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/render.js social-media-media-planner/tests/modules.render.test.js
git commit -m "feat(modules): targeting/keyword/insight slides + dynamic slide count"
```

---

## Task M6: gate + generate integration

**Files:**
- Modify: `social-media-media-planner/render/gate.js`
- Modify: `social-media-media-planner/render/generate.js`
- Test: append to `social-media-media-planner/tests/gate.test.js`

- [ ] **Step 1: Append the failing test**

Append to `social-media-media-planner/tests/gate.test.js`:
```js
test('insight without sources surfaces a soft warning via the gate', () => {
  const plan = goodPlan();
  plan.insights = { competitive: { competitors: [{ name: 'Bupa' }], sources: [] } };
  const res = prepareForRender(plan, projectPlan(plan));
  assert.ok(res.warnings.some(w => /competitive/i.test(w) && /citation|source/i.test(w)));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/gate.test.js`
Expected: FAIL — the gate doesn't yet merge insight warnings.

- [ ] **Step 3: Modify `gate.js`** to merge module warnings:
```js
'use strict';

const { validateHard, validateSoft } = require('../lib');
const { validateInsights } = require('./modules/insights');

function prepareForRender(plan, projected) {
  const errors = validateHard(plan, projected);
  if (errors.length > 0) {
    throw new Error('Cannot render — hard validation failed:\n- ' + errors.join('\n- '));
  }
  const warnings = [...validateSoft(plan, projected), ...validateInsights(plan)];
  return { warnings };
}

module.exports = { prepareForRender };
```

- [ ] **Step 4: Modify `generate.js`** so toggled modules are built before rendering:
```js
'use strict';

const { projectPlan } = require('../lib');
const { prepareForRender } = require('./gate');
const { buildDeckModel } = require('./viewmodel');
const { renderDeck } = require('./render');
const { buildTargeting } = require('./modules/targeting');
const { buildKeywords } = require('./modules/keywords');

// Build toggled modules (targeting/keywords) from the brief if requested and not
// already supplied. Insights are supplied by the skill (researched), never built here.
function withModules(plan) {
  const mods = plan.modules || {};
  const next = { ...plan };
  if (mods.targeting && !next.targeting) next.targeting = buildTargeting(plan);
  if (mods.keywords && !next.keywords) next.keywords = buildKeywords(plan);
  return next;
}

async function generate(plan, outPath) {
  const enriched = withModules(plan);
  const projected = projectPlan(enriched);
  const { warnings } = prepareForRender(enriched, projected); // throws on hard errors
  const deckModel = buildDeckModel(enriched, projected);
  const { slideCount } = await renderDeck(deckModel, outPath);
  return { outPath, slideCount, warnings };
}

module.exports = { generate, withModules };
```

- [ ] **Step 5: Run + verify**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/gate.test.js`
Expected: PASS.

- [ ] **Step 6: Append an end-to-end module test to `tests/modules.render.test.js`**
```js
const { generate } = require('../render/generate');

test('generate with module toggles builds targeting+keywords and adds slides', async () => {
  const p = basePlan();
  p.modules = { targeting: true, keywords: true };
  p.competitors = ['Bupa'];
  const out = path.join(__dirname, '..', 'out', 'gen-modules.pptx');
  const r = await generate(p, out);
  assert.strictEqual(r.slideCount, 11); // 9 + targeting + keywords
  assert.ok(fs.existsSync(out));
});
```
Run: `node --test tests/modules.render.test.js` — expected PASS (now includes this case).

- [ ] **Step 7: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/gate.js social-media-media-planner/render/generate.js social-media-media-planner/tests/gate.test.js social-media-media-planner/tests/modules.render.test.js
git commit -m "feat(modules): build toggled modules in generate; merge insight warnings in gate"
```

---

## Task M7: Full suite green

**Files:** none (verification)

- [ ] **Step 1: Run the whole suite**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test "tests/"*.test.js`
Expected: PASS — Plan 1 + Plan 2 + Plan 3 tests, `fail 0`.

- [ ] **Step 2: Commit (only if an incidental fix was needed)**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add -A && git commit -m "test(modules): full suite green" || echo "nothing to commit"
```

---

## Task M8: SKILL.md + references (authored)

**Files:**
- Modify: `social-media-media-planner/SKILL.md`
- Create: `social-media-media-planner/references/targeting-spec.md`
- Create: `social-media-media-planner/references/keyword-spec.md`
- Create: `social-media-media-planner/references/insights-research.md`

- [ ] **Step 1: Update `SKILL.md`** — add a "Modules (optional)" section to the flow:
  - Toggling: `plan.modules = { targeting: bool, keywords: bool }`; insights included per-key on `plan.insights`.
  - Targeting & Keywords: auto-drafted by `generate()` from the brief; **the skill must present the draft to the AM, capture edits, and write the edited objects back to `plan.targeting` / `plan.keywords` before final generate** (since a supplied object is used as-is).
  - Insights: the skill performs **web research** (talent pool, active/passive split, named competitors + their hiring activity), captures **citations** and a **confidence** note per insight, presents to the AM for approval, then sets `plan.insights = { marketLandscape?, activePassive?, competitive? }` with a `sources: [...]` array on each. Document the exact insight object shapes consumed by the renderer (fields used by `marketLandscapeSlide`/`activePassiveSlide`/`competitiveSlide`: marketLandscape{talentPool,activeSeekers,supplyDemand,timeToFill,rows[[metric,value,implication]],sources}; activePassive{passivePct,activePct,note,sources}; competitive{competitors[{name,note}],sources}).
  - Note that uncited insights produce a soft warning (surfaced from `generate()`), and insights must be AM-approved before sending to a client.
  - Update the plan-object schema section to include `modules`, `targeting`, `keywords`, `insights`.

- [ ] **Step 2: Write `references/targeting-spec.md`** — the per-channel targeting fields produced by `buildTargeting`, the Special-Ad-Category handling, and what the AM typically edits (competitors, breadth, exclusions).

- [ ] **Step 3: Write `references/keyword-spec.md`** — the cluster types (Function+Location/Phrase, Brand/Exact, Exploratory/Broad), the standard negative list + reasons, and brand/competitor-conquest guidance.

- [ ] **Step 4: Write `references/insights-research.md`** — the web-research flow: what to research per insight, how to cite (sources array), confidence tagging, the mandatory AM-approval gate, and the exact insight object shapes (matching the renderer).

- [ ] **Step 5: Verify the modules runner works end-to-end**

Run:
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node -e "
const {generate}=require('./render/generate');
const plan={industry:'healthcare',geo:'us',marginMultiplier:1.0,targetBudget:9000,client:{name:'Acme Care'},brandMode:'joveo',archetype:'branding',objectiveLabel:'Employer Branding',geoLabel:'Manchester',dateStr:'June 2026',roleGroups:[{name:'Registered Nurse',subtitle:'Clinical'}],locations:[{name:'Manchester',detail:''}],competitors:['Bupa','HC-One'],modules:{targeting:true,keywords:true},insights:{activePassive:{passivePct:90,activePct:10,note:'Built for the 90%',sources:['https://example.com']}},tiers:[{name:'Tier 1',budget:5000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}},{name:'Tier 2',budget:9000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}}]};
generate(plan,'out/modules-verify.pptx').then(r=>console.log('OK',JSON.stringify(r)));
"
```
Expected: prints `OK {"outPath":...,"slideCount":12,...}` (9 base + targeting + keywords + active/passive) and writes the file. (Fix the runner text in SKILL.md if needed so it actually works.)

- [ ] **Step 6: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/SKILL.md social-media-media-planner/references/
git commit -m "docs(skill): document optional modules + insights web-research flow"
```

---

## Task M9: Visual QA (modules-on deck)

**Files:** none (verification; may produce a QA note)

- [ ] **Step 1: Generate a full modules-on deck**

Use the M8 Step-5 runner (or extend it to include `insights.marketLandscape` and `insights.competitive`) to produce `out/qa-modules.pptx` with all modules on (target 14 slides).

- [ ] **Step 2: Inspect** (LibreOffice/pdftoppm if available; else slide-XML coordinate analysis + Quick Look, as in Plan 2). Checklist:
  - [ ] Module slides appear between Measurement and Next Steps, in order (targeting, keywords, insights).
  - [ ] Keyword table and market-landscape table don't overflow the footer (≤ ~7 rows; long term lists truncated to 3 per cell).
  - [ ] Active-vs-Passive split percentages render large and don't overlap.
  - [ ] Competitive rows don't exceed 6 / run under the footer.
  - [ ] Insight slides show a "Sources:" line when sources are present.
  - [ ] White-label modules deck still leaks no Joveo/yoke (re-run the archive grep mentally or via the existing leak test pattern on a modules deck).
  - [ ] Slide count returned matches the visible slide count.

- [ ] **Step 3: Record results** in a "Visual QA (modules) — <date>" note appended to `references/insights-research.md`; fix `render.js` + re-run tests if any issue, then commit.

---

## Definition of done (Plan 3)
- `node --test "tests/"*.test.js` fully green (engine + renderer + modules).
- `generate(plan, out)` with `modules`/`insights` produces a deck with the right dynamic slide count; module slides sit between Measurement and Next Steps.
- Targeting & keywords are deterministically generated and AM-editable; insights are validated (uncited → soft warning) and rendered with a Sources line; nothing fabricated in code.
- `SKILL.md` + the three references document the toggles, the schemas, and the insights web-research + approval flow; the modules runner works.
- Visual QA (modules) passed or issues fixed.

## Project completion
With Plans 1–3 merged, the v1 skill is feature-complete per the PRD: brief → steerable engine → validation gate → branded deck with optional, AM-reviewed targeting, keywords, and cited insights. Documented follow-ons remain: live Joveo benchmark data (the `getBenchmark` seam), Intermediate/Maximalist depth, UTM generation, and the operational tracker.
