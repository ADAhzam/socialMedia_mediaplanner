# Slide Blueprints — Minimal 9-Slide Deck

All coordinates are in inches on a 10" × 5.625" (16:9) canvas, as used by pptxgenjs with
`pres.layout = 'LAYOUT_16x9'`. X increases left-to-right; Y increases top-to-bottom.
Colour tokens refer to the Joveo palette in `render/palette.js` (hex, no `#`).

Content must stay above **y = 5.3"** to avoid the footer band.

---

## Slide 1 — Cover (dark)

**Background:** Full-bleed NAVY rectangle (0, 0, 10 × 5.625).
**Footer:** None (dark slide).

| Element | Position (x, y, w, h) | Content / Style |
|---|---|---|
| Joveo wordmark | 0.45, 0.40, 6, 0.5 | "joveo \| yoke" (joveo mode) or "joveo" (cobranded); WHITE, 22pt bold, Calibri. Hidden in whitelabel. |
| Client logo | 7.90, 0.35, 1.65, 0.7 | Image, `contain` sizing, top-right. Rendered only when `client.logoPath` is provided. |
| Accent rule | 0.45, 1.10, 9.1, 0.02 | Thin horizontal ACCENT rectangle |
| Client name | 0.45, 1.30, 8.5, 0.9 | `dm.client`, WHITE, 42pt bold, Calibri |
| Objective label | 0.45, 2.30, 8, 0.45 | `dm.objectiveLabel`, WHITE, 16pt, Calibri |
| Objective + geo | 0.45, 2.85, 8.5, 0.35 | "`objectiveLabel` · `geoLabel`", SUBTLE, 12pt, Calibri |

---

## Slide 2 — The Opportunity (light)

**Background:** Full-bleed LGRAY rectangle.
**Header bar:** WHITE rectangle (0, 0, 10 × 0.65) with MGRAY 0.5pt border; ACCENT accent strip
(0, 0, 0.07 × 0.65) on the left edge.
**Title:** "The Opportunity", NAVY, 20pt bold, Calibri, at (0.25, 0.08, 7.5, 0.48).
**Footer:** Present — OFFWHT band at (0, 5.35, 10, 0.275) with MGRAY 0.5pt border; footer text
centred at (0.2, 5.36, 9.6, 0.25), 8pt, colour `999999`.

### Target Locations section (up to 5 location cards)

Section label at (0.45, 0.85, 9, 0.28): "TARGET LOCATIONS", NAVY, 10pt bold.

Each location card is a ROUNDED_RECTANGLE (w: 1.75, h: 0.65) starting at y: 1.15.
X positions: card[0] at x=0.45, each subsequent card at x += 1.85.

| Element | Style |
|---|---|
| Card background | First card: ACCENT fill; remaining: LGRAY fill; MGRAY 0.5pt border |
| Location name | 10pt bold; first card: WHITE; remaining: NAVY; centred |
| Location detail | 8.5pt; first card: WHITE; remaining: DGRAY; centred |

Location name text box: (x, 1.20, 1.75, 0.32). Detail text box: (x, 1.50, 1.75, 0.25).

### Role Categories section (up to 6 role cards, 2-column grid)

Section label at (0.45, 2.00, 9, 0.28): "ROLE CATEGORIES", NAVY, 10pt bold.

Cards: WHITE fill, NAVY 0.7pt border, 4.45 × 0.55 each.
Column 0: x=0.45; column 1: x=5.05. Row spacing: 0.62" starting at y=2.30.

| Element | Position (relative to card top-left) | Style |
|---|---|---|
| Role name | +0.1, +0.05, 4.2, 0.28 | 10pt bold, NAVY |
| Role subtitle | +0.1, +0.30, 4.2, 0.22 | 8.5pt, DGRAY |

---

## Slide 3 — Budget Options (dark)

**Background:** Full-bleed NAVY rectangle.
**Footer:** None (dark slide).
**Title:** "Budget Options", WHITE, 30pt bold, Calibri, at (0.45, 0.20, 8, 0.60).

