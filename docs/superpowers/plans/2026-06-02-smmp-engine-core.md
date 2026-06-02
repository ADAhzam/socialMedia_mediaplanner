# Social Media Media Planner — Engine Core Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully test-driven, pure-JavaScript projection engine for the Social Media Media Planner skill — benchmarks, the two budget engines (branding reach + job-ad CPA), the steering layer (margin lever, per-channel boundary conditions, per-KPI overrides), tier recommendation, and the two-tier validation system.

**Architecture:** A small CommonJS library under `social-media-media-planner/lib/` with three modules — `benchmarks.js` (static reference-rate table + `getBenchmark` seam for future live Joveo data), `engine.js` (projection math + steering + tier logic), and `validate.js` (hard/soft rules). Pure functions, no I/O, so every behavior is unit-tested with Node's built-in test runner. Plan 2 (renderer) and Plan 3 (modules) consume this library; nothing here depends on them.

**Tech Stack:** Node.js (≥18), CommonJS modules, `node:test` + `node:assert` (zero external deps), git.

**Scope of this plan:** Engine + benchmarks + steering + validation only. Out of scope (later plans): pptxgenjs rendering, `SKILL.md` prose/intake, brand modes, targeting/keyword/insight modules, live data integration.

**Conventions used throughout:**
- CTR is stored and returned as a percentage number (e.g. `6.5` means 6.5%).
- Costs are in plan currency units (dollars); `getBenchmark` applies the geo multiplier to cost metrics only.
- Uniform projection model for every channel: `clicks = budget / cpc`, `impressions = clicks × 100 / ctr`, `cpm = cpc × (ctr/100) × 1000`. CPM is a derived display metric.
- Margin is a multiplier on cost rates: `clientRate = referenceRate × marginMultiplier`. Higher margin → higher CPC → fewer projected clicks (less attractive); lower margin → more clicks (more attractive). Default `1.0`.

---

## File Structure

```
social-media-media-planner/
  lib/
    package.json        # { "name": "smmp-engine", "private": true } — names the module, no deps
    benchmarks.js       # BENCHMARKS table, GEO_MULTIPLIER, getBenchmark()
    engine.js           # projectChannel, applyMargin, toRange, applyBoundary,
                        # applyOverrides, budgetFromHires, recommendTier, projectPlan
    validate.js         # CTR_BOUNDS, validateHard, validateSoft
  tests/
    benchmarks.test.js
    engine.test.js
    validate.test.js
```

Responsibilities: `benchmarks.js` owns reference data + the swap-seam. `engine.js` owns all math and steering composition. `validate.js` owns correctness checks. Files that change together (a function and its tests) are committed together.

---

## Task 0: Scaffold the library and test harness

**Files:**
- Create: `social-media-media-planner/lib/package.json`
- Create: `social-media-media-planner/tests/.gitkeep`

- [ ] **Step 1: Initialize git (repo does not exist yet)**

Run:
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && git init -b main
```
Expected: `Initialized empty Git repository ...`

- [ ] **Step 2: Create the library package manifest**

Create `social-media-media-planner/lib/package.json`:
```json
{
  "name": "smmp-engine",
  "version": "0.1.0",
  "private": true,
  "description": "Projection engine for the Social Media Media Planner skill",
  "scripts": {
    "test": "node --test ../tests/"
  }
}
```

- [ ] **Step 3: Create the tests directory placeholder**

Create `social-media-media-planner/tests/.gitkeep` (empty file).

- [ ] **Step 4: Verify Node and the test runner work**

Run:
```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --version && node --test social-media-media-planner/tests/
```
Expected: a Node version ≥ v18 prints, then the test runner reports `tests 0` / `pass 0` (no tests yet, exit 0).

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/package.json social-media-media-planner/tests/.gitkeep
git commit -m "chore: scaffold smmp engine library and test harness"
```

---

## Task 1: Benchmark table and getBenchmark seam

