# Social Media Media Planner — Product Requirements Document

**Status:** Draft for review
**Date:** 2026-06-02
**Author:** Adnan Ahzam (adnan@joveo.com)
**Phase framing:** This PRD describes the product vision. **v1 ships as a Claude skill** (a self-contained successor to `eb-media-plan`). The product (web app) is a later phase that reuses the same plan model + projection engine.

---

## 1. Overview

### Problem
Joveo AMs hand-build media-plan decks for small-spend clients (under $20k/month) across Google, Meta, and other social channels. Today the work is manual and inconsistent:

- Numbers vary deck-to-deck; benchmarks are US-centric and drift over time.
- Copy-paste bugs reach clients — unfilled `{{placeholders}}`, a "CTR" stat card showing a click count, overlapping/overflowing text, `##########` overflow, and "Tier 3 always recommended."
- There is no clean way to **steer** numbers for competitive deals (e.g. undercut a competitor's CPA by giving up margin).
- Market/competitive insight slides are *defined* but require the AM to hand-source all data; they are usually skipped.
- Branding is inconsistent and there is no white-label path for clients who forward reports to their own end clients.

The existing `eb-media-plan` skill proves the brief → deck pattern but bakes in a fixed 2× margin, models only branding (not job-ad CPA math), sources no insights, and gives the AM no steering controls.

### What we're building (v1)
A Claude **skill** that turns a freeform brief into a polished, **client-ready media-plan report** for the under-$20k segment. It is powered by:

- **Two budget engines** — Job-Ad / Performance (CPA-driven) and Employer-Branding / Reach.
- A **steerable projection layer** — margin lever + per-channel boundary conditions + per-KPI overrides.
- **Optional, reviewable modules** rendered into the report — Audience Targeting, Keyword Plan, and Market/Competitive Insights.
- **One brand-mode-aware template** — Joveo-branded, co-branded, or fully white-label, with client logo + colors.

It is built so the same plan model + projection engine later power the web product without a rewrite.

### Goals (v1)
- One brief → one accurate, on-brand, **bug-free** report, fast.
- Correctly model both archetypes and all four branding objectives.
- Let the AM **steer every commercially relevant number**, within guardrails.
- Optionally enrich the report with reviewed targeting, keywords, and web-researched insights.
- Eliminate recurring consistency bugs via a hard-validation layer and a visual QA pass.
- Support client branding and full white-label.

### Non-goals (v1)
- No operational tracker, UTM generation, or live ad-platform integration (later phases).
- No live Joveo performance-data integration (static benchmark table; seam specified).
- No client self-serve; internal AM/Sales only.
- Not a web app yet (skill first; product is the vision).
- No salary-benchmarking insight module (deferred; the other insight modules ship).

---

## 2. Users & primary journey

**Primary user:** Joveo internal AM / Sales. Domain expertise assumed; values speed and credibility. Internal margins and raw benchmarks are never exposed to the client.

**Primary journey:**
1. AM provides a brief (any format — PDF, pasted text, JD list, email).
2. Skill extracts what it can, tags each field's confidence, applies smart defaults.
3. Skill asks plan depth, then one consolidated gap-fill.
4. AM optionally enables modules (targeting / keywords / insights) and sets steering controls (margin, per-channel boundaries, KPI overrides).
5. Skill drafts projections (and any enabled modules); AM **reviews and edits** in a loop.
6. Skill runs hard validation + surfaces soft warnings, then renders the branded report.
7. AM delivers to client (Joveo-branded, co-branded, or white-label).

---

## 3. Scope (v1)

### In
- Client spend band **under $20k/month** (the target segment).
- **All channels** the real decks use: Google (Search, PMax, Demand Gen, Display, YouTube), Meta (Feed Image/Video, Reels, Carousel, Retargeting), LinkedIn, TikTok, Reddit, Snapchat, Spotify (audio), programmatic display (Taboola/StackAdapt), OOH. Google + Meta are the most common default; channel set is configuration, not hardcode.
- **Job-Ad / Performance** archetype (jobs grouped into role-category/campaign clusters; CPA-driven).
- **Employer-Branding / Reach** archetype with all four objectives: traffic-to-destination, awareness/reach, lead-capture (talent community), retargeting layer.
- Blended/hybrid plans (both archetypes in one report).
- 3-tier options with **logic-driven** recommendation.
- Steerable engine: global + per-channel margin, per-channel boundary conditions (anchor ± AM-chosen tolerance), per-KPI overrides.
- Optional modules (toggle per plan, all reviewed before render): **Targeting**, **Keywords**, **Insights** (market landscape, active-vs-passive, competitive landscape).
- Branding: client logo input, client colors/fonts, and three brand modes (Joveo / co-branded / white-label).

### Out (later phases)
- Operational tracker; UTM generation; ad-platform setup/upload.
- Live Joveo data; client self-serve; web product.
- Salary-benchmarking insight module.

---

## 4. Plan model (shared data)

A single canonical plan object drives every render. Key entities:

- **Client & brand:** name; logo (upload/path); primary + accent colors; optional fonts; **brand mode** (joveo | co-branded | white-label).
- **Roles → groups:** individual jobs/JDs clustered into role categories or campaigns (the "each JD is an ad" reality in practice). Per group: titles, seniority, key qualifications.
- **Geo:** locations, radius/metro, negative-geo exclusions.
- **Budget & timing:** monthly budget (under-$20k band), total, duration, optional flighting.
- **Channels:** selected set; per-channel %-allocation; per-channel benchmark snapshot.
- **Archetype & objective:** job-ad | branding; objective + funnel stage.
- **Steering settings:** margin (global default + per-channel overrides); per-channel boundary conditions (anchor metric + value + tolerance); per-KPI overrides.
- **Tiering:** three tiers; recommended tier (logic-derived).
- **Optional modules:** targeting spec, keyword plan, insight set — each with draft + AM-edited final state.
- **Provenance:** per field, confidence tag (high/medium/low) and source (brief | default | AM | web-research with citation).

---

## 5. Plan archetypes & objectives

### Job-Ad / Performance
- **Goal:** applications / hires.
- **Math (backward):** hires × apply-to-hire ratio = apps target; apps × target CPA = budget. Forward fallback (budget → CPC → clicks) when applies aren't projectable.
- **Grouping:** jobs → role-category/campaign clusters.
- **Channel lean:** Google Search/PMax + Meta; extensible.
- **Projects:** clicks always; applies when defensible (with ATS/LP caveats).

### Employer-Branding / Reach — four objectives
| Objective | Funnel shape | Channel lean | Primary metric |
|---|---|---|---|
| Traffic to destination | Single-stage → careersite/website/LP | Search + social | Clicks / CPC |
| Awareness / reach | Top-of-funnel | Video/Reels/audio/OOH | Impressions, reach / CPM |
| Lead capture (talent community) | Awareness → lead form | Meta/native lead forms | Leads / CPL (+ qualifying-question spec) |
| Retargeting layer | Add-on pillar | Meta/Google remarketing | Clicks, conversions |

Plans may **blend** archetypes/objectives. The projection engine selects the right metric per channel rather than forcing clicks everywhere.

---

## 6. Projection engine & steering

The engine is **steerable**, not a one-way calculator. Pipeline:

1. **Benchmark = starting point** (from the static table; see §7).
2. **Margin lever** — adjustable margin applied to internal/true numbers to produce client-facing numbers. **Global default + per-channel override.** Dial up to fatten projections; dial down to undercut a competitor's CPA by giving up Joveo margin. (Generalizes today's hardcoded 2×.)
3. **Per-channel boundary conditions** — AM sets an **anchor** (target CPA, target clicks, or fixed budget) and a **tolerance band** they choose (±10%, ±20%, …). The engine produces numbers within that band of the anchor for that channel — generating *around* the commercial target, not purely off benchmark.
4. **Per-KPI overrides** — any KPI is editable during plan creation: budget (total + per-channel %), CPC, CPM, CTR, CPA, apply-to-hire ratio, projected clicks/impressions/applies/leads, duration, and range-width (±%).
5. **Validation — two tiers:**
   - **Hard (block):** arithmetic & consistency — channel %s sum to 100% (±0.5%), ranges not inverted, channel budgets sum to tier total, no leftover `{{placeholders}}`, no field-type mismatches (e.g. a CTR card must hold a CTR).
   - **Soft (warn, allow override):** realism — CPC/CTR sanity, "Google Search CPC > Meta CPC", min spend per channel. Because the whole point is sometimes going off-benchmark to win commercially, these warn but never block.

