# Social Media Media Planner — Project Handoff & Context

**Last updated:** 2026-06-03
**Repo:** https://github.com/ADAhzam/socialMedia_mediaplanner
**Status:** v1 shipped — skill + web app live on Vercel (team-gated).

This doc is a self-contained handoff: what the project is, what's been built, how to run/test/deploy it, the key decisions, and the prioritized next steps. A fresh engineer (or Cursor session) should be able to pick up from here.

---

## 1. What this is

A tool that turns a recruitment-marketing brief into a **client-ready media-plan PowerPoint deck** for Joveo's small-spend segment (clients under ~$20k/month), across Google + Meta (and other channels — the engine treats channels as config). It supports two campaign archetypes:

- **Job-Ad / Performance** — CPA-driven (hires × apply-to-hire ratio × target CPA → budget).
- **Employer-Branding / Reach** — budget → channel allocation → projected clicks/impressions, with four objectives: traffic, awareness/reach, lead-capture, retargeting.

It ships in **two forms**:
1. A **Claude skill** (`social-media-media-planner/SKILL.md` + JS engine) — used inside Claude/Cursor.
2. A **web app** (`web/`, Next.js on Vercel) — a structured form any AM can use at a URL.

The full product spec is in **`docs/superpowers/specs/2026-06-02-social-media-media-planner-design.md`** (the approved PRD). Implementation plans are in **`docs/superpowers/plans/`**.

---

## 2. What's been built (4 phases, all done)

| Phase | Plan file | What it delivered | Tests |
|---|---|---|---|
| **1 — Engine** | `plans/2026-06-02-smmp-engine-core.md` | Pure-JS projection engine: benchmarks + branding/reach projection + job-ad CPA math + **steering** (margin lever, per-channel boundary clamps with row reconciliation, per-KPI overrides) + logic-driven tier recommendation + hard/soft validation | 41 |
| **2 — Renderer & skill shell** | `plans/2026-06-02-smmp-renderer.md` | `generate()` → validation gate → 9-slide branded PPTX; **3 brand modes** (Joveo / co-branded / **white-label**) + client logo/colors; dynamic slide count; `SKILL.md` + references | +22 (63) |
| **3 — Optional modules** | `plans/2026-06-03-smmp-modules.md` | Optional, toggled-per-plan: **Targeting** + **Keywords** (deterministic, AM-editable) and **Insights** (market landscape / active-vs-passive / competitive — researched + cited, validated). Module slides render between Measurement and Next-Steps | +17 (80) |
| **4 — Web app** | `plans/2026-06-03-smmp-web.md` | npm-workspaces monorepo; `@smmp/engine` package + `generateBuffer` (serverless); Next.js 16 app with a structured form → live preview + deck download; team Basic-Auth; deployed to Vercel | +5 (engine 82, web 3) |

**Everything was built test-first (TDD) and reviewed.** Current totals: **82 engine tests + 3 web tests, all green.**

---

## 3. Repo structure