Up to 3 tier cards are rendered side by side. X anchor positions: [0.30, 3.47, 6.63].

### Per-tier card

| Element | Position (x = card anchor) | Content / Style |
|---|---|---|
| Recommended badge | (x, 0.95, 2.9, 0.32) | ACCENT fill; "★ RECOMMENDED", WHITE 9pt bold, centred. Rendered only for the recommended tier. |
| Card background | (x, 1.30, 2.9, 3.60) | WHITE fill, MGRAY 0.5pt border, `makeShadow()` |
| Tier name | (x+0.15, 1.45, 2.6, 0.30) | `t.name.toUpperCase()`, NAVY, 9pt, Calibri |
| Budget label | (x+0.15, 1.70, 2.6, 0.60) | `t.budgetLabel` (e.g. "$9,000"), ACCENT, 26pt bold |
| "per month" | (x+0.15, 2.30, 2.6, 0.25) | DGRAY, 10pt |
| "CHANNELS" label | (x+0.15, 2.65, 2.6, 0.22) | NAVY, 9pt bold |
| Channel list | (x+0.15, 2.88, 2.6, 0.90) | Bullet list (% stripped from labels), DGRAY, 9pt |
| "PROJECTED" label | (x+0.15, 3.85, 2.6, 0.22) | NAVY, 9pt bold |
| Clicks range | (x+0.15, 4.07, 2.6, 0.25) | `t.totals.clicksRangeLabel + " clicks / mo"`, NAVY, 10pt bold |
| Impressions range | (x+0.15, 4.32, 2.6, 0.25) | `t.totals.impressionsRangeLabel + " impr / mo"`, DGRAY, 9pt |

---

## Slide 4 — Campaign Structure (light)

**Background:** LGRAY. Header + accent strip + footer as per slide 2.
**Title:** "Campaign Structure", NAVY, 20pt bold.
**Subtitle:** "A channel-led approach across the funnel", DGRAY, 11pt, at (0.25, 0.62, 9, 0.30).

Channels are taken from the **recommended tier**. Cards are laid out in a 3-column grid
starting at x=0.35, y=1.10, with column spacing 3.10" and row spacing 1.90".

### Per-channel card (2.95 × 1.70)

| Element | Position (relative to card x, y) | Style |
|---|---|---|
| Card background | (x, y, 2.95, 1.70) | WHITE fill, NAVY 0.7pt border, `makeShadow()` |
| Header stripe | (x, y, 2.95, 0.50) | Fill colour: NAVY (channel 0), ACCENT (channel 1), BLUE (channel 2+) |
| Channel label | (x+0.12, y+0.08, 2.70, 0.34) | 10pt bold, WHITE; includes percentage, e.g. "Meta Feed Image (50%)" |
| Budget | (x+0.12, y+0.60, 2.70, 0.40) | `c.budgetLabel + " / mo"`, ACCENT, 14pt bold |
| Clicks range | (x+0.12, y+1.05, 2.70, 0.30) | `c.clicksRangeLabel + " clicks"`, DGRAY, 9pt |

---

## Slide 5 — Budget Allocation (dark)

**Background:** Full-bleed NAVY rectangle.
**Footer:** None (dark slide). Note: a comment in `allocationSlide()` marks a potential footer
addition for design-parity review; behaviour is being confirmed in visual QA.
**Title:** "Budget Allocation", WHITE, 28pt bold, at (0.45, 0.20, 8, 0.60).
**Subtitle:** "`rec.budgetLabel` / month · `rec.name`", SUBTLE, 11pt, at (0.45, 0.78, 8, 0.30).

Channels from the recommended tier are rendered as horizontal budget bars starting at y=1.30,
with 0.62" row spacing. Bar colours cycle through: [ACCENT, BLUE, MGRAY, GREEN, SUBTLE].

