# Social Media Media Planner — Full Project Context

> **Purpose of this document.** This is the complete context for the project, written so you can paste it into a **new Claude/Cursor session** and continue development with full understanding. It covers the mission, the reference materials that shaped the design, the domain model, what's been built, the data contract, and — importantly — the **vision for using Joveo's internal database** to power media-plan creation. For build/run/test/deploy specifics see `docs/HANDOFF.md`; for onboarding a new workspace see `docs/START_HERE.md`. The product spec is `docs/superpowers/specs/2026-06-02-social-media-media-planner-design.md`.

---

## 1. Mission & the problem

Joveo Account Managers (AMs) and Sales build **media-plan proposal decks** for clients — especially the **small-spend segment (under ~$20k/month)** — to win and structure recruitment-advertising campaigns across Google, Meta, and other social channels.

Today this is **manual, slow, and inconsistent**:
- Numbers vary deck-to-deck; benchmarks are ad-hoc, US-centric, and drift over time.
- Copy-paste bugs reach clients (unfilled `{{placeholders}}`, a "CTR" card showing a click count, overlapping text, "Tier 3 always recommended").
- There's no clean way to **steer numbers for competitive deals** (e.g., undercut a competitor's CPA by giving up some Joveo margin).
- Market/competitive insight slides are *defined* but require the AM to hand-source all data, so they're usually skipped.
- Branding is inconsistent, and there's no white-label path for clients who forward the report to *their* end clients.

**What we're building:** a system that turns a brief into a polished, accurate, on-brand, **bug-free** media-plan deck in minutes — with the AM able to **steer every commercially relevant number** within guardrails, and with optional, reviewed enrichments (audience targeting, keyword plans, market/competitive insights). It ships both as a **Claude skill** and as a **web app** (live on Vercel, team-gated).

**Primary user:** Joveo internal AM / Sales. Internal margins and raw benchmarks are never exposed to the client.

---

## 2. Reference materials (the empirical basis of the design)

The design was reverse-engineered from **12 real Joveo media plans and operational sheets** that were uploaded as references. These are **not in the repo** (they were chat attachments), so they're catalogued here. Each taught us something specific; together they define the "spine" of the product.

### 2.1 The polished client decks

| # | Document | Type / brand | What it taught us |
|---|---|---|---|
| 1 | **Acme Care — RN Manchester** | Employer-branding deck ("joveo \| yoke", navy/crimson, 8 slides) | The **branding/reach archetype**: budget → 3-pillar structure (Direct Response / Brand & Storytelling / Active Intent) → projected **clicks/impressions only** (no applies). Meta-first; £5k/mo; per-audience-segment table; blended CPC. |
| 2 | **BAYADA Inspira Health** | Google-Search-only recruitment plan (navy/teal) | The **job-ad / CPA archetype**, math running *backward from hires*: 8 hires × 50:1 apply-to-hire = 400 apps; apps × target CPA ($85/$92.50/$100) = budget ($34k/$37k/$40k). Three options by **CPA assumption**. Projects applications. |
| 3 | **Bobcat Mexico** | Integrated campaign ("Wiser" agency brand, orange) | The **lead-capture / talent-community model**: Meta lead forms + **qualifying questions** + lead management in a Google Sheet + job fairs; awareness→consideration→conversion; detailed Meta audience building; a 3-month media-plan table (CPM/CTR/CPC/form-fills). Also a non-Joveo brand → motivated **white-label** support. |
| 4 | **Catholic Health** | Specialist recruitment, Meta & Google Search ("joveo", navy/crimson/blue) | The **canonical intermediate/maximalist deck**: Strategic Situation, Target Locations & Role Groups, Multi-Stage Funnel, Channel Strategy, **3 tiers (Good/Better/Best $5k/$9k/$14k)**, Projected Performance (clicks+impressions, blended CTR), Audience Targeting, Measurement. Closest to the skill's full output. |
| 5 | **FCC Environmental** | EB media plan, app-gen (green) | **Scenarios** (All Roles vs Priority Roles); a **wider channel set** (Google Search/PMax/Demand Gen + Meta Feed Image/Carousel); per-channel projection table (budget/impr/clicks/CTR/CPC); "cost per opening" metric; 3 budget tiers; explicit "apply/hire not projected — depends on ATS/LP." Shows real plans exceed the $20k wedge and use >2 channels. |
| 6 | **Family First Nurseries** ("Sample Media Plan Deck Output") | EB Minimal deck ("joveo \| yoke", 9 slides) | The **Minimal 9-slide blueprint** we implemented. CPA-driven (£23–32 CPA, 280–393 apps), **Bronze/Silver/Gold tiers by channel-count + geo coverage**, Mojo Apply ATS. Also exposed real generation **bugs** (a "CTR%" card showing clicks; leftover `{{pillar_3_kpi_5}}`) → motivated the hard-validation layer. |

