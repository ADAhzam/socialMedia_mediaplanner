# Social Media Media Planner — Renderer & Skill Shell Implementation Plan (Plan 2 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a plan object into a polished, brand-mode-aware, client-ready PPTX media-plan deck — consuming the Plan 1 engine, gating on validation, and rendering a complete Minimal-depth (9-slide) deck for both archetypes (branding/reach and job-ad), with a `SKILL.md` that orchestrates the brief → deck flow.

**Architecture:** Pure, testable layers feed a thin rendering layer. `format.js` (number/currency/range strings), `palette.js` + `brand.js` (brand-mode resolution and theming), `gate.js` (runs Plan 1's `validateHard` as a blocking gate, collects `validateSoft` warnings), and `viewmodel.js` (transforms `projectPlan` output + plan metadata into a normalized `deckModel`) are all unit-tested. `render-helpers.js` + `render.js` draw the deck with pptxgenjs from the `deckModel` (smoke-tested: produces a valid file with the expected slide count). `generate.js` is the orchestrator. `SKILL.md` + `references/` are authored prose that drive the interactive flow and document layouts. A visual-QA task renders a sample and eyeballs it.

**Tech Stack:** Node.js (≥18; v24 in this env), CommonJS, `node:test` + `node:assert`, **pptxgenjs** (the only runtime dependency), git. Branch: `feature/smmp-renderer` (already checked out).

**Scope:** Minimal-depth deck (9 slides) for branding and job-ad archetypes; brand modes (Joveo / co-branded / white-label); client logo + colors; logic-driven recommended tier; validation gate; visual-QA pass; `SKILL.md` orchestration. **Out of scope (later):** Intermediate/Maximalist depth (documented follow-on), the optional Targeting/Keyword/Insight modules (Plan 3), UTM/tracker, live data.

**Conventions:**
- All money/number formatting lives in `format.js` — render code never hand-formats.
- Ranges render with an en-dash: `160K – 400K`.
- Engine is consumed via `require('../lib')` (Plan 1's public index).
- Tests live in `social-media-media-planner/tests/`; run from `social-media-media-planner/` with `node --test "tests/"*.test.js`.

---

## File Structure

```
social-media-media-planner/
  package.json            # NEW root manifest: pptxgenjs dep + test script
  lib/                    # Plan 1 engine (exists, unchanged)
  render/
    format.js             # fmtMoney, fmtK, fmtClicks, fmtRangeK, fmtRangeClicks, fmtPct
    palette.js            # JOVEO design tokens
    brand.js              # resolveBrand(mode, client) -> theme + which marks show
    gate.js               # prepareForRender(plan, projected) -> {warnings}; throws on hard errors
    viewmodel.js          # buildDeckModel(plan, projected) -> normalized deckModel
    render-helpers.js     # pptxgenjs factories: shadow, footer, contentSlide, darkSlide, statCard, budgetBarRow, table
    render.js             # renderDeck(deckModel, outPath) -> Promise<void>  (9 Minimal slides)
    generate.js           # generate(plan, outPath) -> Promise<{outPath, warnings}>
  tests/
    format.test.js
    brand.test.js
    gate.test.js
    viewmodel.test.js
    render.smoke.test.js
  SKILL.md                # authored: intake/orchestration flow
  references/
    slide-blueprints.md   # authored: per-slide layout spec (Minimal; Intermediate/Maximalist noted)
    brand-modes.md        # authored: brand-mode + client-theming rules
    pptx-helpers.md       # authored: helper API + known pptxgenjs pitfalls
  out/                    # generated decks (gitignored)
```

Responsibilities are split so the testable transform (`viewmodel`) is independent of the untestable draw (`render`). `out/` is gitignored.

---

## Task R0: Root package, pptxgenjs dependency, gitignore

**Files:**
- Create: `social-media-media-planner/package.json`
- Modify: `.gitignore` (repo root)

- [ ] **Step 1: Create `social-media-media-planner/package.json`**
```json
{
  "name": "social-media-media-planner",
  "version": "0.2.0",
  "private": true,
  "description": "Renderer and skill shell for the Social Media Media Planner",
  "dependencies": {
    "pptxgenjs": "^3.12.0"
  },
  "scripts": {
    "test": "node --test \"tests/\"*.test.js"
  }
}
```

- [ ] **Step 2: Install the dependency**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && npm install`
Expected: pptxgenjs installs; `node_modules/` and `package-lock.json` appear; exit 0.

- [ ] **Step 3: Ignore build artifacts**

Append to the repo-root `.gitignore` (`/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/.gitignore`):
```
# Renderer build artifacts
social-media-media-planner/out/
package-lock.json
```
(`node_modules/` is already ignored from Plan 1.)

- [ ] **Step 4: Verify pptxgenjs loads**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node -e "const P=require('pptxgenjs'); console.log('pptxgenjs', typeof P)"`
Expected: prints `pptxgenjs function` (or `object`), exit 0.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/package.json .gitignore
git commit -m "chore(render): add root package with pptxgenjs dependency"
```

---

## Task R1: format.js — number/currency/range formatting

**Files:**
- Create: `social-media-media-planner/render/format.js`
- Test: `social-media-media-planner/tests/format.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/format.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { fmtMoney, fmtK, fmtClicks, fmtRangeK, fmtRangeClicks, fmtPct } = require('../render/format');

test('fmtMoney formats whole dollars with thousands separators', () => {
  assert.strictEqual(fmtMoney(5000), '$5,000');
  assert.strictEqual(fmtMoney(14000), '$14,000');
  assert.strictEqual(fmtMoney(0), '$0');
});

test('fmtK abbreviates thousands and millions', () => {
  assert.strictEqual(fmtK(500), '500');
  assert.strictEqual(fmtK(428000), '428K');
  assert.strictEqual(fmtK(215000), '215K');
  assert.strictEqual(fmtK(1050000), '1.05M');
});

test('fmtClicks rounds and adds thousands separators', () => {
  assert.strictEqual(fmtClicks(1666.6667), '1,667');
  assert.strictEqual(fmtClicks(200), '200');
});

test('fmtRangeK joins with an en-dash', () => {
  assert.strictEqual(fmtRangeK(160000, 400000), '160K – 400K');
});

test('fmtRangeClicks joins click counts with an en-dash', () => {
  assert.strictEqual(fmtRangeClicks(1490, 3600), '1,490 – 3,600');
});

test('fmtPct shows one decimal place', () => {
  assert.strictEqual(fmtPct(1.4), '1.4%');
  assert.strictEqual(fmtPct(1.45), '1.5%');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/format.test.js`
Expected: FAIL — `Cannot find module '../render/format'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/format.js`:
```js
'use strict';

const DASH = '–'; // en-dash

function fmtMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

function fmtK(n) {
  if (n < 1000) return String(Math.round(n));
  if (n < 1e6) return Math.round(n / 1000) + 'K';
  return (n / 1e6).toFixed(2) + 'M';
}

function fmtClicks(n) {
  return Math.round(n).toLocaleString('en-US');
}

function fmtRangeK(low, high) {
  return `${fmtK(low)} ${DASH} ${fmtK(high)}`;
}

function fmtRangeClicks(low, high) {
  return `${fmtClicks(low)} ${DASH} ${fmtClicks(high)}`;
}

function fmtPct(n) {
  return n.toFixed(1) + '%';
}

module.exports = { fmtMoney, fmtK, fmtClicks, fmtRangeK, fmtRangeClicks, fmtPct, DASH };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/format.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/format.js social-media-media-planner/tests/format.test.js
git commit -m "feat(render): number/currency/range formatting helpers"
```

---

## Task R2: palette.js + brand.js — brand-mode resolution

**Files:**
- Create: `social-media-media-planner/render/palette.js`
- Create: `social-media-media-planner/render/brand.js`
- Test: `social-media-media-planner/tests/brand.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/brand.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { resolveBrand } = require('../render/brand');

test('joveo mode shows Joveo + Yoke marks and uses Joveo palette', () => {
  const b = resolveBrand('joveo', { name: 'Acme Care' });
  assert.strictEqual(b.showJoveo, true);
  assert.strictEqual(b.showYoke, true);
  assert.strictEqual(b.palette.ACCENT, b.palette.CRIMSON); // no client color -> accent is crimson
  assert.strictEqual(b.footerText.includes('Joveo'), true);
});

test('cobranded mode shows Joveo + client logo and uses client accent', () => {
  const b = resolveBrand('cobranded', { name: 'Acme Care', accentColor: '00A1E0', logoPath: '/tmp/logo.png' });
  assert.strictEqual(b.showJoveo, true);
  assert.strictEqual(b.clientLogoPath, '/tmp/logo.png');
  assert.strictEqual(b.palette.ACCENT, '00A1E0'); // client accent overrides
});

test('whitelabel mode removes ALL Joveo marks and footer mentions only the client', () => {
  const b = resolveBrand('whitelabel', { name: 'Acme Care' });
  assert.strictEqual(b.showJoveo, false);
  assert.strictEqual(b.showYoke, false);
  assert.strictEqual(b.footerText.includes('Joveo'), false);
  assert.strictEqual(b.footerText.includes('Acme Care'), true);
});

test('unknown mode throws', () => {
  assert.throws(() => resolveBrand('rainbow', { name: 'X' }));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/brand.test.js`
Expected: FAIL — `Cannot find module '../render/brand'`.

- [ ] **Step 3: Write minimal implementations**

Create `social-media-media-planner/render/palette.js`:
```js
'use strict';

// Joveo design tokens (hex, no leading '#', as pptxgenjs expects).
const JOVEO = {
  NAVY:    '1B3A6B',
  CRIMSON: 'C0243A',
  BLUE:    '1A6BBF',
  LGRAY:   'F4F7FB',
  OFFWHT:  'EEF3FA',
  MGRAY:   'D0D8E4',
  DGRAY:   '4A4A4A',
  GREEN:   '1A7A3C',
  WHITE:   'FFFFFF',
  SUBTLE:  'A0B4CC',
};

module.exports = { JOVEO };
```

Create `social-media-media-planner/render/brand.js`:
```js
'use strict';

const { JOVEO } = require('./palette');

const MODES = ['joveo', 'cobranded', 'whitelabel'];

// Resolve which marks show + the effective palette + footer text for a brand mode.
// client: { name, primaryColor?, accentColor?, logoPath?, fonts? }
function resolveBrand(mode, client) {
  if (!MODES.includes(mode)) {
    throw new Error(`Unknown brand mode: ${mode} (expected one of ${MODES.join(', ')})`);
  }
  const accent = client.accentColor || JOVEO.CRIMSON;
  const primary = client.primaryColor || JOVEO.NAVY;
  const palette = { ...JOVEO, ACCENT: accent, PRIMARY: primary };

  const showJoveo = mode !== 'whitelabel';
  const showYoke = mode === 'joveo';
  const clientLogoPath = client.logoPath || null;

  // Footer text: Joveo-branded in joveo/cobranded; client-only in whitelabel.
  const footerText = showJoveo
    ? `Joveo Employer Branding  |  Prepared for ${client.name}  |  {DATE}  |  Confidential`
    : `${client.name}  |  Media Plan  |  {DATE}  |  Confidential`;

  return { mode, showJoveo, showYoke, clientLogoPath, palette, footerText };
}

module.exports = { resolveBrand, MODES };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/brand.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/palette.js social-media-media-planner/render/brand.js social-media-media-planner/tests/brand.test.js
git commit -m "feat(render): palette tokens and brand-mode resolution (joveo/cobranded/whitelabel)"
```

---

## Task R3: gate.js — validation gate before render

**Files:**
- Create: `social-media-media-planner/render/gate.js`
- Test: `social-media-media-planner/tests/gate.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/gate.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { prepareForRender } = require('../render/gate');

function goodPlan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    tiers: [{
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    }],
  };
}

test('a valid plan passes the gate and returns warnings array', () => {
  const plan = goodPlan();
  const res = prepareForRender(plan, projectPlan(plan));
  assert.ok(Array.isArray(res.warnings));
});

test('hard validation errors throw (blocking)', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  assert.throws(() => prepareForRender(plan, projectPlan(plan)), /sum to 100/i);
});

test('soft warnings are surfaced, not thrown', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 2, meta_feed_image: 58, meta_feed_video: 40 }; // GS = $100 < $300
  const res = prepareForRender(plan, projectPlan(plan));
  assert.ok(res.warnings.some(w => /below \$300/i.test(w)));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/gate.test.js`
Expected: FAIL — `Cannot find module '../render/gate'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/gate.js`:
```js
'use strict';

const { validateHard, validateSoft } = require('../lib');

// Blocking gate: throws if any hard rule fails; otherwise returns soft warnings.
function prepareForRender(plan, projected) {
  const errors = validateHard(plan, projected);
  if (errors.length > 0) {
    throw new Error('Cannot render — hard validation failed:\n- ' + errors.join('\n- '));
  }
  return { warnings: validateSoft(plan, projected) };
}

module.exports = { prepareForRender };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/gate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/gate.js social-media-media-planner/tests/gate.test.js
git commit -m "feat(render): validation gate (hard blocks, soft warns) before render"
```

---

## Task R4: viewmodel.js — build the normalized deckModel

**Files:**
- Create: `social-media-media-planner/render/viewmodel.js`
- Test: `social-media-media-planner/tests/viewmodel.test.js`

The deckModel is the render contract. Shape:
```
{
  client, dateStr, brandMode, archetype, objectiveLabel, geoLabel,
  brand: <resolveBrand result, with footerText DATE substituted>,
  roleGroups: [{ name, subtitle }],
  locations:  [{ name, detail }],
  tiers: [{
    name, budgetLabel, recommended,
    channels: [{ label, budgetLabel, pct, clicksRangeLabel, impressionsRangeLabel }],
    totals: { clicksRangeLabel, impressionsRangeLabel, cpcLabel }
  }]
}
```

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/viewmodel.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');

function plan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 9000,
    client: { name: 'Acme Care' },
    brandMode: 'joveo',
    archetype: 'branding',
    objectiveLabel: 'Employer Branding',
    geoLabel: '25-mile radius, Manchester',
    dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }],
    locations: [{ name: 'Manchester Centre', detail: 'M1 - M4' }],
    tiers: [
      { name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 2', budget: 9000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
    ],
  };
}

test('buildDeckModel carries client + formatted labels + recommended flag', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.strictEqual(dm.client, 'Acme Care');
  assert.strictEqual(dm.tiers.length, 2);
  assert.strictEqual(dm.tiers[0].budgetLabel, '$5,000');
  assert.strictEqual(dm.tiers[1].recommended, true); // 9000 == targetBudget
  const gs = dm.tiers[0].channels.find(c => c.label.startsWith('Google Search'));
  assert.ok(gs.budgetLabel === '$500');
  assert.ok(/–/.test(gs.clicksRangeLabel)); // has en-dash range
  assert.ok(dm.tiers[0].totals.clicksRangeLabel.length > 0);
});

test('buildDeckModel resolves brand and substitutes the date into the footer', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  assert.strictEqual(dm.brand.showJoveo, true);
  assert.ok(dm.brand.footerText.includes('June 2026'));
  assert.ok(!dm.brand.footerText.includes('{DATE}'));
});

test('channel labels are humanized with percent', () => {
  const p = plan();
  const dm = buildDeckModel(p, projectPlan(p));
  const labels = dm.tiers[0].channels.map(c => c.label);
  assert.ok(labels.includes('Meta Feed Image (50%)'));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/viewmodel.test.js`
Expected: FAIL — `Cannot find module '../render/viewmodel'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/render/viewmodel.js`:
```js
'use strict';

const { resolveBrand } = require('./brand');
const { fmtMoney, fmtRangeClicks, fmtRangeK } = require('./format');

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
        cpcLabel: fmtMoney(blendedCpc),
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
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/viewmodel.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/viewmodel.js social-media-media-planner/tests/viewmodel.test.js
git commit -m "feat(render): buildDeckModel normalizes engine output into a deck view model"
```

---

## Task R5: render-helpers.js — pptxgenjs factories

**Files:**
- Create: `social-media-media-planner/render/render-helpers.js`

No standalone unit test (these are thin pptxgenjs wrappers exercised by R6's smoke test). The critical correctness rule — fresh shadow object per shape — is encoded as a factory.

- [ ] **Step 1: Create the helpers**

Create `social-media-media-planner/render/render-helpers.js`:
```js
'use strict';

// Factory: never reuse a shadow object across shapes (pptxgenjs mutates it).
function makeShadow() {
  return { type: 'outer', blur: 8, offset: 3, angle: 135, color: '000000', opacity: 0.10 };
}

// Footer on every content slide; text already has the date substituted by the viewmodel.
function addFooter(pres, slide, footerText, palette) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.275,
    fill: { color: palette.OFFWHT }, line: { color: palette.MGRAY, width: 0.5 },
  });
  slide.addText(footerText, {
    x: 0.2, y: 5.36, w: 9.6, h: 0.25,
    fontSize: 8, color: '999999', fontFace: 'Calibri', align: 'center', valign: 'middle',
  });
}

// Light content slide with header bar + accent strip + title (+ optional RECOMMENDED tag).
function contentSlide(pres, deckModel, title, tag = '') {
  const p = deckModel.brand.palette;
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: p.LGRAY }, line: { color: p.LGRAY } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.65, fill: { color: p.WHITE }, line: { color: p.MGRAY, width: 0.5 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.07, h: 0.65, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
  s.addText(title, { x: 0.25, y: 0.08, w: 7.5, h: 0.48, fontSize: 20, bold: true, color: p.NAVY, fontFace: 'Calibri', valign: 'middle' });
  if (tag) {
    s.addShape(pres.shapes.RECTANGLE, { x: 8.0, y: 0.12, w: 1.6, h: 0.4, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
    s.addText(tag, { x: 8.0, y: 0.12, w: 1.6, h: 0.4, fontSize: 10, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
  }
  addFooter(pres, s, deckModel.brand.footerText, p);
  return s;
}

// Dark full-bleed slide (cover/close); no footer.
function darkSlide(pres, deckModel) {
  const p = deckModel.brand.palette;
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 5.625, fill: { color: p.NAVY }, line: { color: p.NAVY } });
  return s;
}

function statCard(pres, slide, x, y, w, h, bigText, labelText, palette, bigColor, bgColor) {
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: bgColor || palette.WHITE }, line: { color: palette.MGRAY, width: 0.5 }, shadow: makeShadow() });
  slide.addText(bigText, { x, y: y + 0.08, w, h: h * 0.52, fontSize: 26, bold: true, color: bigColor || palette.ACCENT, align: 'center', valign: 'bottom', fontFace: 'Calibri' });
  slide.addText(labelText, { x, y: y + h * 0.58, w, h: h * 0.38, fontSize: 9.5, color: palette.DGRAY, align: 'center', valign: 'top', fontFace: 'Calibri' });
}

// Horizontal budget bar (label | bar | value). pct is 0..1. barMaxW caps width to avoid overflow.
function budgetBarRow(pres, slide, x, y, label, valueLabel, pct, color, palette, rowH = 0.42, barMaxW = 4.6) {
  const barW = Math.max(barMaxW * pct, 0.05);
  slide.addText(label, { x, y, w: 3.0, h: rowH, fontSize: 10, color: palette.WHITE, fontFace: 'Calibri', valign: 'middle' });
  slide.addShape(pres.shapes.RECTANGLE, { x: x + 3.1, y: y + 0.05, w: barW, h: rowH - 0.1, fill: { color }, line: { color } });
  slide.addText(valueLabel, { x: x + 3.1 + barW + 0.1, y, w: 1.6, h: rowH, fontSize: 10, bold: true, color: palette.WHITE, fontFace: 'Calibri', valign: 'middle' });
}

module.exports = { makeShadow, addFooter, contentSlide, darkSlide, statCard, budgetBarRow };
```

- [ ] **Step 2: Sanity-check it loads**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node -e "require('./render/render-helpers'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/render-helpers.js
git commit -m "feat(render): pptxgenjs helper factories (shadow, footer, slides, cards, bars)"
```

---

## Task R6: render.js — render the 9 Minimal slides

**Files:**
- Create: `social-media-media-planner/render/render.js`
- Test: `social-media-media-planner/tests/render.smoke.test.js`

Slides (Minimal): 1 Cover (dark), 2 Opportunity (light), 3 Budget Options (dark, 3 tier cards, recommended badge), 4 Campaign Structure (light), 5 Budget Allocation (dark, bars), 6 Projected Performance (dark, stat cards + table), 7 Measurement Framework (light, table), 8 Next Steps (light), 9 Close (dark). The smoke test asserts a non-empty `.pptx` is produced with 9 slides.

- [ ] **Step 1: Write the failing smoke test**

Create `social-media-media-planner/tests/render.smoke.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { projectPlan } = require('../lib');
const { buildDeckModel } = require('../render/viewmodel');
const { renderDeck } = require('../render/render');

function plan(brandMode) {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 9000,
    client: { name: 'Acme Care' }, brandMode, archetype: 'branding',
    objectiveLabel: 'Employer Branding', geoLabel: '25-mile radius, Manchester', dateStr: 'June 2026',
    roleGroups: [{ name: 'Registered Nurse', subtitle: 'Clinical' }, { name: 'Senior RN', subtitle: 'Clinical Lead' }],
    locations: [{ name: 'Manchester Centre', detail: 'M1 - M4' }],
    tiers: [
      { name: 'Tier 1', budget: 5000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 2', budget: 9000, allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 } },
      { name: 'Tier 3', budget: 14000, allocations: { google_search: 8, meta_feed_image: 42, meta_feed_video: 30, meta_reels: 20 } },
    ],
  };
}

test('renderDeck writes a non-empty pptx with 9 slides', async () => {
  const p = plan('joveo');
  const dm = buildDeckModel(p, projectPlan(p));
  const out = path.join(__dirname, '..', 'out', 'smoke-joveo.pptx');
  const result = await renderDeck(dm, out);
  assert.strictEqual(result.slideCount, 9);
  assert.ok(fs.existsSync(out));
  assert.ok(fs.statSync(out).size > 5000);
});

test('renderDeck works in whitelabel mode without throwing', async () => {
  const p = plan('whitelabel');
  const dm = buildDeckModel(p, projectPlan(p));
  const out = path.join(__dirname, '..', 'out', 'smoke-whitelabel.pptx');
  const result = await renderDeck(dm, out);
  assert.strictEqual(result.slideCount, 9);
  assert.ok(fs.existsSync(out));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/render.smoke.test.js`
Expected: FAIL — `Cannot find module '../render/render'`.

- [ ] **Step 3: Write the implementation**

Create `social-media-media-planner/render/render.js`:
```js
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const pptxgen = require('pptxgenjs');
const { contentSlide, darkSlide, statCard, budgetBarRow, makeShadow } = require('./render-helpers');

function coverSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  if (dm.brand.showJoveo) {
    s.addText(dm.brand.showYoke ? 'joveo | yoke' : 'joveo', { x: 0.45, y: 0.4, w: 6, h: 0.5, fontSize: 22, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  }
  // Client logo — prominent, top-right (PRD: client-branded reports). Only if a path was provided.
  if (dm.brand.clientLogoPath) {
    s.addImage({ path: dm.brand.clientLogoPath, x: 7.9, y: 0.35, w: 1.65, h: 0.7, sizing: { type: 'contain', w: 1.65, h: 0.7 } });
  }
  s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y: 1.1, w: 9.1, h: 0.02, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
  s.addText([{ text: dm.client, options: { color: p.WHITE } }], { x: 0.45, y: 1.3, w: 8.5, h: 0.9, fontSize: 42, bold: true, fontFace: 'Calibri' });
  s.addText(`${dm.objectiveLabel}`, { x: 0.45, y: 2.3, w: 8, h: 0.45, fontSize: 16, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`${dm.objectiveLabel} · ${dm.geoLabel}`, { x: 0.45, y: 2.85, w: 8.5, h: 0.35, fontSize: 12, color: p.SUBTLE, fontFace: 'Calibri' });
  return s;
}

function opportunitySlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'The Opportunity');
  s.addText('TARGET LOCATIONS', { x: 0.45, y: 0.85, w: 9, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  dm.locations.slice(0, 5).forEach((loc, i) => {
    const x = 0.45 + i * 1.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.15, w: 1.75, h: 0.65, fill: { color: i === 0 ? p.ACCENT : p.LGRAY }, line: { color: p.MGRAY, width: 0.5 } });
    s.addText(loc.name, { x, y: 1.2, w: 1.75, h: 0.32, fontSize: 10, bold: true, color: i === 0 ? p.WHITE : p.NAVY, align: 'center', fontFace: 'Calibri' });
    s.addText(loc.detail || '', { x, y: 1.5, w: 1.75, h: 0.25, fontSize: 8.5, color: i === 0 ? p.WHITE : p.DGRAY, align: 'center', fontFace: 'Calibri' });
  });
  s.addText('ROLE CATEGORIES', { x: 0.45, y: 2.0, w: 9, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
  dm.roleGroups.slice(0, 6).forEach((r, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.45 + col * 4.6, y = 2.3 + row * 0.62;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.45, h: 0.55, fill: { color: p.WHITE }, line: { color: p.NAVY, width: 0.7 } });
    s.addText(r.name, { x: x + 0.1, y: y + 0.05, w: 4.2, h: 0.28, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(r.subtitle || '', { x: x + 0.1, y: y + 0.3, w: 4.2, h: 0.22, fontSize: 8.5, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function budgetOptionsSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  s.addText('Budget Options', { x: 0.45, y: 0.2, w: 8, h: 0.6, fontSize: 30, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  const xs = [0.3, 3.47, 6.63];
  dm.tiers.slice(0, 3).forEach((t, i) => {
    const x = xs[i];
    if (t.recommended) {
      s.addShape(pres.shapes.RECTANGLE, { x, y: 0.95, w: 2.9, h: 0.32, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
      s.addText('★ RECOMMENDED', { x, y: 0.95, w: 2.9, h: 0.32, fontSize: 9, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    }
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.3, w: 2.9, h: 3.6, fill: { color: p.WHITE }, line: { color: p.MGRAY, width: 0.5 }, shadow: makeShadow() });
    s.addText(t.name.toUpperCase(), { x: x + 0.15, y: 1.45, w: 2.6, h: 0.3, fontSize: 9, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.budgetLabel, { x: x + 0.15, y: 1.7, w: 2.6, h: 0.6, fontSize: 26, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText('per month', { x: x + 0.15, y: 2.3, w: 2.6, h: 0.25, fontSize: 10, color: p.DGRAY, fontFace: 'Calibri' });
    s.addText('CHANNELS', { x: x + 0.15, y: 2.65, w: 2.6, h: 0.22, fontSize: 9, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.channels.map(c => '• ' + c.label.replace(/\s*\(\d+%\)/, '')).join('\n'), { x: x + 0.15, y: 2.88, w: 2.6, h: 0.9, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
    s.addText('PROJECTED', { x: x + 0.15, y: 3.85, w: 2.6, h: 0.22, fontSize: 9, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.totals.clicksRangeLabel + ' clicks / mo', { x: x + 0.15, y: 4.07, w: 2.6, h: 0.25, fontSize: 10, bold: true, color: p.NAVY, fontFace: 'Calibri' });
    s.addText(t.totals.impressionsRangeLabel + ' impr / mo', { x: x + 0.15, y: 4.32, w: 2.6, h: 0.25, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function structureSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'Campaign Structure');
  s.addText('A channel-led approach across the funnel', { x: 0.25, y: 0.62, w: 9, h: 0.3, fontSize: 11, color: p.DGRAY, fontFace: 'Calibri' });
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  rec.channels.forEach((c, i) => {
    const x = 0.35 + (i % 3) * 3.1, y = 1.1 + Math.floor(i / 3) * 1.9;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.95, h: 1.7, fill: { color: p.WHITE }, line: { color: p.NAVY, width: 0.7 }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.95, h: 0.5, fill: { color: i === 0 ? p.NAVY : i === 1 ? p.ACCENT : p.BLUE }, line: { color: p.MGRAY } });
    s.addText(c.label, { x: x + 0.12, y: y + 0.08, w: 2.7, h: 0.34, fontSize: 10, bold: true, color: p.WHITE, fontFace: 'Calibri', valign: 'middle' });
    s.addText(c.budgetLabel + ' / mo', { x: x + 0.12, y: y + 0.6, w: 2.7, h: 0.4, fontSize: 14, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText(c.clicksRangeLabel + ' clicks', { x: x + 0.12, y: y + 1.05, w: 2.7, h: 0.3, fontSize: 9, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function allocationSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText('Budget Allocation', { x: 0.45, y: 0.2, w: 8, h: 0.6, fontSize: 28, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`${rec.budgetLabel} / month · ${rec.name}`, { x: 0.45, y: 0.78, w: 8, h: 0.3, fontSize: 11, color: p.SUBTLE, fontFace: 'Calibri' });
  const colors = [p.ACCENT, p.BLUE, p.MGRAY, p.GREEN, p.SUBTLE];
  rec.channels.forEach((c, i) => {
    budgetBarRow(pres, s, 0.45, 1.3 + i * 0.62, c.label, c.budgetLabel, c.pct, colors[i % colors.length], p);
  });
  // Footer present via... darkSlide has no footer; add it explicitly for parity:
  return s;
}

function performanceSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText('Projected Performance', { x: 0.45, y: 0.15, w: 9, h: 0.55, fontSize: 28, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  s.addText(`What ${rec.budgetLabel} / month delivers`, { x: 0.45, y: 0.7, w: 9, h: 0.3, fontSize: 11, color: p.SUBTLE, fontFace: 'Calibri' });
  const cards = [
    { big: rec.budgetLabel, label: 'Monthly Investment', bg: p.ACCENT, color: p.WHITE },
    { big: rec.totals.clicksRangeLabel, label: 'Est. Clicks / mo', bg: p.WHITE, color: p.NAVY },
    { big: rec.totals.impressionsRangeLabel, label: 'Est. Impressions / mo', bg: p.OFFWHT, color: p.NAVY },
    { big: rec.totals.cpcLabel, label: 'Avg CPC (blended)', bg: p.WHITE, color: p.NAVY },
  ];
  cards.forEach((c, i) => {
    const x = 0.45 + i * 2.32;
    statCard(pres, s, x, 1.1, 2.15, 1.3, c.big, c.label, p, c.color, c.bg);
  });
  return s;
}

function tableSlide(pres, dm, title, rows) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, title);
  const header = [
    { text: 'KPI Category', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
    { text: 'Metric', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
    { text: 'Channel / Source', options: { bold: true, color: p.WHITE, fill: { color: p.NAVY } } },
  ];
  const body = rows.map((r, i) => r.map((cell) => ({ text: cell, options: { color: p.DGRAY, fill: { color: i % 2 === 0 ? p.WHITE : p.OFFWHT } } })));
  s.addTable([header, ...body], { x: 0.4, y: 0.9, w: 9.2, colW: [2.6, 4.0, 2.6], fontSize: 10, fontFace: 'Calibri', border: { pt: 0.5, color: p.MGRAY }, rowH: 0.5 });
  return s;
}

function nextStepsSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = contentSlide(pres, dm, 'Next Steps');
  const steps = [
    ['Confirm Budget Tier', 'Select a tier to lock the plan and brief the build team.'],
    ['Finalise Geo & Role Priorities', 'Confirm which locations and roles go live first.'],
    ['Tracking & Pixel Setup', 'Install Meta Pixel + Google Tag and configure UTMs.'],
    ['Creative & Asset Collection', 'Gather approved imagery, video, and copy per channel.'],
    ['Build & Launch', 'Internal QA → client review → sign-off → live.'],
  ];
  steps.forEach((st, i) => {
    const y = 0.85 + i * 0.82;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.45, y, w: 0.42, h: 0.42, fill: { color: p.ACCENT }, line: { color: p.ACCENT } });
    s.addText(String(i + 1), { x: 0.45, y, w: 0.42, h: 0.42, fontSize: 14, bold: true, color: p.WHITE, align: 'center', valign: 'middle', fontFace: 'Calibri' });
    s.addText(st[0], { x: 0.95, y, w: 8.5, h: 0.3, fontSize: 11, bold: true, color: p.ACCENT, fontFace: 'Calibri' });
    s.addText(st[1], { x: 0.95, y: y + 0.3, w: 8.5, h: 0.4, fontSize: 10, color: p.DGRAY, fontFace: 'Calibri' });
  });
  return s;
}

function closeSlide(pres, dm) {
  const p = dm.brand.palette;
  const s = darkSlide(pres, dm);
  s.addText([{ text: `Let's Build ${dm.client}'s Plan`, options: { color: p.WHITE } }], { x: 0.45, y: 1.4, w: 9, h: 1.2, fontSize: 38, bold: true, fontFace: 'Calibri' });
  const rec = dm.tiers.find(t => t.recommended) || dm.tiers[0];
  s.addText(`${rec.budgetLabel} / month · ${rec.totals.clicksRangeLabel} projected clicks`, { x: 0.45, y: 2.7, w: 9, h: 0.4, fontSize: 13, color: p.SUBTLE, fontFace: 'Calibri' });
  if (dm.brand.showJoveo) {
    s.addText(dm.brand.showYoke ? 'joveo | yoke' : 'joveo', { x: 0.45, y: 4.8, w: 6, h: 0.4, fontSize: 18, bold: true, color: p.WHITE, fontFace: 'Calibri' });
  }
  return s;
}

const MEASUREMENT_ROWS = [
  ['Brand / Awareness', 'Impressions · Reach · Video views', 'Meta (all formats)'],
  ['Engagement', 'Clicks / link clicks · CTR', 'All channels'],
  ['Conversion', 'Careers-page visits · Application starts', 'All channels → ATS'],
  ['Hire (Primary KPI)', 'Applications → Interview → Hire · CPH', 'ATS feedback'],
];

async function renderDeck(deckModel, outPath) {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Joveo';
  pres.title = `${deckModel.client} Media Plan`;

  coverSlide(pres, deckModel);
  opportunitySlide(pres, deckModel);
  budgetOptionsSlide(pres, deckModel);
  structureSlide(pres, deckModel);
  allocationSlide(pres, deckModel);
  performanceSlide(pres, deckModel);
  tableSlide(pres, deckModel, 'Measurement Framework', MEASUREMENT_ROWS);
  nextStepsSlide(pres, deckModel);
  closeSlide(pres, deckModel);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pres.writeFile({ fileName: outPath });
  return { outPath, slideCount: 9 };
}

module.exports = { renderDeck };
```

- [ ] **Step 4: Run the smoke test**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/render.smoke.test.js`
Expected: PASS — two pptx files written under `out/`, each 9 slides, non-empty.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/render.js social-media-media-planner/tests/render.smoke.test.js
git commit -m "feat(render): renderDeck produces the 9-slide Minimal deck (brand-mode aware)"
```

---

## Task R7: generate.js — end-to-end orchestrator

**Files:**
- Create: `social-media-media-planner/render/generate.js`
- Test: append to `social-media-media-planner/tests/render.smoke.test.js`

- [ ] **Step 1: Append the failing test**

Append to `social-media-media-planner/tests/render.smoke.test.js`:
```js
const { generate } = require('../render/generate');

test('generate runs engine -> gate -> viewmodel -> render and returns warnings', async () => {
  const p = plan('cobranded');
  p.client.accentColor = '00A1E0';
  const out = path.join(__dirname, '..', 'out', 'generate-cobranded.pptx');
  const res = await generate(p, out);
  assert.ok(fs.existsSync(res.outPath));
  assert.ok(Array.isArray(res.warnings));
  assert.strictEqual(res.slideCount, 9);
});

test('generate throws (blocks) on a hard-invalid plan', async () => {
  const p = plan('joveo');
  p.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  await assert.rejects(() => generate(p, path.join(__dirname, '..', 'out', 'should-not-exist.pptx')), /hard validation/i);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/render.smoke.test.js`
Expected: FAIL — `Cannot find module '../render/generate'`.

- [ ] **Step 3: Write the implementation**

Create `social-media-media-planner/render/generate.js`:
```js
'use strict';

const { projectPlan } = require('../lib');
const { prepareForRender } = require('./gate');
const { buildDeckModel } = require('./viewmodel');
const { renderDeck } = require('./render');

// Full pipeline: plan -> projection -> validation gate -> view model -> rendered deck.
// Throws if hard validation fails (no file written). Returns { outPath, slideCount, warnings }.
async function generate(plan, outPath) {
  const projected = projectPlan(plan);
  const { warnings } = prepareForRender(plan, projected); // throws on hard errors
  const deckModel = buildDeckModel(plan, projected);
  const { slideCount } = await renderDeck(deckModel, outPath);
  return { outPath, slideCount, warnings };
}

module.exports = { generate };
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test tests/render.smoke.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/render/generate.js social-media-media-planner/tests/render.smoke.test.js
git commit -m "feat(render): generate() end-to-end orchestrator (engine -> gate -> viewmodel -> deck)"
```

---

## Task R8: Full suite green

**Files:** none (verification)

- [ ] **Step 1: Run the whole suite**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node --test "tests/"*.test.js`
Expected: PASS — Plan 1 engine tests (41) + new render tests (format/brand/gate/viewmodel/render.smoke). `fail 0`.

- [ ] **Step 2: Commit (only if any incidental fix was needed; otherwise skip)**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add -A && git commit -m "test(render): full suite green" || echo "nothing to commit"
```

---

## Task R9: SKILL.md — intake & orchestration (authored)

**Files:**
- Create: `social-media-media-planner/SKILL.md`

This is authored prose (no unit test). It must be complete and self-contained — an operator following it produces a deck.

- [ ] **Step 1: Write `social-media-media-planner/SKILL.md`** with these sections (full content, not placeholders):
  - **Frontmatter**: `name: social-media-media-planner`, a `description` covering triggers (media plan, recruitment media plan, build me a deck, proposal for client, job-ad plan, employer branding plan).
  - **Overview**: one brief → branded deck; consumes `render/generate.js`; under-$20k segment; two archetypes.
  - **Step 1 — Parse the brief**: extract client, roles→groups, geo, budget, objective/archetype, duration, branding (logo/colors/mode); confidence-tag each (high/medium/low); list smart defaults (ongoing monthly; geo none; brand mode = joveo unless told otherwise).
  - **Step 2 — Choose archetype & objective**: job-ad (CPA) vs branding (traffic/awareness/lead-capture/retargeting); how to decide from the brief.
  - **Step 3 — Confirm depth**: Minimal (9 slides) for v1 (note Intermediate/Maximalist are a follow-on).
  - **Step 4 — One consolidated gap-fill**: the required fields (client, roles, geo, budget, success metric) and helpful ones; ask once.
  - **Step 5 — Steering controls** (optional): margin (global default + per-channel override), per-channel boundary conditions (anchor + tolerance), per-KPI overrides. Show how these map to the plan object's `marginMultiplier`, `tiers[].boundaries`, `tiers[].overrides`.
  - **Step 6 — Branding**: brand mode (joveo / cobranded / whitelabel), client logo path, client colors.
  - **Step 7 — Build the plan object & generate**: construct the plan JSON, then run `node -e "require('./render/generate').generate(planObj,'out/<client>.pptx').then(r=>console.log(JSON.stringify(r)))"` (or a small runner script); surface any thrown hard error verbatim and the returned soft `warnings` to the AM.
  - **Step 8 — Review loop**: present projections + warnings; let the AM adjust any KPI / steering / allocation; regenerate.
  - **Step 9 — Visual QA**: see references; deliver the file in the chosen brand mode.
  - **Plan object schema**: document the exact shape consumed by `generate()` (industry, geo, marginMultiplier, targetBudget, client{name,primaryColor?,accentColor?,logoPath?}, brandMode, archetype, objectiveLabel, geoLabel, dateStr, roleGroups[], locations[], tiers[{name,budget,allocations,boundaries?,overrides?}]).
  - **Reference files**: point to `references/slide-blueprints.md`, `references/brand-modes.md`, `references/pptx-helpers.md`.

- [ ] **Step 2: Verify the documented runner actually works**

Create a throwaway plan and run the exact command from Step 7 to confirm the SKILL's instructions produce a file. Run:
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner" && node -e "
const {generate}=require('./render/generate');
const plan={industry:'general_recruitment',geo:'us',marginMultiplier:1.0,targetBudget:9000,client:{name:'Demo Co'},brandMode:'joveo',archetype:'branding',objectiveLabel:'Employer Branding',geoLabel:'National',dateStr:'June 2026',roleGroups:[{name:'Nurse',subtitle:'Clinical'}],locations:[{name:'National',detail:''}],tiers:[{name:'Tier 1',budget:5000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}},{name:'Tier 2',budget:9000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}}]};
generate(plan,'out/skill-verify.pptx').then(r=>console.log('OK',JSON.stringify(r)));
"
```
Expected: prints `OK {"outPath":...,"slideCount":9,"warnings":[...]}` and writes the file.

- [ ] **Step 3: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/SKILL.md
git commit -m "docs(skill): SKILL.md intake and orchestration flow"
```

---

## Task R10: references/ — blueprints, brand modes, helper API (authored)

**Files:**
- Create: `social-media-media-planner/references/slide-blueprints.md`
- Create: `social-media-media-planner/references/brand-modes.md`
- Create: `social-media-media-planner/references/pptx-helpers.md`

- [ ] **Step 1: Write `references/slide-blueprints.md`** — the per-slide layout spec for the Minimal 9-slide deck (coordinates and content per slide, matching `render.js`), plus a short section noting Intermediate (14) and Maximalist (21) as a documented follow-on with their slide lists.

- [ ] **Step 2: Write `references/brand-modes.md`** — the three brand modes, exactly which Joveo marks each shows/hides, how client logo + colors apply, and the white-label guarantee (no Joveo string anywhere in footer/cover/close).

- [ ] **Step 3: Write `references/pptx-helpers.md`** — the helper API from `render-helpers.js` (signatures + purpose), the **fresh-shadow-per-shape** rule, the bar-overflow cap rule, the "every content slide gets a footer; dark cover/close do not" rule, and the table-height guidance.

- [ ] **Step 4: Commit**
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/references/
git commit -m "docs(skill): slide blueprints, brand-mode rules, pptx helper reference"
```

---

## Task R11: Visual QA pass

**Files:** none (verification; may produce notes)

The smoke test proves files are produced; this proves they *look right* (the PRD's design-quality bar).

- [ ] **Step 1: Generate one deck per brand mode**

Run the Step-7 runner three times with `brandMode` set to `joveo`, `cobranded` (with an `accentColor`), and `whitelabel`, writing to `out/qa-joveo.pptx`, `out/qa-cobranded.pptx`, `out/qa-whitelabel.pptx`.

- [ ] **Step 2: Convert to images for inspection**

If LibreOffice is available:
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP/social-media-media-planner/out"
soffice --headless --convert-to pdf qa-joveo.pptx && pdftoppm -jpeg -r 120 qa-joveo.pdf qa-joveo-slide
```
If not available, open the `.pptx` in Keynote/PowerPoint and export images, or inspect directly.

- [ ] **Step 3: Eyeball checklist (fix `render.js`/helpers if any fail, then re-run the smoke test + re-commit)**
  - [ ] No text overflows a box or runs under the footer (content above y=5.3").
  - [ ] No overlapping text blocks (e.g. the projection cards/labels).
  - [ ] All bars end before the slide edge.
  - [ ] Exactly one tier shows the ★ RECOMMENDED badge, on the logic-chosen tier.
  - [ ] Footer present on slides 2,4,7,8; absent on cover (1) and close (9). (Note: dark slides 3,5,6 currently have no footer by design — confirm that's acceptable or add one.)
  - [ ] White-label deck contains **no** "Joveo"/"yoke" string anywhere; cobranded shows client accent color; client logo (if provided) renders.
  - [ ] Numbers read sensibly (ranges low<high; CPC plausible).

- [ ] **Step 4: Record results** in a short note at the bottom of `references/slide-blueprints.md` ("Visual QA — <date>: pass, or issues fixed: ...") and commit if anything changed.

---

## Definition of done (Plan 2)
- `node --test "tests/"*.test.js` (from `social-media-media-planner/`) is fully green (engine + render).
- `require('./render/generate').generate(plan, out)` produces a 9-slide, brand-mode-aware `.pptx`, blocking on hard-invalid plans and returning soft warnings.
- White-label output contains no Joveo marks; cobranded applies client accent + logo.
- `SKILL.md` + `references/` are complete; the documented runner command works.
- Visual QA checklist passed (or issues fixed).

## Hand-off to Plan 3
Plan 3 adds the optional, AM-reviewed modules — Targeting, Keywords, and Insights (web-researched, cited) — as additional `deckModel` sections and extra slides, toggled per plan. It consumes the same `generate()` pipeline, inserting module slides between Measurement and Next Steps.

## Documented follow-on (not in this plan)
- Intermediate (14) and Maximalist (21) depth decks (more slide builders + the depth control in `SKILL.md`).
- A `Number.isFinite` guard in `validateHard` (engine nice-to-have surfaced in Plan 1's final review).
- Job-ad-specific slide variants (CPA tiers, hiring-math slide) — the engine's `budgetFromHires` is ready; the deck currently renders the shared structure.