### budgetBarRow layout (per channel, default rowH=0.42, barMaxW=4.6)

| Element | Position | Style |
|---|---|---|
| Channel label | (0.45, y, 3.0, 0.42) | WHITE, 10pt, `valign: middle` |
| Budget bar | (0.45+3.1, y+0.05, barW, 0.32) | Filled rectangle; `barW = max(4.6 * pct, 0.05)` — caps overflow |
| Value label | (0.45+3.1+barW+0.1, y, 1.6, 0.42) | `c.budgetLabel`, WHITE, 10pt bold |

---

## Slide 6 — Projected Performance (dark)

**Background:** Full-bleed NAVY rectangle.
**Footer:** None (dark slide).
**Title:** "Projected Performance", WHITE, 28pt bold, at (0.45, 0.15, 9, 0.55).
**Subtitle:** "What `rec.budgetLabel` / month delivers", SUBTLE, 11pt, at (0.45, 0.70, 9, 0.30).

Four stat cards are rendered in a row, each at y=1.10, w=2.15, h=1.30. X positions: 0.45, 2.77, 5.09, 7.41 (step = 2.32).

| Card | `bigText` | `labelText` | Background | Text colour |
|---|---|---|---|---|
| 0 | `rec.budgetLabel` | "Monthly Investment" | ACCENT | WHITE |
| 1 | `rec.totals.clicksRangeLabel` | "Est. Clicks / mo" | WHITE | NAVY |
| 2 | `rec.totals.impressionsRangeLabel` | "Est. Impressions / mo" | OFFWHT | NAVY |
| 3 | `rec.totals.cpcLabel` | "Avg CPC (blended)" | WHITE | NAVY |

Each stat card: WHITE/MGRAY 0.5pt border, `makeShadow()`.
Big text: 26pt bold, `valign: bottom`, centred.
Label text: 9.5pt, DGRAY, `valign: top`, centred.

---

## Slide 7 — Measurement Framework (light)

**Background:** LGRAY. Header + accent strip + footer as per slide 2.
**Title:** "Measurement Framework", NAVY, 20pt bold.

A 3-column table is placed at (0.4, 0.9, 9.2) with column widths [2.6, 4.0, 2.6] and rowH=0.5".
Font: 10pt Calibri. Border: 0.5pt MGRAY.

Header row: NAVY fill, WHITE bold text.
Body rows alternate WHITE / OFFWHT fill, DGRAY text.

| KPI Category | Metric | Channel / Source |
|---|---|---|
| Brand / Awareness | Impressions · Reach · Video views | Meta (all formats) |
| Engagement | Clicks / link clicks · CTR | All channels |
| Conversion | Careers-page visits · Application starts | All channels → ATS |
| Hire (Primary KPI) | Applications → Interview → Hire · CPH | ATS feedback |

Total table height with 4 body rows at rowH=0.5": header (0.5") + 4 rows × 0.5" = 2.5". Fits
comfortably above the footer.

---

## Slide 8 — Next Steps (light)

**Background:** LGRAY. Header + accent strip + footer as per slide 2.
**Title:** "Next Steps", NAVY, 20pt bold.

Five numbered action items, starting at y=0.85 with 0.82" row spacing.

Per step: numbered square (0.42 × 0.42, ACCENT fill) at (0.45, y); step heading at (0.95, y,
8.5, 0.30), 11pt bold, ACCENT; step description at (0.95, y+0.30, 8.5, 0.40), 10pt, DGRAY.

| # | Heading | Description |
|---|---|---|
| 1 | Confirm Budget Tier | Select a tier to lock the plan and brief the build team. |
| 2 | Finalise Geo & Role Priorities | Confirm which locations and roles go live first. |
| 3 | Tracking & Pixel Setup | Install Meta Pixel + Google Tag and configure UTMs. |
| 4 | Creative & Asset Collection | Gather approved imagery, video, and copy per channel. |
| 5 | Build & Launch | Internal QA → client review → sign-off → live. |

