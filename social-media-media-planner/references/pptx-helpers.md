# PPTX Helpers Reference

All helpers live in `render/render-helpers.js` and are imported by `render/render.js`.
They wrap pptxgenjs primitives with conventions that prevent common rendering bugs and
keep the slide builders free of boilerplate.

---

## Helper API

### `makeShadow() → object`

```js
function makeShadow()
// Returns: { type: 'outer', blur: 8, offset: 3, angle: 135, color: '000000', opacity: 0.10 }
```

Returns a fresh shadow descriptor object. **Always call `makeShadow()` per shape** — never
assign the return value to a variable and reuse it. See the Fresh-Shadow Rule below.

Used by: `statCard`, budget-options tier cards, campaign-structure channel cards, `budgetBarRow`
is not shadowed. Every call that passes `shadow:` to `addShape` must call `makeShadow()` inline.

---

### `addFooter(pres, slide, footerText, palette)`

```js
function addFooter(pres, slide, footerText, palette)
// Returns: void
```

| Parameter | Type | Description |
|---|---|---|
| `pres` | PptxGenJS instance | The presentation object (needed for `pres.shapes`) |
| `slide` | Slide object | The slide to add the footer to |
| `footerText` | string | Pre-formatted footer string with `{DATE}` already substituted |
| `palette` | object | Resolved palette (from `dm.brand.palette`) |

Draws a footer band at the bottom of the slide:

- Background rectangle: (0, 5.35, 10, 0.275), OFFWHT fill, MGRAY 0.5pt border.
- Text box: (0.2, 5.36, 9.6, 0.25), 8pt, colour `999999`, centred, `valign: middle`.

`contentSlide()` calls `addFooter()` automatically. Do not call it again on content slides.
`darkSlide()` does **not** call `addFooter()` — dark slides have no footer by default.

---

### `contentSlide(pres, deckModel, title, tag = '') → slide`

```js
function contentSlide(pres, deckModel, title, tag = '')
// Returns: the new slide object
```

| Parameter | Type | Description |
|---|---|---|
| `pres` | PptxGenJS instance | The presentation object |
| `deckModel` | object | Full deck model (supplies `brand.palette` and `brand.footerText`) |
| `title` | string | Slide title shown in the header bar |
| `tag` | string | Optional badge text (e.g. "RECOMMENDED"); omit or pass `''` to suppress |

Creates and returns a light-background slide with:

1. Full-bleed LGRAY background (0, 0, 10 × 5.625).
2. WHITE header bar (0, 0, 10 × 0.65) with MGRAY 0.5pt border.
3. Narrow ACCENT accent strip on the left edge (0, 0, 0.07 × 0.65).
4. Title text at (0.25, 0.08, 7.5, 0.48), 20pt bold, NAVY.
5. If `tag` is non-empty: ACCENT badge at (8.0, 0.12, 1.6 × 0.40) with 10pt bold WHITE centred text.
6. Footer via `addFooter()`.

All content added after `contentSlide()` returns must stay within y < 5.30" to avoid
overlapping the footer band.

---

### `darkSlide(pres, deckModel) → slide`

```js
function darkSlide(pres, deckModel)
// Returns: the new slide object
```

| Parameter | Type | Description |
|---|---|---|
| `pres` | PptxGenJS instance | The presentation object |
| `deckModel` | object | Full deck model (supplies `brand.palette`) |

Creates and returns a dark-background slide with a full-bleed NAVY rectangle (0, 0, 10 × 5.625).
**No footer is added.** All content must be added by the caller after this function returns.

Used by: Cover (slide 1), Budget Options (slide 3), Budget Allocation (slide 5),
Projected Performance (slide 6), Close (slide 9).

---

### `statCard(pres, slide, x, y, w, h, bigText, labelText, palette, bigColor, bgColor)`

```js
function statCard(pres, slide, x, y, w, h, bigText, labelText, palette, bigColor, bgColor)
// Returns: void
```

| Parameter | Type | Description |
|---|---|---|
| `pres` | PptxGenJS instance | |
| `slide` | Slide object | |
| `x, y, w, h` | numbers | Card position and size (inches) |
| `bigText` | string | Large metric value (e.g. "$9,000", "1,490 – 3,600") |
| `labelText` | string | Small description below the metric |
| `palette` | object | Resolved palette |
| `bigColor` | string | Hex colour for the big text; defaults to `palette.ACCENT` if falsy |
| `bgColor` | string | Hex fill for the card background; defaults to `palette.WHITE` if falsy |

Draws a stat card:

- Card background: `bgColor` fill, MGRAY 0.5pt border, `makeShadow()`.
- Big text: x, y+0.08, w, h×0.52; 26pt bold, `bigColor`, centred, `valign: bottom`.
- Label text: x, y+h×0.58, w, h×0.38; 9.5pt, DGRAY, centred, `valign: top`.