### 2.2 The operational / build sheets (the layers *behind* the deck)

| # | Document | What it taught us |
|---|---|---|
| 7 | **AMS for NatWest — LinkedIn Plan** | A **pipeline / talent-community** model: budget → CPC benchmark → est. clicks, sliced by **location × talent-pipeline × flight length (weeks)**; talent-pool sign-ups as the conversion. First sighting of **structured UTMs** (`utm_medium/source/creative_format/campaign/content_theme/bid`). |
| 8 | **Brandsafway — Media Plan Strategy** | A **6-month, ~$384k, 6-channel** plan (Meta/LinkedIn/Google/Display/TikTok/Reddit) with a **market-by-market budget split** and a **creative-themes/messaging matrix**. Shows large multi-channel, multi-market planning. |
| 9 | **Joveo × Yoke — RPO Interim Proposal Tracker** | The **operational tracker** (many tabs): every plan decomposes into **campaign line-items** — channel, audience, budget, go-live/end dates, PO number, landing page, UTM, assets, "booking form signed", "good to go live", "added to UA dashboard", and separate **Joveo/Yoke status** columns. This is the bridge from *plan* → *build* → *launch*. |
| 10 | **NWG Apprenticeship Week Schedule** | A **flighting/gantt calendar**: per channel/audience/budget with creative-delivery deadline + live/end dates across a week grid. |
| 11 | **NWG H1 Schedule** | Same flighting pattern at scale (job ID, channel, audience, budget, creative deadline, dates), many lines. |
| 12 | **Uber NAMER Sales — Targeting Strategy** | The **targeting + keyword build-sheet**: req IDs → campaign **clusters** (A/B/C by seniority); per-channel **audience targeting** (LinkedIn job-title/skills/seniority/industry; Meta interest layers + **Special Ad Category** constraints; Google custom-intent + in-market audiences); **keyword clusters** by match type (phrase/exact/broad) + **negative keywords** with reasons; priority tags. |

### 2.3 What the references collectively established (the "spine")

1. **Two archetypes** (job-ad/CPA vs branding/reach), often **blended** in one plan.
2. **A shared data model** under every plan: client+brand, jobs→role groups, geo (+exclusions), budget+duration/flighting, channel mix with %-allocation, objective/funnel stage, per-channel benchmarks, projections (ranges), KPI/measurement framework, next-steps/dependencies.
3. **Three artifact layers** — a *client deck* (sell it) → a *build-sheet* (targeting/keywords/UTMs to set it up) → an *operational tracker* (line-items, dates, POs, go-live).
4. **Tiering patterns** — 3 tiers by budget (Good/Better/Best), by CPA assumption, or by channel-count + geo coverage; plus **scenarios** (all-roles vs priority-roles).
5. **Channels beyond Google+Meta** in practice (LinkedIn, TikTok, Reddit, Snapchat, Spotify, YouTube, programmatic, OOH) — so the engine treats channels as **config**, with Google+Meta as the common default for the small-spend wedge.
6. **Quality is a real problem** — visible copy-paste/consistency bugs → a strict validation + QA layer is a core feature, not an afterthought.

---

## 3. Domain model & core concepts