Projections are presented as **ranges** (low–high), not single points, to manage accountability.

---

## 7. Benchmarks

- **v1: curated static table** — channel × industry × geo → CPC / CPM / CTR / CPA / CPL, plus geo multipliers. Must cover *all* in-scope channels (not just Google/Meta), since channels project on different metrics.
- **Margin is a lever, not baked in** — the table stores reference rates; margin is applied at projection time (§6).
- **Data-backed seam (specified, later phase):** a single interface (`getBenchmark(channel, industry, geo, metric)`) so the static table can be swapped for live Joveo performance data (UA dashboard / warehouse) without touching the engine.

---

## 8. Optional modules (drafted → AM-reviewed → rendered into report)

All three are **off by default**, toggled per plan. Common pattern: skill **drafts** → AM **previews and edits** → finalized version **renders into the client report**. No separate build-sheet artifact.

### 8.1 Audience Targeting
Per-channel structured audience spec:
- **Meta:** location/radius; **Special Ad Category (Recruitment) auto-applied** (age 18+/all-gender locked, detailed-targeting/exclusions disabled) with the "keep broad, let creative self-select" note; interest layers (function → industry → career-intent, AND/OR); retargeting/custom audiences (page visitors 30/60/90d, video viewers 25%+, lookalikes); audience-size estimate.
- **LinkedIn:** location; job titles; skills; seniority; job function; industry; company targeting (competitors) + followers; member groups; audience size.
- **Google:** custom-intent (keyword-based) + in-market audiences + custom-intent URLs (competitor job boards); geo + radius + negative-geo exclusions.
- **TikTok / Reddit / Snapchat / Spotify:** interest/community/subreddit targeting, geo, age.