---

### `budgetBarRow(pres, slide, x, y, label, valueLabel, pct, color, palette, rowH = 0.42, barMaxW = 4.6)`

```js
function budgetBarRow(pres, slide, x, y, label, valueLabel, pct, color, palette, rowH = 0.42, barMaxW = 4.6)
// Returns: void
```

| Parameter | Type | Description |
|---|---|---|
| `pres` | PptxGenJS instance | |
| `slide` | Slide object | |
| `x, y` | numbers | Top-left origin of the row |
| `label` | string | Channel name (left column) |
| `valueLabel` | string | Formatted budget (right of bar) |
| `pct` | number | Proportion 0..1 (from `c.pct` in the channel view model) |
| `color` | string | Hex fill colour for the bar rectangle |
| `palette` | object | Resolved palette (for WHITE label text) |
| `rowH` | number | Row height in inches; default 0.42 |
| `barMaxW` | number | Maximum bar width in inches; default 4.6 — see Bar-Overflow Cap Rule |

Draws one allocation row:

- Label text: (x, y, 3.0, rowH), WHITE, 10pt, `valign: middle`.
- Bar rectangle: (x+3.1, y+0.05, barW, rowH-0.1), `color` fill.
  `barW = Math.max(barMaxW * pct, 0.05)` — minimum 0.05" so a 0% allocation still shows a sliver.
- Value label: (x+3.1+barW+0.1, y, 1.6, rowH), WHITE, 10pt bold, `valign: middle`.

---

## Critical Rules

### Fresh-Shadow Rule

**pptxgenjs mutates shadow descriptor objects** internally when it processes them. If the same
object is passed to multiple `addShape` calls — even across separate slides — later shapes may
render with a corrupted shadow or no shadow at all.

Rule: **call `makeShadow()` as an inline expression inside every `addShape` call that needs a
shadow.** Never assign the result to a variable and reuse it.

Correct:
```js
slide.addShape(pres.shapes.RECTANGLE, { ..., shadow: makeShadow() });
slide.addShape(pres.shapes.RECTANGLE, { ..., shadow: makeShadow() }); // fresh object each time
```

Incorrect:
```js
const sh = makeShadow();
slide.addShape(pres.shapes.RECTANGLE, { ..., shadow: sh });
slide.addShape(pres.shapes.RECTANGLE, { ..., shadow: sh }); // BUG: mutated object reused
```

### Bar-Overflow Cap Rule

`budgetBarRow` computes bar width as `barMaxW * pct`, where `pct` is `allocationPct / 100`
from the view model. Because `pct` is bounded by the engine (allocations sum to 100%), the
largest possible bar is `barMaxW * 1.0 = 4.6"`, which fits safely within the slide.

If you reduce `barMaxW` below the default or if a very wide row label pushes the bar origin
right, verify the total row width: `3.1" (label column) + barMaxW + 0.1" (gap) + 1.6" (value)
= 9.4"` at maximum. This leaves 0.6" margin from the right edge at x=0.45.

Do not set `barMaxW` above 4.6 without adjusting the row geometry, as the value label would
overflow the slide boundary.

### Footer Rule

| Slide type | Function used | Footer |
|---|---|---|
| Light content slide | `contentSlide()` | Automatically added by `addFooter()` — do not add again |
| Dark slide | `darkSlide()` | Not added — dark slides have no footer by design |

**Content slides (2, 4, 7, 8)** receive a footer automatically from `contentSlide()`.

**Dark slides (1, 3, 9)** — Cover, Budget Options, Close — have no footer by design.

**Dark content slides (5, 6)** — Budget Allocation and Projected Performance — are built on
`darkSlide()` and currently carry no footer. A comment in `allocationSlide()` marks this as
a point for visual QA review (whether a footer should appear on these dark content slides).
If a footer is needed, call `addFooter(pres, s, dm.brand.footerText, p)` explicitly after
`darkSlide()` returns — but note the white footer band will be visible against the NAVY
background, which may not match the intended aesthetic.

### Table-Height Guidance

`tableSlide()` uses pptxgenjs `addTable()` with `rowH: 0.5`. The table is anchored at y=0.9,
so available height before the footer (y=5.35) is approximately 4.45". At rowH=0.5 this
accommodates a maximum of **8 body rows** (header row + 8 = 4.5") before the table reaches
the footer band. The Measurement Framework slide uses 4 body rows (total table height 2.5"),
well within the safe zone.

If you add rows to the measurement table or create a new table slide, verify:
`0.9 + (headerH + n × rowH) ≤ 5.30`.

With the default rowH=0.5 and header=0.5: `n ≤ floor((5.30 - 0.9 - 0.5) / 0.5) = 7` rows max.