**Files:**
- Create: `social-media-media-planner/lib/benchmarks.js`
- Test: `social-media-media-planner/tests/benchmarks.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/benchmarks.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { getBenchmark, BENCHMARKS, GEO_MULTIPLIER } = require('../lib/benchmarks');

test('returns base CPC for US (multiplier 1.0)', () => {
  assert.strictEqual(getBenchmark('google_search', 'general_recruitment', 'us', 'cpc'), 3.0);
});

test('applies geo multiplier to CPC', () => {
  // 3.00 * 1.15 (uk) = 3.45
  assert.ok(Math.abs(getBenchmark('google_search', 'general_recruitment', 'uk', 'cpc') - 3.45) < 1e-9);
});

test('does not apply geo multiplier to CTR', () => {
  assert.strictEqual(getBenchmark('google_search', 'general_recruitment', 'uk', 'ctr'), 6.5);
});

test('derives CPM from CPC and CTR', () => {
  // 3.00 * (6.5/100) * 1000 = 195
  assert.ok(Math.abs(getBenchmark('google_search', 'general_recruitment', 'us', 'cpm') - 195) < 1e-9);
});

test('throws on unknown channel/industry/metric', () => {
  assert.throws(() => getBenchmark('tiktok', 'general_recruitment', 'us', 'cpc'));
  assert.throws(() => getBenchmark('google_search', 'aerospace', 'us', 'cpc'));
  assert.throws(() => getBenchmark('google_search', 'general_recruitment', 'us', 'roi'));
});

test('tables are exported and non-empty', () => {
  assert.ok(Object.keys(BENCHMARKS).length >= 5);
  assert.strictEqual(GEO_MULTIPLIER.us, 1.0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/benchmarks.test.js`
Expected: FAIL — `Cannot find module '../lib/benchmarks'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/lib/benchmarks.js`:
```js
'use strict';

// Reference (client-facing at margin = 1.0) rates. Each entry: { cpc, ctr }.
// ctr is a percentage. cpm is always derived. New channels/industries are
// added by following this same shape (Plan 2 extends to non-Google/Meta channels).
const BENCHMARKS = {
  general_recruitment: {
    google_search:   { cpc: 3.00, ctr: 6.5 },
    google_display:  { cpc: 1.56, ctr: 0.30 },
    meta_feed_image: { cpc: 1.80, ctr: 1.6 },
    meta_feed_video: { cpc: 1.35, ctr: 1.2 },
    meta_reels:      { cpc: 1.20, ctr: 1.0 },
  },
  healthcare: {
    google_search:   { cpc: 4.40, ctr: 7.2 },
    google_display:  { cpc: 2.28, ctr: 0.35 },
    meta_feed_image: { cpc: 2.64, ctr: 1.8 },
    meta_feed_video: { cpc: 1.98, ctr: 1.4 },
    meta_reels:      { cpc: 1.76, ctr: 1.2 },
  },
  software_tech: {
    google_search:   { cpc: 2.08, ctr: 8.6 },
    google_display:  { cpc: 1.08, ctr: 0.40 },
    meta_feed_image: { cpc: 1.25, ctr: 2.0 },
    meta_feed_video: { cpc: 0.94, ctr: 1.5 },
    meta_reels:      { cpc: 0.83, ctr: 1.3 },
  },
  logistics: {
    google_search:   { cpc: 1.70, ctr: 6.0 },
    google_display:  { cpc: 0.88, ctr: 0.28 },
    meta_feed_image: { cpc: 1.02, ctr: 1.4 },
    meta_feed_video: { cpc: 0.77, ctr: 1.1 },
    meta_reels:      { cpc: 0.68, ctr: 0.9 },
  },
  retail_hospitality: {
    google_search:   { cpc: 1.44, ctr: 5.8 },
    google_display:  { cpc: 0.75, ctr: 0.25 },
    meta_feed_image: { cpc: 0.86, ctr: 1.3 },
    meta_feed_video: { cpc: 0.65, ctr: 1.0 },
    meta_reels:      { cpc: 0.58, ctr: 0.85 },
  },
};

const GEO_MULTIPLIER = {
  us: 1.0, uk: 1.15, eu_west: 0.90, australia: 1.05, canada: 0.85, india: 0.20,
};

// The swap-seam: Plan-2+ can replace the body to read live Joveo data while
// keeping this exact signature. metric ∈ {'cpc','ctr','cpm'}.
function getBenchmark(channel, industry, geo, metric) {
  const ind = BENCHMARKS[industry];
  if (!ind) throw new Error(`Unknown industry: ${industry}`);
  const ch = ind[channel];
  if (!ch) throw new Error(`Unknown channel: ${channel} for industry ${industry}`);
  const mult = GEO_MULTIPLIER[geo];
  if (mult === undefined) throw new Error(`Unknown geo: ${geo}`);

  if (metric === 'ctr') return ch.ctr;
  if (metric === 'cpc') return ch.cpc * mult;
  if (metric === 'cpm') return ch.cpc * mult * (ch.ctr / 100) * 1000;
  throw new Error(`Unknown metric: ${metric}`);
}

module.exports = { BENCHMARKS, GEO_MULTIPLIER, getBenchmark };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/benchmarks.test.js`
Expected: PASS — all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/benchmarks.js social-media-media-planner/tests/benchmarks.test.js
git commit -m "feat(engine): static benchmark table with geo-aware getBenchmark seam"
```

---

## Task 2: projectChannel — core branding/reach projection

**Files:**
- Create: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js`

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/engine.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { projectChannel } = require('../lib/engine');

