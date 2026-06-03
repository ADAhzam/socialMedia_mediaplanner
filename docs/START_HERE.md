# START HERE — Context for a New Claude/Cursor Session

> Paste this file's contents (or point the assistant at it) at the start of a new chat. It explains the project, lets you **verify the uploaded code is complete**, and sets up to continue. This project was moved here as a **zip upload** (not a git clone), so a couple of setup notes matter — see §2.

---

## 1. What this project is (30-second version)

A tool that turns a recruitment-marketing brief into a **client-ready media-plan PowerPoint deck** for Joveo's small-spend segment (clients under ~$20k/mo), across Google + Meta and other channels. It exists in two forms:

- A **Claude skill** — `social-media-media-planner/SKILL.md` + a pure-JS engine.
- A **web app** — `web/` (Next.js), deployed to Vercel behind a team login.

**Full context is in `docs/HANDOFF.md`** — read that next; it has architecture, decisions, gotchas, and the prioritized roadmap. This file is just the onboarding + integrity check.

---

## 2. Setup after a ZIP upload (important)

The zip does **not** include `node_modules/`, `web/.next/`, `social-media-media-planner/out/`, `.env*.local`, `package-lock.json`, or git history — these are gitignored and regenerated. That's expected; the **source code is complete** if §3 passes.

To set up:
```bash
# from the repo root (the folder containing package.json with "workspaces")
npm install          # links the npm workspace (@smmp/engine) + installs pptxgenjs/Next deps
```
If you want version control again, either re-init (`git init`) or clone the canonical repo instead:
`https://github.com/ADAhzam/socialMedia_mediaplanner` (branches `main`/`release` hold the same code).

---

## 3. Verify the upload is complete (run these)

**A. Structure check** — these must all exist:
```bash
ls package.json \
   social-media-media-planner/index.js \
   social-media-media-planner/lib/engine.js \
   social-media-media-planner/lib/benchmarks.js \
   social-media-media-planner/lib/validate.js \
   social-media-media-planner/render/generate.js \
   social-media-media-planner/render/render.js \
   social-media-media-planner/render/viewmodel.js \
   social-media-media-planner/render/gate.js \
   social-media-media-planner/render/modules/targeting.js \
   social-media-media-planner/render/modules/keywords.js \
   social-media-media-planner/render/modules/insights.js \
   social-media-media-planner/SKILL.md \
   web/app/page.tsx \
   web/app/api/plan/route.ts \
   web/app/api/generate/route.ts \
   web/middleware.ts \
   web/lib/plan-builder.js \
   docs/HANDOFF.md
```

**B. The definitive check — run the tests.** If these pass, every piece of engine + render + module + web logic is intact:
```bash
cd social-media-media-planner && node --test "tests/"*.test.js   # expect: 82 pass, 0 fail
cd ../web && node --test tests/plan-builder.test.js              # expect: 3 pass, 0 fail
```
(Node 18+; developed on Node 24. Use the glob form above — `node --test <dir>` misbehaves on Node 24 with an empty dir.)

**C. Generate a deck end-to-end** (proves the renderer works):
```bash
cd social-media-media-planner
node -e "require('./render/generate').generate({industry:'healthcare',geo:'uk',marginMultiplier:1.0,targetBudget:9000,client:{name:'Acme Care'},brandMode:'joveo',archetype:'branding',objectiveLabel:'Employer Branding',geoLabel:'Manchester',dateStr:'June 2026',roleGroups:[{name:'Registered Nurse',subtitle:'Clinical'}],locations:[{name:'Manchester',detail:''}],modules:{targeting:true,keywords:true},tiers:[{name:'Tier 1',budget:5000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}},{name:'Tier 2',budget:9000,allocations:{google_search:10,meta_feed_image:50,meta_feed_video:40}}]},'out/verify.pptx').then(r=>console.log('OK',r))"
# expect: OK { outPath:'out/verify.pptx', slideCount:12, warnings:[] } and an openable .pptx
```

**D. Run the web app:**
```bash
cd web && npm run dev    # http://localhost:3000 (auth is open in dev)
```

If A–D all pass, you have the complete codebase and can continue.

---

## 4. Current state (as of 2026-06-03)

- **All 4 build phases are done and tested** (engine → renderer → optional modules → web app). 82 engine tests + 3 web tests, all green.
- The **web app is live on Vercel**, team-gated via `TEAM_USER` / `TEAM_PASS` env vars (Vercel project Root Directory = `web`). If you see "Server misconfigured: team credentials not set," that's the auth failing closed in production — set those env vars and redeploy.
- The PRD is in `docs/superpowers/specs/`; the 4 implementation plans are in `docs/superpowers/plans/`.

---

## 5. What to build next (recommended)

**AI brief → autofill:** paste a freeform brief/JD; an LLM (via Vercel AI Gateway) parses it into the web form, the AM reviews/edits, then generates. Restores the skill's "paste a brief, get a deck" magic; highest-impact, self-contained. Needs an AI key on Vercel.

Then: full steering UI (per-tier channels + boundaries + overrides — the engine already supports these), live Joveo benchmark data (via the `getBenchmark` seam), saved plans (DB), build-sheet/UTM export + tracker, and Intermediate/Maximalist deck depths. Details + priorities in `docs/HANDOFF.md` §8.

**Workflow to continue (how this was built):** brainstorm/scope → write a spec in `docs/superpowers/specs/` → write a TDD plan in `docs/superpowers/plans/` → build task-by-task (tests first, frequent commits) → review → integrate. If the Superpowers skills are available, use brainstorming → writing-plans → subagent-driven-development.

---

## 6. One-line summary to give the new chat

> "This is the Social Media Media Planner — a Joveo media-plan→PPTX generator (pure-JS engine in `social-media-media-planner/`, Next.js web app in `web/`, live on Vercel). Read `docs/HANDOFF.md` for full context, run the tests in §3 of `docs/START_HERE.md` to confirm the code is intact, then let's continue with [AI brief autofill / your choice]."