*Inputs:* auto-derived (related titles, skills, interests, Special-Ad-Category detection, in-market mapping) + AM-provided (competitors, languages, breadth preference, exclusions, brand terms).

### 8.2 Keyword Plan (Google Search/PMax/Demand Gen)
- **Keyword clusters** by role/campaign × intent type: Function+Location (phrase), Brand Intent (exact), Exploratory (broad) — each with match type, language, applies-to, priority.
- **Negative-keyword list** with reasons (e.g. exclude `uber driver`, `internship`, `part time`, wrong-geo, wrong-function, `remote only`) and applicable channel.

### 8.3 Market & Competitive Insights
Sourced via **web research + AM review** (always AM-confirmed before client). Each insight carries **citations + a confidence tag**; insights are "soft" data.
- **Market landscape:** talent-pool size, active-seeker count, supply-demand ratio, time-to-fill for role/geo.
- **Active vs passive split:** estimated % actively job-seeking vs passively employed — drives the channel/funnel narrative.
- **Competitive landscape:** named competitors for the talent, their hiring activity / live postings, positioning guidance.

*(Salary benchmarking deferred to a later phase.)*

**Improvement over current skill:** today these slides are *defined* but require manual AM data, so they're skipped or left as placeholders. v1 auto-drafts them from live research with sources, then the AM verifies.

---

## 9. Report output

### Template & branding
- **One brand-mode-aware canonical template.** A global **brand mode** switch:
  - **Joveo-branded** — Joveo/Yoke marks present.
  - **Co-branded** — Joveo + client lockup.
  - **White-label** — *all* Joveo marks removed (wordmark, "Prepared by Joveo," footer); client-only, for forwarding to end clients.