test('projects clicks and impressions from budget at margin 1.0', () => {
  const p = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us',
  });
  assert.strictEqual(p.channel, 'google_search');
  assert.strictEqual(p.budget, 3000);
  assert.ok(Math.abs(p.cpc - 3.0) < 1e-9);
  assert.strictEqual(p.ctr, 6.5);
  // clicks = 3000 / 3.00 = 1000
  assert.ok(Math.abs(p.clicks - 1000) < 1e-6);
  // impressions = 1000 * 100 / 6.5 = 15384.61...
  assert.ok(Math.abs(p.impressions - 15384.615384) < 1e-3);
  // cpm = 3.00 * 0.065 * 1000 = 195
  assert.ok(Math.abs(p.cpm - 195) < 1e-6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `Cannot find module '../lib/engine'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/lib/engine.js`:
```js
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

module.exports = { applyMargin, projectChannel };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): projectChannel core branding/reach projection"
```

---

## Task 3: Margin lever applied through projectChannel

**Files:**
- Modify: `social-media-media-planner/lib/engine.js` (already supports `marginMultiplier`; this task adds explicit tests + an `applyMargin` export test)
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append to engine.test.js)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { applyMargin } = require('../lib/engine');

test('applyMargin multiplies a rate', () => {
  assert.ok(Math.abs(applyMargin(3.0, 2.0) - 6.0) < 1e-9);
  assert.ok(Math.abs(applyMargin(3.0, 0.8) - 2.4) < 1e-9);
});

test('higher margin reduces projected clicks; lower margin increases them', () => {
  const base = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
  });
  const fatter = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 2.0,
  });
  const leaner = projectChannel({
    channelBudget: 3000, channel: 'google_search',
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 0.5,
  });
  assert.ok(fatter.clicks < base.clicks);   // margin up -> fewer clicks
  assert.ok(leaner.clicks > base.clicks);   // margin down -> more clicks
  assert.ok(Math.abs(fatter.cpc - 6.0) < 1e-9);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `applyMargin` not yet imported correctly OR the new assertions error. (If `applyMargin` is already exported from Task 2, the first new test passes but confirm both margin-direction assertions pass; if they fail, fix `projectChannel`.)

- [ ] **Step 3: Confirm implementation (no change expected)**