---

## Slide 9 — Close (dark)

**Background:** Full-bleed NAVY rectangle.
**Footer:** None (dark slide).

| Element | Position (x, y, w, h) | Content / Style |
|---|---|---|
| Headline | 0.45, 1.40, 9, 1.20 | "Let's Build `dm.client`'s Plan", WHITE, 38pt bold |
| Summary line | 0.45, 2.70, 9, 0.40 | "`rec.budgetLabel` / month · `rec.totals.clicksRangeLabel` projected clicks", SUBTLE, 13pt |
| Joveo wordmark | 0.45, 4.80, 6, 0.40 | "joveo \| yoke" (joveo) / "joveo" (cobranded); WHITE, 18pt bold. Hidden in whitelabel. |

---

## Footer rule (summary)

| Slide | Background | Footer |
|---|---|---|
| 1 Cover | Dark (NAVY) | None |
| 2 Opportunity | Light (LGRAY) | Yes |
| 3 Budget Options | Dark (NAVY) | None |
| 4 Campaign Structure | Light (LGRAY) | Yes |
| 5 Budget Allocation | Dark (NAVY) | None (see note) |
| 6 Projected Performance | Dark (NAVY) | None |
| 7 Measurement Framework | Light (LGRAY) | Yes |
| 8 Next Steps | Light (LGRAY) | Yes |
| 9 Close | Dark (NAVY) | None |

Note on dark content slides (5, 6): `allocationSlide()` contains a comment noting the footer
was not added via `darkSlide()` (which produces no footer by design). Whether a footer should
appear on these dark content slides is being confirmed in the visual QA pass.

---

## Follow-on depth levels (not yet implemented)

### Intermediate — 14 slides

Extends Minimal by adding: Executive Summary, Targeting Strategy, Creative Guidance, Channel
Deep-Dive (one slide per active channel), and a Competitive Context slide. Same pipeline;
additional slide builder functions to be added in `render.js`.

### Maximalist — 21 slides

Extends Intermediate by adding: Market Sizing, Full-Funnel Model, Quarterly Budget Pacing,
Keywords & Search Intent, Audience Layering, Risk & Mitigation, and an Appendix. These slides
incorporate optional AM-reviewed modules from Plan 3 (Targeting, Keywords, Insights).

Both depth levels are toggled via a `depth` field on the plan object (not yet in the schema)
and will render through the same `generate()` pipeline with an expanded `renderDeck()`.

---

## Visual QA — 2026-06-03

**PASS.** Three decks generated (joveo, cobranded, whitelabel) and inspected via PPTX XML analysis (LibreOffice/pdftoppm not available on this machine; cover thumbnails also reviewed visually via qlmanage).

Checklist results:

- **No element overflow**: All shape/text x+w values stay within 10" slide boundary across all 9 slides. Bar value-label cap (`Math.min(..., 8.0)`) confirmed effective.
- **No text above footer band**: All content elements confirmed above y=5.3"; footer band at y=5.35".
- **RECOMMENDED badge**: Exactly one occurrence, on Tier 2 ($9,000 = targetBudget). Tiers 1 and 3 have none.
- **Footers on dark content slides**: budgetOptions (slide 3), allocation (slide 5), and performance (slide 6) all carry the footer text. Cover (slide 1) and close (slide 9) are footer-free.
- **Channel overflow guards**: Tier 2 (3 channels) and Tier 3 (4 channels) both render within the 6-channel cap; no overflow.
- **Whitelabel brand clean**: Zero "joveo" or "yoke" strings anywhere in slide XML. Footer reads "Acme Care | Media Plan | June 2026 | Confidential".
- **Cobranded accent color**: `00A1E0` present across content slides (header strip, accent bar, budget values).
- **Numbers sensible**: CPC $1.65; click ranges all low < high (e.g. 3,280–7,927; 1,822–4,404); impression ranges in K/M format.

No fixes were required after initial application of the three render patches.