- **Archetypes.** *Job-Ad / Performance* (CPA-driven; `hires × apply-to-hire ratio × target CPA → budget`; projects applies). *Employer-Branding / Reach* (budget → channel allocation → clicks/impressions; deliberately does **not** project applies). Branding has four objectives: **traffic-to-destination, awareness/reach, lead-capture (talent community), retargeting**.
- **Jobs → groups.** Individual JDs are clustered into role categories / campaigns (the "each JD is an ad" reality, made practical).
- **Tiering.** Always three tiers; the **recommended tier is logic-driven** (nearest the target budget; median fallback) — fixing the "Tier 3 always recommended" tic.
- **Steering (the key differentiator).** Benchmarks are a *starting point*. On top: a **margin lever** (global default + per-channel override — dial down to undercut a competitor's CPA by giving up Joveo margin); **per-channel boundary conditions** (the AM sets an anchor like target CPA or clicks, plus a tolerance ±10/20%, and the engine produces numbers within that band, reconciling dependent metrics so each row stays self-consistent); and **per-KPI overrides** (any number is editable; the AM owns explicit overrides).
- **Validation philosophy (two tiers).** *Hard* rules **block** (allocations sum to 100, channel budgets sum to tier total, no inverted ranges, no leftover `{{placeholders}}`). *Soft* rules **warn but never block** (CPC/CTR realism, "Google Search CPC should exceed Meta CPC", min spend per channel) — because going off-benchmark to win a deal is intentional.
- **Brand modes.** **Joveo** / **co-branded** (Joveo + client) / **white-label** (no Joveo marks anywhere, including PPTX metadata — regression-tested). Client logo + colors supported.
- **Optional modules (toggled per plan, AM-reviewed, rendered into the deck).** *Targeting* + *Keywords* are generated deterministically from the brief and are AM-editable. *Insights* (market landscape, active-vs-passive, competitive) are **researched + cited + AM-approved** — never fabricated in code; uncited insights raise a soft warning.
- **Ranges, not point estimates.** Projections render as low–high to manage accountability.

---

## 4. What's been built (4 phases — all shipped & tested)

(Architecture detail in `docs/HANDOFF.md`; plans in `docs/superpowers/plans/`.)

1. **Engine** (`social-media-media-planner/lib/`) — pure JS: benchmarks + projection + job-ad CPA math + steering + tier recommendation + hard/soft validation.
2. **Renderer & skill shell** (`social-media-media-planner/render/`, `SKILL.md`) — `generate()` → validation gate → 9-slide branded PPTX; brand modes; dynamic slide count.
3. **Optional modules** (`render/modules/`) — targeting, keywords, insights, rendered as extra slides.
4. **Web app** (`web/`, Next.js on Vercel) — monorepo `@smmp/engine` package + `generateBuffer` (serverless); structured form → live preview + deck download; team Basic-Auth; **deployed**.

Tests: **82 engine + 3 web, all green.** Built test-first (TDD), reviewed at each step.

---

## 5. The plan object (the data contract)

Everything flows through one plan object consumed by `projectPlan` / `generate` / `generateBuffer`:

```js
{
  industry,            // 'general_recruitment' | 'healthcare' | 'software_tech' | 'logistics' | 'retail_hospitality'
  geo,                 // 'us' | 'uk' | 'eu_west' | 'australia' | 'canada' | 'india'  (cost multiplier)
  marginMultiplier,    // global margin lever (default 1.0)
  targetBudget,        // drives tier recommendation
  client: { name, primaryColor?, accentColor?, logoPath? },
  brandMode,           // 'joveo' | 'cobranded' | 'whitelabel'
  archetype,           // 'branding' | 'jobad'
  objectiveLabel, geoLabel, dateStr,
  roleGroups: [{ name, subtitle }],
  locations:  [{ name, detail }],
  tiers: [{ name, budget, allocations: { <channel>: <pct> },
            boundaries?: { <channel>: { metric, anchor, tolerancePct } },
            overrides?:  { <channel>: { <field>: value } } }],
  modules?:  { targeting: bool, keywords: bool },
  targeting?, keywords?,                 // supplied objects (or auto-built when toggled)
  insights?: { marketLandscape?, activePassive?, competitive? }   // each with sources[]
}
```

The `getBenchmark(channel, industry, geo, metric)` function in `lib/benchmarks.js` is the **single seam** through which all rates flow — designed to be swapped for live data (see §6).

---

## 6. Vision: using Joveo's internal database to power media plans

This is the strategic next leap. Today benchmarks are a **curated static table**; the architecture was deliberately built so Joveo's own performance data can replace and extend it without a rewrite. Three escalating levels:

### Level A — Data-backed benchmarks (the seam is ready)
Replace the static table behind `getBenchmark(channel, industry, geo, metric)` with **live Joveo performance data** — real CPC / CPM / CTR / CPA / CPL by **industry × geo × channel**, refreshed from Joveo's warehouse/BigQuery (or Joveo's UA/dashboard data). Benefits: numbers stop drifting, become defensible ("based on Joveo's actual delivery"), and auto-update. No engine change — only the `getBenchmark` body. The **margin lever** still sits on top, so internal actuals stay hidden and client-facing rates remain steerable.

### Level B — Data-driven recommendations (beyond rates)
Use Joveo's historical campaign outcomes to make the planner *recommend*, not just *compute*:
- **Channel mix** that actually worked for similar **role × industry × geo × budget** cohorts (instead of fixed presets).
- **Realistic CPA and apply-to-hire ratios** per role/market (calibrates the job-ad archetype from real funnels rather than AM guesses).
- **Range calibration** — set the low/high bands from *observed variance* in comparable Joveo campaigns, not fixed ±multipliers.
- **Feasibility & pacing** — flag budgets too thin for a market, suggest flight length, detect **seasonality** and **competition** from delivery trends.
- **Audience & keyword suggestions** seeded by what performed in Joveo campaigns (feeds the Targeting/Keyword modules, which are already modular generators).