`applyMargin` and the `marginMultiplier` path were implemented in Task 2. No code change should be needed. If any assertion fails, the bug is in `projectChannel`'s margin handling — fix `engine.js` so `cpc = applyMargin(getBenchmark(...), marginMultiplier)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/tests/engine.test.js social-media-media-planner/lib/engine.js
git commit -m "test(engine): lock margin-lever direction and applyMargin"
```

---

## Task 4: toRange — projection ranges

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { toRange } = require('../lib/engine');

test('toRange uses default low 0.6 / high 1.5 multipliers', () => {
  const r = toRange(1000);
  assert.ok(Math.abs(r.low - 600) < 1e-9);
  assert.ok(Math.abs(r.high - 1500) < 1e-9);
});

test('toRange accepts custom multipliers', () => {
  const r = toRange(1000, { lowMult: 0.6, highMult: 1.45 });
  assert.ok(Math.abs(r.low - 600) < 1e-9);
  assert.ok(Math.abs(r.high - 1450) < 1e-9);
});

test('toRange low never exceeds high', () => {
  const r = toRange(1000);
  assert.ok(r.low <= r.high);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `toRange` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
function toRange(value, { lowMult = 0.6, highMult = 1.5 } = {}) {
  return { low: value * lowMult, high: value * highMult };
}
```
And add `toRange` to the `module.exports` object.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): toRange for low/high projection ranges"
```

---

## Task 5: applyBoundary — per-channel boundary conditions

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { applyBoundary } = require('../lib/engine');

test('value inside the band is unchanged', () => {
  const r = applyBoundary(9800, { anchor: 10000, tolerancePct: 10 });
  assert.strictEqual(r.value, 9800);
  assert.strictEqual(r.clamped, false);
});

test('value above the band clamps to the high edge', () => {
  const r = applyBoundary(12000, { anchor: 10000, tolerancePct: 10 });
  assert.ok(Math.abs(r.value - 11000) < 1e-9);
  assert.strictEqual(r.clamped, true);
});

test('value below the band clamps to the low edge', () => {
  const r = applyBoundary(8000, { anchor: 10000, tolerancePct: 10 });
  assert.ok(Math.abs(r.value - 9000) < 1e-9);
  assert.strictEqual(r.clamped, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `applyBoundary` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
function applyBoundary(value, { anchor, tolerancePct }) {
  const low = anchor * (1 - tolerancePct / 100);
  const high = anchor * (1 + tolerancePct / 100);
  if (value < low) return { value: low, clamped: true };
  if (value > high) return { value: high, clamped: true };
  return { value, clamped: false };
}
```
And add `applyBoundary` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): applyBoundary clamps a metric to an anchor +/- tolerance band"
```

---

## Task 6: applyOverrides — per-KPI overrides

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { applyOverrides } = require('../lib/engine');

test('overrides replace matching fields and leave others intact', () => {
  const projection = { channel: 'google_search', cpc: 3.0, clicks: 1000, impressions: 15384 };
  const out = applyOverrides(projection, { cpc: 2.5, clicks: 1200 });
  assert.strictEqual(out.cpc, 2.5);
  assert.strictEqual(out.clicks, 1200);
  assert.strictEqual(out.impressions, 15384); // untouched
  assert.strictEqual(out.channel, 'google_search');
});

test('applyOverrides does not mutate the input', () => {
  const projection = { cpc: 3.0 };
  applyOverrides(projection, { cpc: 1.0 });
  assert.strictEqual(projection.cpc, 3.0);
});

test('empty overrides return an equivalent object', () => {
  const projection = { cpc: 3.0, clicks: 1000 };
  assert.deepStrictEqual(applyOverrides(projection, {}), projection);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `applyOverrides` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
function applyOverrides(projection, overrides = {}) {
  return { ...projection, ...overrides };
}
```
And add `applyOverrides` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): applyOverrides for per-KPI manual overrides"
```

---

## Task 7: budgetFromHires — job-ad backward CPA math

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { budgetFromHires } = require('../lib/engine');

test('computes apps target and budget from hires (BAYADA example)', () => {
  // 8 hires * 50:1 ratio = 400 apps; 400 * $92.50 = $37,000
  const r = budgetFromHires({ hires: 8, applyToHireRatio: 50, targetCpa: 92.5 });
  assert.strictEqual(r.appsTarget, 400);
  assert.ok(Math.abs(r.budget - 37000) < 1e-6);
});

test('throws on non-positive inputs', () => {
  assert.throws(() => budgetFromHires({ hires: 0, applyToHireRatio: 50, targetCpa: 92.5 }));
  assert.throws(() => budgetFromHires({ hires: 8, applyToHireRatio: 0, targetCpa: 92.5 }));
  assert.throws(() => budgetFromHires({ hires: 8, applyToHireRatio: 50, targetCpa: -1 }));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `budgetFromHires` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
function budgetFromHires({ hires, applyToHireRatio, targetCpa }) {
  if (!(hires > 0) || !(applyToHireRatio > 0) || !(targetCpa > 0)) {
    throw new Error('hires, applyToHireRatio, and targetCpa must all be positive');
  }
  const appsTarget = hires * applyToHireRatio;
  const budget = appsTarget * targetCpa;
  return { appsTarget, budget };
}
```
And add `budgetFromHires` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): budgetFromHires job-ad backward CPA math"
```

---

## Task 8: recommendTier — logic-driven tier recommendation

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { recommendTier } = require('../lib/engine');

test('recommends the tier nearest a target budget', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }, { budget: 14000 }];
  assert.strictEqual(recommendTier(tiers, { targetBudget: 8000 }), 1); // 9000 nearest
});

test('falls back to the median tier when no target given', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }, { budget: 14000 }];
  assert.strictEqual(recommendTier(tiers, {}), 1); // index 1 of 3
});

test('never recommends an out-of-range index', () => {
  const tiers = [{ budget: 5000 }, { budget: 9000 }];
  const idx = recommendTier(tiers, { targetBudget: 999999 });
  assert.ok(idx >= 0 && idx < tiers.length);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `recommendTier` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
// Logic-driven (fixes the "Tier 3 always recommended" tic).
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
  return Math.floor((tiers.length - 1) / 2); // median tier
}
```
And add `recommendTier` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): logic-driven recommendTier"
```

---

## Task 9: projectPlan — compose tiers, channels, steering, totals

**Files:**
- Modify: `social-media-media-planner/lib/engine.js`
- Test: `social-media-media-planner/tests/engine.test.js` (append)

This composes Tasks 2–8: for each tier, split the tier budget by channel allocation, project each channel, apply per-channel boundary then overrides, attach ranges, and total clicks/impressions. Then mark the recommended tier.

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const { projectPlan } = require('../lib/engine');

const samplePlan = {
  industry: 'general_recruitment',
  geo: 'us',
  marginMultiplier: 1.0,
  targetBudget: 9000,
  tiers: [
    {
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    },
    {
      name: 'Tier 2', budget: 9000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    },
  ],
};

test('projectPlan splits budget by allocation and totals clicks', () => {
  const out = projectPlan(samplePlan);
  const t1 = out.tiers[0];
  const gs = t1.channels.find(c => c.channel === 'google_search');
  // 10% of 5000 = 500 budget; 500 / 3.00 = 166.67 clicks
  assert.ok(Math.abs(gs.budget - 500) < 1e-6);
  assert.ok(Math.abs(gs.clicks - 166.6667) < 1e-3);
  // totals = sum of channel clicks
  const summed = t1.channels.reduce((s, c) => s + c.clicks, 0);
  assert.ok(Math.abs(t1.totals.clicks - summed) < 1e-6);
  // each channel carries ranges
  assert.ok(gs.clicksRange.low <= gs.clicksRange.high);
  assert.ok(gs.impressionsRange.low <= gs.impressionsRange.high);
});

test('projectPlan marks exactly one recommended tier (nearest targetBudget)', () => {
  const out = projectPlan(samplePlan);
  const flagged = out.tiers.filter(t => t.recommended);
  assert.strictEqual(flagged.length, 1);
  assert.strictEqual(out.tiers[1].recommended, true); // 9000 == targetBudget
});

test('projectPlan applies a per-channel boundary clamp on clicks', () => {
  const plan = {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
    tiers: [{
      name: 'T', budget: 5000,
      allocations: { google_search: 100 },
      boundaries: { google_search: { metric: 'clicks', anchor: 1000, tolerancePct: 10 } },
    }],
  };
  const gs = projectPlan(plan).tiers[0].channels[0];
  // raw clicks = 5000/3 = 1666.67 -> clamped to 1100 (1000 +10%)
  assert.ok(Math.abs(gs.clicks - 1100) < 1e-6);
  assert.strictEqual(gs.clamped, true);
});

test('projectPlan applies per-channel overrides last', () => {
  const plan = {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0,
    tiers: [{
      name: 'T', budget: 5000,
      allocations: { google_search: 100 },
      overrides: { google_search: { cpc: 2.0 } },
    }],
  };
  const gs = projectPlan(plan).tiers[0].channels[0];
  assert.strictEqual(gs.cpc, 2.0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `projectPlan` is not a function.

- [ ] **Step 3: Write minimal implementation (add to engine.js)**

Add to `social-media-media-planner/lib/engine.js` (before `module.exports`):
```js
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
```
And add `projectPlan` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: PASS — all engine tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/engine.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): projectPlan composes tiers, steering, ranges, totals, recommendation"
```

