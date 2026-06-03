# Audience Targeting — Module Reference

This document describes the Audience Targeting module: the fields produced by
`buildTargeting(plan)` in `render/modules/targeting.js`, the Special-Ad-Category
constraints that govern Meta campaigns, and what Account Managers typically edit
before approving the final targeting spec.

---

## How targeting is produced

When `plan.modules.targeting = true` and `plan.targeting` is absent, `generate()` calls
`buildTargeting(plan)` automatically. The function is deterministic and pure: the same
plan inputs always produce the same output. It reads:

- `plan.roleGroups` — role names become Meta interest-function keywords
- `plan.industry` — mapped to a fixed interest list (see Industry interests below)
- `plan.geoLabel` — used for both the Meta location display and the Google geo field
- `plan.geoExclusions` — string array of locations to negative-match on Google
- `plan.competitors` — string array of competitor employer names

The returned object is placed on `plan.targeting`. On the next `generate()` call, the
supplied `plan.targeting` is used as-is (the generator is skipped). This means the AM
can edit the object and those edits persist through final render.

---

## Meta panel

The Meta panel appears on the left half of the Audience Targeting Strategy slide. All
fields are read directly by `targetingSlide()` in `render/render.js`.

| Field | Type | Description |
|---|---|---|
| `meta.location` | string | Display geography (`plan.geoLabel`). Shown as the first bullet on the slide. |
| `meta.specialAdCategory` | boolean | Always `true`. Indicates this is a Recruitment campaign on Meta. |
| `meta.locked` | string | The age/gender lock string. Default: `"Age 18+, all genders (Special Ad Category: Recruitment)"`. AM cannot change the lock — it is mandated by Meta for Recruitment ad categories. |
| `meta.interestFunction` | string[] | Role-title interest keywords. One entry per role group name. The AM may add or remove entries if certain titles are too broad or too narrow. |
| `meta.interestIndustry` | string[] | Industry-level interests drawn from the built-in map (see below). |
| `meta.careerIntent` | string[] | Fixed career-intent interests: `["Job hunting", "Career development", "Employment"]`. These are locked by the generator but the AM may add niche intent signals if relevant. |
| `meta.retargeting` | string[] | Retargeting audience descriptions. Default: careers-page visitors (30/60/90-day windows), video viewers (25%+ completion), lookalike of hired pool. The AM edits the window lengths or removes tiers they cannot implement yet. |
| `meta.note` | string | Shown in italic on the slide below the Meta bullets. Explains the Special Ad Category constraint — that detailed-targeting exclusions are disabled and creative must do the self-selection work. |

### Industry interest map

The generator maps `plan.industry` to a fixed array of Meta interest names:

| `plan.industry` value | `interestIndustry` |
|---|---|
| `general_recruitment` | Employment, Recruitment |
| `healthcare` | Healthcare, Nursing, Healthcare careers |
| `software_tech` | Software, Technology, Information technology |
| `logistics` | Logistics, Supply chain, Transportation |
| `retail_hospitality` | Retail, Hospitality, Customer service |

If the plan's industry is not in the map, `interestIndustry` will be an empty array. The
AM should supply values manually in that case.

---

## Special Ad Category — what it means for Meta targeting

Meta's Special Ad Categories (Housing, Credit, Employment, Social Issues) restrict
certain targeting options to prevent discriminatory ad delivery. For Recruitment campaigns:

- Age targeting is locked to 18+ (no upper age cap, no age exclusions).
- Gender targeting is locked to "All genders" (no gender exclusions).
- Detailed-targeting exclusions (e.g. excluding people interested in competitor brands)
  are disabled.
- Geographic exclusions are restricted — very small radius exclusions may not be
  honoured. Use negative geo at the Google layer instead.

Because detailed-targeting exclusions are unavailable, audience breadth is the correct
strategy on Meta: keep interest layers broad and rely on role-specific creative (visuals,
copy, job title mentions) to self-select the right candidates.

---

## Google panel

The Google panel appears on the right half of the Audience Targeting Strategy slide.

| Field | Type | Description |
|---|---|---|
| `google.inMarketAudiences` | string[] | Google in-market audience names. Default: `["Jobs – <industry label>", "Employment Services"]`. The AM may add additional in-market segments if the role spans multiple verticals. |
| `google.customIntentUrls` | string[] | Job-board URLs used to build a custom-intent audience. Default: `["indeed.com", "linkedin.com/jobs", "glassdoor.com"]`. The AM may add or remove URLs based on which boards candidates in this sector use. |
| `google.geo` | string | Display geography (`plan.geoLabel`). Informational — geo targeting is configured in Google Ads directly. |
| `google.negativeGeo` | string[] | Locations to exclude. Populated from `plan.geoExclusions`. Empty if no exclusions were specified. |
| `google.competitorConquest` | string | Conquest note shown on the slide. If `plan.competitors` has entries, the string is `"Bid on competitor brand terms: Bupa, HC-One"`. If no competitors were supplied, the string is `"No competitors provided"`. The AM typically edits this to confirm which competitor terms are appropriate to bid on. |

---

## What the AM typically edits

After reviewing the auto-generated draft, Account Managers most commonly:

1. **Expand or trim `interestFunction`** — remove role titles that are too generic
   (e.g. "Manager" alone) or add alternate job titles not in the role-group list.
2. **Add `interestIndustry` values** — for industries not in the built-in map, or to
   layer in a second vertical (e.g. a healthcare client also hiring in social care).
3. **Adjust retargeting windows** — change 30/60/90-day windows to match the pixel
   history available for the client's careers page.
4. **Confirm `negativeGeo`** — add excluded postcodes, boroughs, or counties that the
   job is not commutable from.
5. **Edit `competitorConquest`** — confirm which competitor names to bid on (some
   clients have agreements not to bid on specific brand terms), and add emerging
   competitors not in the original brief.
6. **Add or remove custom-intent URLs** — swap in sector-specific job boards (e.g.
   `nursingjobs.co.uk`, `caterer.com`) relevant to the role and location.

The AM must not change `specialAdCategory`, `locked`, or `careerIntent` without
consulting Joveo's compliance guidelines — these fields reflect platform policy.