```
<repo root>/
  package.json                       # npm workspaces: ["social-media-media-planner","web"]
  docs/
    HANDOFF.md                       # this file
    superpowers/specs/               # the PRD
    superpowers/plans/               # the 4 implementation plans
  social-media-media-planner/        # the @smmp/engine package + the Claude skill
    package.json                     # name "@smmp/engine", main "index.js", dep: pptxgenjs
    index.js                         # re-exports the public API
    lib/                             # ENGINE (pure, no I/O)
      benchmarks.js                  # static rate table + getBenchmark(seam for live data)
      engine.js                      # projectChannel, projectPlan, steering, recommendTier, reconcileRow
      validate.js                    # validateHard (blocks) / validateSoft (warns)
      index.js
    render/                          # RENDERER (pptxgenjs)
      format.js, palette.js, brand.js, gate.js, viewmodel.js
      render-helpers.js, render.js   # 9 base slides + module slides; renderDeck / renderDeckBuffer
      generate.js                    # generate() (file) + generateBuffer() (serverless)
      modules/                       # targeting.js, keywords.js, insights.js
    tests/                           # node:test suite (run with `node --test`)
    SKILL.md                         # the Claude skill: brief -> deck orchestration
    references/                      # slide-blueprints, brand-modes, pptx-helpers, targeting/keyword/insights specs
  web/                               # Next.js 16 app (Vercel "Root Directory" = web)
    package.json                     # next/react/ts/tailwind + "@smmp/engine":"*"
    next.config.js                   # serverExternalPackages:['pptxgenjs'], transpilePackages:['@smmp/engine']
    middleware.ts                    # team Basic-Auth (fail-closed in prod; constant-time; no-store)
    app/page.tsx                     # the form (preview + download)
    app/api/plan/route.ts            # POST -> projections + warnings
    app/api/generate/route.ts        # POST -> .pptx download
    lib/plan-builder.js              # form state -> engine plan (tested)
    lib/presets.js                   # channel-mix presets by archetype
    tests/plan-builder.test.js
```

**Branches:** `main` and `release` are in sync (latest = full app). Feature branches were merged + deleted as work completed. Convention used: build on a `feature/*` branch → merge to `release` (GitHub) → keep `main` synced.

---

## 4. How to run & test

> Node 18+ (developed on Node 24). From the repo root, `npm install` once (links the workspace).

**Run the engine test suite (the real "does it work" check):**
```bash
cd social-media-media-planner && node --test "tests/"*.test.js      # 82 tests
cd web && node --test tests/plan-builder.test.js                    # 3 tests
```

**Generate a deck from the CLI (skill-style):**
```bash
cd social-media-media-planner
node -e "require('./render/generate').generate({
  industry:'healthcare', geo:'uk', marginMultiplier:1.0, targetBudget:9000,
  client:{name:'Acme Care'}, brandMode:'joveo', archetype:'branding',
  objectiveLabel:'Employer Branding', geoLabel:'Manchester', dateStr:'June 2026',
  roleGroups:[{name:'Registered Nurse',subtitle:'Clinical'}],
  locations:[{name:'Manchester',detail:''}],
  modules:{targeting:true,keywords:true},
  tiers:[
    {name:'Tier 1',budget:5000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}},
    {name:'Tier 2',budget:9000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}}
  ]
},'out/demo.pptx').then(r=>console.log(r))"
```
The plan-object schema is documented in `social-media-media-planner/SKILL.md`.

**Run the web app locally:**
```bash
cd web && npm run dev          # http://localhost:3000  (auth is open in dev / non-production)
```
APIs: `POST /api/plan` (preview JSON), `POST /api/generate` (pptx download), `GET /api/health`.

---

## 5. Deployment (live)

- Hosted on **Vercel**, deployed from this GitHub repo.
- **Vercel project "Root Directory" must be `web`** (monorepo). Vercel installs the workspace from the repo root automatically.
- **Required env vars** (Production + Preview): `TEAM_USER`, `TEAM_PASS` — they power the team login gate. The middleware **fails closed** in production: if these are unset you get `Server misconfigured: team credentials not set` (by design). Optional `ALLOW_UNAUTHENTICATED=1` opens it (local/dev only).
- Access is **HTTP Basic Auth** (browser shows a native username/password dialog). Share the URL + creds with teammates. Every branch/PR push gets its own preview URL.

---

## 6. Key design decisions (so you don't re-litigate them)