---

## Task 10: validateHard — blocking consistency rules

**Files:**
- Create: `social-media-media-planner/lib/validate.js`
- Test: `social-media-media-planner/tests/validate.test.js`

Operates on a **plan** (input) plus its **projected output** (from `projectPlan`). Returns an array of error strings (empty = valid).

- [ ] **Step 1: Write the failing test**

Create `social-media-media-planner/tests/validate.test.js`:
```js
const { test } = require('node:test');
const assert = require('node:assert');
const { projectPlan } = require('../lib/engine');
const { validateHard } = require('../lib/validate');

function goodPlan() {
  return {
    industry: 'general_recruitment', geo: 'us', marginMultiplier: 1.0, targetBudget: 5000,
    tiers: [{
      name: 'Tier 1', budget: 5000,
      allocations: { google_search: 10, meta_feed_image: 50, meta_feed_video: 40 },
    }],
  };
}

test('a consistent plan produces no hard errors', () => {
  const plan = goodPlan();
  assert.deepStrictEqual(validateHard(plan, projectPlan(plan)), []);
});

test('allocations not summing to 100 is a hard error', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 10, meta_feed_image: 50, meta_feed_video: 30 }; // 90
  const errs = validateHard(plan, projectPlan(plan));
  assert.ok(errs.some(e => /sum to 100/i.test(e)));
});

test('a leftover {{placeholder}} anywhere is a hard error', () => {
  const plan = goodPlan();
  plan.tiers[0].name = 'Tier {{n}}';
  const errs = validateHard(plan, projectPlan(plan));
  assert.ok(errs.some(e => /placeholder/i.test(e)));
});

test('an inverted range is a hard error', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  projected.tiers[0].channels[0].clicksRange = { low: 100, high: 10 }; // inverted
  const errs = validateHard(plan, projected);
  assert.ok(errs.some(e => /inverted range/i.test(e)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/validate.test.js`
