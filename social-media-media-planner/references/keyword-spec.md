# Keyword Strategy — Module Reference

This document describes the Keyword Strategy module: the cluster types produced by
`buildKeywords(plan)` in `render/modules/keywords.js`, the standard negative-keyword list
with rationale, and guidance on brand and competitor-conquest terms.

---

## How keywords are produced

When `plan.modules.keywords = true` and `plan.keywords` is absent, `generate()` calls
`buildKeywords(plan)` automatically. The function is deterministic and pure — it reads:

- `plan.client.name` — used for Brand cluster terms
- `plan.geoLabel` — appended to Function + Location terms
- `plan.roleGroups` — one set of three clusters is produced per role

The returned object is placed on `plan.keywords`. On the next `generate()` call, the
supplied `plan.keywords` is used as-is (the generator is skipped). The AM edits the draft
and the edits persist through final render.

---

## Cluster types

Three clusters are generated per role group. The slide table shows up to 8 clusters
(i.e. the first ~2–3 roles' full sets); the AM should review and trim or prioritise before
final render.

### 1. Function + Location (match type: Phrase)

These terms pair the role title with the target geography. Phrase match ensures the
keywords fire when the role and location appear together in a search, catching natural
variants like "registered nurse jobs in Manchester" while avoiding off-topic queries.

Example terms for role "Registered Nurse", location "Manchester":
```
"registered nurse jobs manchester"
"registered nurse jobs"
"registered nurse vacancies manchester"
```

The generator produces three variants per role: `<role> jobs <geo>`, `<role> jobs` (no
geo, for searchers who don't include a city), and `<role> vacancies <geo>`.

### 2. Brand (match type: Exact)

Brand cluster terms capture candidates who search specifically for the employer. Exact
match limits spend to high-intent queries where the brand name appears precisely.

Example terms for client "Acme Care", role "Registered Nurse":
```
[acme care registered nurse jobs]
[acme care careers]
```

The generator lowercases both the client name and the role title. The AM should add
branded variants with common misspellings or abbreviations if the brand has them.

### 3. Exploratory (match type: Broad)

Exploratory terms use Broad match to capture wider intent signals — candidates who are
open to job opportunities but may not be searching for a specific role title or location.
These terms support awareness-phase reach on Google Search.

Example terms for role "Registered Nurse":
```
registered nurse jobs hiring
registered nurse career opportunities
```

The AM typically reviews Exploratory clusters carefully: Broad match can attract
irrelevant traffic. Adding a robust set of negative keywords (see below) is the primary
control.

---

## Standard negative keywords

The following negatives are included in every keyword plan by default. They prevent
budget waste from candidates seeking employment types the campaign is not targeting.

| Negative keyword | Reason |
|---|---|
| `internship` | Intern roles — wrong seniority |
| `summer internship` | Seasonal intern — wrong audience |
| `part time` | Part-time seekers — roles are full-time |
| `volunteer` | Volunteer intent — not hiring |
| `freelance` | Freelance/contract — roles are permanent |
| `work from home` | Remote-only seekers — roles are on-site/hybrid |

The AM should extend this list based on the specific role and client context. Common
additions:

- `agency` / `staffing agency` — if the client does not use agency supply
- `self employed` — if the role is PAYE-only
- `apprenticeship` / `trainee` — if the campaign targets qualified candidates
- `salary` / `pay` — informational queries rather than job-seeking intent
- Competitor brand names — if the client does not want their budget spent on competitor
  searches (note: differs from competitor conquest — see below)

---

## Brand and competitor-conquest guidance

### Protecting the brand

The Brand cluster (Exact match) anchors spend on searches where the candidate already
knows the employer. Ensure the client's full brand name and its most common abbreviated
form are both included as separate Exact match terms. If the brand has a well-known
product or service name that candidates search, add that as a separate Brand cluster term.

### Competitor conquest

Competitor-conquest terms are Phrase match keywords using a competitor's brand name
paired with a role title or "jobs" signal. Example: `"bupa nurse jobs"`.

Conquest is appropriate when:
- The client explicitly authorises bidding on named competitors.
- The competitor is actively hiring for the same role (verified via the Competitive
  Insights module or the AM's knowledge).
- The client's offer is competitive (salary, benefits, culture) — conquest with a weaker
  offer wastes budget.

Competitor names on `plan.competitors` appear in the Google targeting spec's
`competitorConquest` field as a note (e.g. "Bid on competitor brand terms: Bupa,
HC-One"). The AM converts that note into actual keyword clusters by adding entries like:

```json
{
  "role": "Registered Nurse",
  "type": "Brand",
  "matchType": "Phrase",
  "terms": ["bupa nurse jobs", "hc-one nursing jobs"]
}
```

Conquest terms should be added to the `plan.keywords.clusters` array directly during the
AM review step, before final `generate()`.

---

## Keyword slide rendering

The renderer (`keywordSlide` in `render/render.js`) shows up to 8 clusters in a table
with four columns: Role, Type, Match, and Example terms (up to 3 terms per cell,
joined with ` · `). The negative list appears as an italic footer line below the table,
showing term names joined with ` · `.

If there are more than 8 clusters (e.g. 4+ roles × 3 cluster types = 12+), only the
first 8 are shown on the slide. The AM should prioritise clusters before final render
if the full set exceeds 8.