- **Engine is pure & I/O-free**; the renderer and web app consume it. This is why the web app reuses the engine with no rewrite.
- **Steering is first-class** (a core requirement): numbers start from benchmarks, then a **margin lever** (global + per-channel), **per-channel boundary conditions** (anchor ± tolerance, with dependent metrics reconciled so rows stay self-consistent), and **per-KPI overrides**. Direct field overrides are taken as-is (the AM owns them).
- **Validation is two-tier:** *hard* rules block (allocation sums, inverted ranges, leftover `{{placeholders}}`, budget sums); *soft* rules only warn (CPC/CTR realism, min spend) — because going off-benchmark to win a deal is intentional.
- **Benchmarks are a static table now, with a `getBenchmark(channel,industry,geo,metric)` seam** designed to be swapped for live Joveo data later — no engine change needed.
- **Brand modes:** Joveo / co-branded / **white-label**. White-label is leak-tested — no "Joveo"/"yoke" anywhere in the deck, *including PPTX metadata* (`pres.author`/`company` are brand-aware). There's a regression test that unzips the archive and greps for it.
- **Insights are never fabricated in code** — the skill researches + cites them and the AM approves; uncited insights produce a soft warning. (In the web form, simple insights like active/passive % and competitor names are AM-entered.)

---

## 7. Gotchas / environment notes

- **Node 24** changed `node --test <dir>` behavior on an empty dir — use the glob form `node --test "tests/"*.test.js`.
- **pptxgenjs** must be in `serverExternalPackages` in `next.config.js` (it can't be bundled by Turbopack); the engine is in `transpilePackages`.
- **Next 16 deprecation:** `middleware.ts` works but Next 16 prefers a `proxy.ts` convention — rename when convenient (non-blocking warning today).
- **Visual QA was coordinate/XML-based** (no LibreOffice/pdftoppm installed in the build env). Always **open a generated deck in PowerPoint** before a real client send to confirm aesthetic polish. Sample decks are generated under `social-media-media-planner/out/` (gitignored).
- `node_modules/`, `.next/`, `out/`, `.env*.local`, `package-lock.json` are gitignored.

---

## 8. Next steps (prioritized)

**Recommended next build → AI brief → autofill.** Paste a freeform brief/JD; an LLM (via Vercel AI Gateway) parses it into the form, the AM reviews/edits, then generates. Restores the skill's "paste a brief, get a deck" magic; highest UX impact; self-contained. *Needs:* an AI provider/key on Vercel.

Then, in rough priority:
2. **Full steering UI** — expose per-tier channel-mix editing + per-channel boundary conditions + per-KPI overrides in the web form (the engine already supports all of it; the form currently only exposes the margin lever).
3. **Live Joveo benchmark data** — implement the `getBenchmark` seam against real performance data (BigQuery/warehouse). Biggest credibility boost.
4. **Saved plans + history** — persist/duplicate/share plans (needs a DB: Neon/Vercel Postgres).
5. **Build-sheet / UTM export + operational tracker** — the downstream ops layer from the PRD (targeting/keywords already generate; add UTM builder + a line-item tracker).
6. **Polish** — Intermediate (14) / Maximalist (21) deck depths (only Minimal/9 is built; more slide builders needed), `middleware.ts → proxy.ts`, Vercel SSO instead of shared password, accessibility pass.

**How to run a next phase** (the workflow that built this): brainstorm/scope → write a spec in `docs/superpowers/specs/` → write a TDD plan in `docs/superpowers/plans/` → build it task-by-task (tests first, frequent commits) on a `feature/*` branch → review → merge to `release` → deploy. The Superpowers skills (brainstorming, writing-plans, subagent-driven-development, finishing-a-development-branch) were used throughout and are the recommended way to continue.

---

## 9. Quick reference

- **PRD:** `docs/superpowers/specs/2026-06-02-social-media-media-planner-design.md`
- **Plans:** `docs/superpowers/plans/2026-06-02-smmp-engine-core.md`, `2026-06-02-smmp-renderer.md`, `2026-06-03-smmp-modules.md`, `2026-06-03-smmp-web.md`
- **Engine API:** `require('@smmp/engine')` → `projectPlan`, `generate`, `generateBuffer`, `prepareForRender`, `buildDeckModel`, `buildTargeting`, `buildKeywords`, `validateHard`, `validateSoft`, …
- **Skill entry:** `social-media-media-planner/SKILL.md`
- **Web entry:** `web/app/page.tsx`, `web/app/api/*`