Expected: FAIL — `Cannot find module '../lib/validate'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/lib/validate.js`:
```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/validate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/validate.js social-media-media-planner/tests/validate.test.js
git commit -m "feat(validate): hard consistency rules (sums, ranges, placeholders)"
```

---

## Task 11: validateSoft — non-blocking realism warnings

**Files:**
- Modify: `social-media-media-planner/lib/validate.js`
- Test: `social-media-media-planner/tests/validate.test.js` (append)

Returns warning strings (never blocks) so AMs can intentionally go off-benchmark.

- [ ] **Step 1: Write the failing test (append)**

Append to `social-media-media-planner/tests/validate.test.js`:
```js
const { validateSoft } = require('../lib/validate');

test('a realistic plan produces no soft warnings', () => {
  const plan = goodPlan();
  assert.deepStrictEqual(validateSoft(plan, projectPlan(plan)), []);
});

test('CPC above $9.00 warns (override allowed)', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  projected.tiers[0].channels[0].cpc = 12.0; // google_search
  const warns = validateSoft(plan, projected);
  assert.ok(warns.some(w => /CPC/i.test(w) && /google_search/.test(w)));
});

test('a sub-$300 channel budget warns', () => {
  const plan = goodPlan();
  plan.tiers[0].allocations = { google_search: 2, meta_feed_image: 58, meta_feed_video: 40 };
  const projected = projectPlan(plan);
  const warns = validateSoft(plan, projected);
  // google_search = 2% of 5000 = $100 < $300
  assert.ok(warns.some(w => /below \$300/i.test(w) && /google_search/.test(w)));
});

test('Google Search CPC not exceeding Meta CPC warns', () => {
  const plan = goodPlan();
  const projected = projectPlan(plan);
  const gs = projected.tiers[0].channels.find(c => c.channel === 'google_search');
  const mi = projected.tiers[0].channels.find(c => c.channel === 'meta_feed_image');
  gs.cpc = 1.0; mi.cpc = 2.0; // invert the expected ordering
  const warns = validateSoft(plan, projected);
  assert.ok(warns.some(w => /Google Search CPC/i.test(w)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/validate.test.js`