### Level C — Data-sourced market & competitive insights
The Insights module currently relies on web research + AM approval. Joveo's marketplace data can supply much of it directly and more credibly: **talent-pool size, time-to-fill, active-vs-passive split, competing-postings volume**, and even named-competitor activity — sourced from Joveo's own supply/demand data, with citations to internal datasets. This turns the "thin placeholder" insight slides into a genuine differentiator.

**Why the architecture is ready for this:** the engine is pure and seam-based (`getBenchmark`); benchmarks, targeting, keywords, and insights are each isolated, swappable modules; the plan object already carries everything; and the web app/serverless path can call a data service. The likely build: a small **data-access layer** (queries Joveo's warehouse) behind the existing seams, plus a recommendation service the form/skill can call to pre-fill channel mix, CPA, ratios, and insights — all still AM-reviewable and steerable.

**Data/infra prerequisites to flag:** access to Joveo's performance warehouse (BigQuery or equivalent), a query/caching layer (the Runtime Cache or a small DB), and a mapping from the planner's industry/geo/channel taxonomy to Joveo's internal schema.

---

## 7. Roadmap / next steps (prioritized)

1. **AI brief → autofill** (recommended next): paste a freeform brief/JD → an LLM (via Vercel AI Gateway) fills the form → AM reviews → generate. Restores the "paste a brief, get a deck" magic; highest UX impact; self-contained.
2. **Full steering UI** in the web form: per-tier channel-mix editing, per-channel boundary conditions, per-KPI overrides (the engine already supports all of it).
3. **Level A — data-backed benchmarks** via the `getBenchmark` seam (start of the Joveo-DB vision).
4. **Levels B/C — data-driven recommendations + data-sourced insights** (the strategic differentiator).
5. **Saved plans + history** (needs a DB) — revisit/duplicate/share.
6. **Build-sheet / UTM export + operational tracker** (the downstream ops layers seen in references #7, #9–#12).
7. **Polish** — Intermediate (14) / Maximalist (21) deck depths (only Minimal/9 is built), `middleware.ts → proxy.ts` (Next 16), Vercel SSO, accessibility.

**How to continue (the workflow that built this):** brainstorm/scope → write a spec in `docs/superpowers/specs/` → write a TDD plan in `docs/superpowers/plans/` → build task-by-task (tests first, frequent commits) on a `feature/*` branch → review → merge to `release` → deploy. If the Superpowers skills are available, use *brainstorming → writing-plans → subagent-driven-development → finishing-a-development-branch*.

---

## 8. Key decisions & rationale (don't re-litigate)

- **Skill first, product second** — ship the domain logic as a skill, then wrap it in a web app reusing the same engine (which is exactly what happened — no rewrite).
- **Engine is pure & I/O-free** — enables reuse across skill, CLI, serverless, and tests.
- **Steering is first-class** — the competitive reality (matching competitor CPAs by flexing margin) is a core requirement, not a nice-to-have.
- **Static benchmarks now, data-backed later** — ship immediately, upgrade via the seam; the whole Joveo-DB vision hangs off this.
- **White-label is a hard guarantee** — leak-tested including PPTX metadata.
- **Insights are never fabricated in code** — researched + cited + AM-approved (and, in future, sourced from Joveo data).
- **Validation is two-tier** — hard blocks bugs; soft warns but lets AMs go off-benchmark on purpose.

---

## 9. Pointers

- **Repo:** https://github.com/ADAhzam/socialMedia_mediaplanner (branches `main` / `release` in sync).
- **Onboarding/integrity-check:** `docs/START_HERE.md`
- **Build/run/deploy detail:** `docs/HANDOFF.md`
- **Product spec (PRD):** `docs/superpowers/specs/2026-06-02-social-media-media-planner-design.md`
- **Implementation plans:** `docs/superpowers/plans/` (engine-core, renderer, modules, web)
- **Skill entry:** `social-media-media-planner/SKILL.md` · **Engine API:** `require('@smmp/engine')` · **Web entry:** `web/app/page.tsx` + `web/app/api/*`
- **Reference materials (the 12 examples):** not in the repo — catalogued in §2 above. If you re-upload them to a new chat, §2 tells the assistant what each one is.
