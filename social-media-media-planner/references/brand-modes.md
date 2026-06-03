# Brand Modes Reference

The renderer supports three brand modes, resolved by `render/brand.js` via `resolveBrand(mode, client)`.
The mode controls which Joveo marks appear, how client assets are applied, and what text appears
in the footer. The result is a `brand` object carried through the `deckModel` to every slide builder.

Valid modes: `'joveo'`, `'cobranded'`, `'whitelabel'`. Any other value throws an error.

---

## Mode: `joveo` — Standard Joveo-branded output

**When to use:** Default. All decks where the client has not requested their own branding.

### Marks

| Mark | Shown? | Placement |
|---|---|---|
| Joveo wordmark ("joveo") | Yes | Cover slide (top-left) and Close slide (bottom-left) |
| Yoke mark ("joveo \| yoke") | Yes | Both strings rendered as "joveo \| yoke" |
| Client logo | No | Not rendered (even if `client.logoPath` is provided, logo is only placed when `clientLogoPath` is non-null — which it is only when `logoPath` is supplied to any mode, but in Joveo mode the full Joveo identity takes precedence visually) |

Note: `clientLogoPath` is set to `client.logoPath || null` regardless of mode. In Joveo mode,
you can still supply a logo path and it will render on the cover (top-right) alongside the Joveo
marks. The semantic difference is that `showYoke: true` signals full Joveo identity.

### Palette

The standard Joveo palette from `render/palette.js` is used without modification:

| Token | Hex | Role |
|---|---|---|
| NAVY | `1B3A6B` | Primary / header backgrounds |
| CRIMSON | `C0243A` | Default ACCENT (used as accent colour when no client override) |
| BLUE | `1A6BBF` | Secondary channel colour |
| LGRAY | `F4F7FB` | Light slide backgrounds |
| OFFWHT | `EEF3FA` | Table alternating rows, footer background |
| MGRAY | `D0D8E4` | Borders |
| DGRAY | `4A4A4A` | Body text |
| GREEN | `1A7A3C` | Fourth bar colour in allocation slide |
| WHITE | `FFFFFF` | Card backgrounds, text on dark slides |
| SUBTLE | `A0B4CC` | Subdued text on dark slides (subtitles, summary lines) |
| ACCENT | = CRIMSON | No client override; accent defaults to Joveo Crimson |
| PRIMARY | = NAVY | No client override |

### Footer text

```
Joveo Employer Branding  |  Prepared for <client.name>  |  <dateStr>  |  Confidential
```

---

## Mode: `cobranded` — Joveo + client branding

**When to use:** Client wants their logo and colours in the deck alongside Joveo attribution.
Typical for managed-service clients who want a personalised output but are happy to show Joveo
as the media partner.

### Marks

| Mark | Shown? | Notes |
|---|---|---|
| Joveo wordmark ("joveo") | Yes | Cover and Close — the plain wordmark, not "joveo \| yoke" |
| Yoke mark | No | `showYoke: false`; only the "joveo" string renders |
| Client logo | Yes (if `client.logoPath` provided) | Top-right of cover slide; `contain` sizing within 1.65 × 0.70" |

### Palette

Client colour overrides are applied on top of the Joveo base palette:

- If `client.accentColor` is provided (hex, no `#`): `ACCENT` is set to that value.
  Otherwise `ACCENT` falls back to Joveo CRIMSON.
- If `client.primaryColor` is provided: `PRIMARY` is set to that value.
  Otherwise `PRIMARY` falls back to Joveo NAVY.
- All other tokens (NAVY, LGRAY, MGRAY, etc.) remain unchanged.

The client accent colour propagates to all elements that reference `p.ACCENT`: the left accent
strip on light-slide headers, recommended-tier badge, numbered circles on Next Steps, budget
bars (first bar), channel card header stripe (second channel), tier budget figures, and more.

### Footer text

```
Joveo Employer Branding  |  Prepared for <client.name>  |  <dateStr>  |  Confidential
```

Footer text is identical to Joveo mode. The client's presence is signalled through the logo and
colour scheme, not the footer attribution line.

---

## Mode: `whitelabel` — Client-exclusive, no Joveo attribution

**When to use:** The client explicitly requires that no Joveo branding appear anywhere in the
deliverable (e.g. white-label resellers, agencies using Joveo infrastructure under their own brand).

### Marks

| Mark | Shown? |
|---|---|
| Joveo wordmark | No — `showJoveo: false` |
| Yoke mark | No — `showYoke: false` |
| Client logo | Yes (if `client.logoPath` provided) |

### White-label guarantee

The following checks eliminate Joveo attribution across every slide:

1. **Cover slide** — the Joveo/Yoke wordmark block is gated on `dm.brand.showJoveo`; it is
   not rendered when `showJoveo` is false.
2. **Close slide** — same gate on `dm.brand.showJoveo`; no wordmark rendered.
3. **Footer text** — uses the client-only template; the word "Joveo" does not appear:
   ```
   <client.name>  |  Media Plan  |  <dateStr>  |  Confidential
   ```
4. **No hard-coded strings** — no slide builder in `render.js` injects "Joveo" or "yoke"
   as a literal string outside the `showJoveo`/`showYoke` guards.

Result: a complete audit of the rendered PPTX XML will find no occurrence of the strings
"Joveo" or "yoke" (case-insensitive) in any text element.

### Palette

Same override logic as cobranded. Client accent and primary colours apply; Joveo design tokens
(NAVY, LGRAY, etc.) remain as the base palette but the brand identity is client-only.

---

## Applying client colours and logo — quick reference

In the plan object, populate the `client` sub-object:

```json
{
  "client": {
    "name": "Acme Corp",
    "accentColor": "00A1E0",
    "primaryColor": "003366",
    "logoPath": "/absolute/path/to/acme-logo.png"
  },
  "brandMode": "cobranded"
}
```

- `accentColor` and `primaryColor`: hex strings without a leading `#`, as pptxgenjs expects.
- `logoPath`: must be an absolute path accessible at render time. The image is placed at
  (7.90, 0.35, 1.65 × 0.70) on the cover slide with `contain` sizing.
- If no logo is provided (`logoPath` absent or null), the logo position is left empty on all modes.

---

## resolveBrand return shape

```js
{
  mode:            string,          // 'joveo' | 'cobranded' | 'whitelabel'
  showJoveo:       boolean,         // true for joveo + cobranded; false for whitelabel
  showYoke:        boolean,         // true only for joveo mode
  clientLogoPath:  string | null,   // client.logoPath or null
  palette:         object,          // Joveo tokens + ACCENT + PRIMARY (client overrides applied)
  footerText:      string,          // contains '{DATE}' placeholder — replaced by viewmodel
}
```

After `resolveBrand()` returns, `buildDeckModel()` in `render/viewmodel.js` substitutes
`{DATE}` in `footerText` with the plan's `dateStr` before the brand object reaches any slide
builder. Slide builders receive the final string with no remaining placeholders.