Expected: FAIL — `validateSoft` is not a function.

- [ ] **Step 3: Write minimal implementation (add to validate.js)**

Add to `social-media-media-planner/lib/validate.js` (before `module.exports`):
```js
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
```
And add `validateSoft` and `CTR_BOUNDS` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/validate.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/validate.js social-media-media-planner/tests/validate.test.js
git commit -m "feat(validate): soft realism warnings (CPC/CTR/min-spend/GS>Meta)"
```

---

## Task 12: Full suite green + engine entry point

**Files:**
- Create: `social-media-media-planner/lib/index.js`
- Test: (runs the whole suite)

- [ ] **Step 1: Write the failing test (append to engine.test.js)**

Append to `social-media-media-planner/tests/engine.test.js`:
```js
const smmp = require('../lib');

test('package index re-exports the public API', () => {
  ['projectPlan', 'projectChannel', 'budgetFromHires', 'recommendTier',
   'applyMargin', 'applyBoundary', 'applyOverrides', 'toRange',
   'getBenchmark', 'validateHard', 'validateSoft'].forEach((fn) => {
    assert.strictEqual(typeof smmp[fn], 'function', `${fn} should be exported from index`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/engine.test.js`
Expected: FAIL — `Cannot find module '../lib'`.

- [ ] **Step 3: Write minimal implementation**

Create `social-media-media-planner/lib/index.js`:
```js
'use strict';

const benchmarks = require('./benchmarks');
const engine = require('./engine');
const validate = require('./validate');

module.exports = {
  ...benchmarks,
  ...engine,
  ...validate,
};
```

- [ ] **Step 4: Run the FULL suite to verify everything passes**

Run: `cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP" && node --test social-media-media-planner/tests/`
Expected: PASS — all tests across `benchmarks.test.js`, `engine.test.js`, `validate.test.js` pass; `fail 0`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/adnanahzam/Documents/Joveo - Claude/Social Media MP"
git add social-media-media-planner/lib/index.js social-media-media-planner/tests/engine.test.js
git commit -m "feat(engine): public index entry point; full suite green"
```

---

## Definition of done (Plan 1)
- `node --test social-media-media-planner/tests/` reports all tests passing, `fail 0`.
- `require('social-media-media-planner/lib')` exposes: `getBenchmark`, `projectChannel`, `applyMargin`, `toRange`, `applyBoundary`, `applyOverrides`, `budgetFromHires`, `recommendTier`, `projectPlan`, `validateHard`, `validateSoft`.
- The engine implements: branding/reach projection, job-ad backward CPA math, the margin lever (global via `marginMultiplier`; per-channel override via `tier.overrides`), per-channel boundary clamping, per-KPI overrides, logic-driven tier recommendation, and hard/soft validation — all from the PRD §6.

## Hand-off to Plan 2
Plan 2 (Renderer & skill shell) consumes `projectPlan(...)` output and the validation arrays: it renders the branded PPTX, runs `validateHard` as a blocking gate and `validateSoft` as surfaced warnings, and adds brand modes + slide blueprints + the visual QA pass. Plan 3 adds the optional Targeting/Keyword/Insight modules.