- **Client branding:** prominent client logo (cover + footer), client primary/accent colors, optional fonts. The brand mode controls every Joveo mark globally so nothing leaks in white-label.

### Slide blueprints (per archetype, depth-scaled)
Cover · Opportunity (geo + role groups) · Strategy/Structure (funnel/pillars) · Budget options (3 tiers) · Budget allocation · Projected performance · Measurement framework · Next steps · Close. Optional **Audience Targeting**, **Keyword Strategy**, and **Insight** sections appear only when their modules are enabled. Tiering shows three options with a **logic-driven** recommendation (no more "Tier 3 always").

### Design principles (requirement, not aspiration)
- **No overloaded pages** — content budget per slide; split rather than cram.
- **Visually attractive** — strong hierarchy, generous whitespace, consistent type scale.
- **Workflows/diagrams** — funnel, multi-stage, and process visuals, not just text.
- **Good-looking tables** — styled, alternating-row, aligned, never clipped.

### QA pass (before delivery)
Render → convert to images → check title/projection/table/diagram/last slides → fix any overflow, overlap, inverted range, or leftover placeholder → finalize. Hard-validation rules from §6 are enforced here.

---

## 10. Generation flow

1. **Intake** — accept any brief format.
2. **Extract** — pull all fields; confidence-tag (high/medium/low); apply smart defaults.
3. **Plan depth** — ask the depth level.
4. **Gap-fill** — one consolidated message for missing required fields.
5. **Configure** — module toggles (targeting/keywords/insights) + steering controls (margin, boundaries, overrides).
6. **Draft** — projections, plus any enabled modules (insights via web research).
7. **Review loop(s)** — AM previews and edits projections and each enabled module.
8. **Validate** — hard rules block; soft rules warn.
9. **Render** — branded report in the selected brand mode; run visual QA.

---

## 11. Success metrics

- **Time to first deck** (brief → delivered report) materially lower than manual.
- **Zero hard-validation defects** shipped (placeholders, inverted ranges, mismatched cards, sum errors).
- **Steering usage** — % of plans using margin lever / boundary conditions (proves the differentiator).
- **Module attach rate** — % of plans enabling targeting/keywords/insights.
- **AM edit rate per plan** as a proxy for draft quality (trending down over time).
- **White-label usage** — confirms the branding requirement was real.

---

## 12. Phased roadmap

1. **v1 (this PRD):** skill — two engines, steerable projections, optional modules (targeting/keywords/insights), brand modes, static benchmarks.
2. **Data-backed benchmarks:** swap the static table for live Joveo performance data via the §7 seam.
3. **Build-sheet + UTMs:** export the targeting/keywords as ops setup artifacts + auto-generate UTM strings.
4. **Operational tracker:** line-item management (dates, POs, go-live status, dashboard handoff).
5. **Web product:** the plan model + engine behind a UI; client self-serve as an optional surface.

---

## 13. Risks & open questions

**Risks**
- **Web-research accuracy** for insights — mitigated by citations, confidence tags, and mandatory AM review.
- **Benchmark upkeep** now spans all channels — more curation surface; mitigated by the data-backed seam.
- **Steering misuse** — AMs could publish unrealistic numbers; mitigated by soft warnings (never silent).
- **Template/visual quality in PPTX** — mitigated by the visual QA pass and strict design principles.
- **Special Ad Category correctness** (recruitment) — must auto-apply on Meta; getting this wrong is a compliance issue.

**Open questions (to resolve during planning)**
- Plan-depth levels — keep Minimal/Intermediate/Maximalist (9/14/21) or simplify?
- Exact channel coverage of the v1 static benchmark table (which channels ship with full vs partial data)?
- Output file format(s) for the report (PPTX confirmed; PDF export too?).
- Lead-capture qualifying-question library — curated defaults vs always AM-authored?
- Depth of competitive "live postings" research in v1 (named competitors only vs posting counts)?
