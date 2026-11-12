# Porting TapStand's card-design engine into TapCard

**Audience:** an AI session working in `phamtomheroku/tapcard`, asked to give TapCard
TapStand's ability to generate good card designs.

**Read this before writing code.** It exists because the obvious framing of the task is
wrong, and acting on the wrong framing wastes a session.

---

## 0. Correct the premise first

> "Copy the AI functionality for making cards from TapStand."

There is no AI in TapStand. Measured, not guessed:

| | tapstand/index.html | tapcard/index.html |
|---|---|---|
| lines | 8,530 | 5,552 |
| LLM / image-API calls | **0** | 10 |
| `fetch()` calls | 1 (the icon manifest) | many |

**TapCard already has the AI.** It has an art generator with provider presets
(Stability native multipart, any OpenAI-compatible `/images/generations`), per-key
"remember on this device", and a server-side key proxy so the provider key never
reaches the browser. TapStand has none of that and never did.

What TapStand actually has is a **deterministic generative design system**: a card is
composed from five orthogonal axes, rendered by one layer renderer, measured by
automated harnesses, and filtered by a human judging loop. No model is in the loop.

So the real task is:

> Port TapStand's **design-generation engine and its judging loop** into TapCard, and
> let TapCard's existing AI art generator feed it — rather than the other way round.

That pairing is the prize. TapCard can already *generate imagery*; it cannot
*compose a card*. TapStand can compose, and has the measurement discipline to know
when a composition is broken.

---

## 1. Get the source

```
add_repo phamtomheroku/tapstand          # read access is enough
git clone --depth 1 https://github.com/phamtomheroku/tapstand
```

Everything below is in the single file `tapstand/index.html`. Anchors are function
names, not line numbers — line numbers move.

---

## 2. The model: five orthogonal axes

A design is a point in a product space. Nothing in one axis knows about another.

| Axis | Count | What it is | Anchor |
|---|---|---|---|
| **FORMATS** | 10 | physical trim: `{k, mm, ar, tag?, face?}` | `var FORMATS=[` |
| **ARCHETYPES → PLATES** | ~44 | *composition*: `fn(formatIndex, g) → layer stack` | `var ARCHETYPES=[` |
| **THEMES** | 9 | type pairing, frame, star style, tap ring, texture, radius | `var THEMES=[` |
| **PALETTES** | 6 | `fn(brand, bg) → {ground, groundCSS, brand, accent, tint}` | `var PALETTES=[` |
| **GROUNDS** | 11 | background graphic, three paint mechanisms | `var GROUNDS=` |

Composed on top:

- **DIRECTIONS** (13) — curated starting points: a shortlist of compositions plus a
  default theme/palette/ground. `var DIRECTIONS=[`
- **FAMILIES** — shelves for browsing. Mostly exclusive; `simple` deliberately
  overlaps. `var FAMILIES=[`, `famsOf()`

### The composition contract

A composition is a pure function:

```js
function hSplitField(f, g){            // f = format index, g = {pat, hero, motif}
  var w = isWide(f);                   // trim is landscape?
  if(w) return [ ...layers ];          // wide variant
  return [ ...layers ];                // tall variant
}
```

It returns an **ordered array of layer objects**. A layer:

```js
{ t:"box", k:"plat", x:.27, y:.5, s:1, ph:44, onBand:1 }
```

- `k` — kind. The renderer switches on it. 17 kinds exist: `band blob fill head
  hero lockup logo motif name pattern plat qr rail rule split stars tap`
- `x`,`y` — centre, as a fraction of card width/height
- `s` — scale; `w` — width fraction; `ph` — explicit height in **cqw**
- `onBand:1` — this layer sits on brand colour, so take the contrasting ink
- `bleed:1` — exempt from auto-fit and from the width clamp
- `hidden` — present but not drawn

### The unit that makes it work: `cqw`

Everything is sized in **cqw — percent of card width** — via CSS container queries.
One rule then holds at every trim. Two derived helpers do the rest:

```js
function isWide(f){ return FORMATS[f].ar < .85 }
function cardHt(f){ return 100*(FORMATS[f].ar||1.5) }   // card height, in cqw
```

**This is the single most transferable idea in the codebase**, and §5 is a list of the
bugs that come from forgetting it.

---

## 3. The renderer

Three functions, in order:

1. **`bodyHTML(L, ctx)`** — one `switch(L.k)`, returns the layer's inner HTML. All
   colour resolution happens here (`mc = L.onBand ? contrast(ctx.brand) : ctx.brand`).
2. **`layerCSS(L, M, ctx, th, brand, i)`** — absolute positioning, z-index, the
   `max-width:92cqw` clamp (which `bleed` and background kinds escape).
3. **`resolveLayout()`** — after layout, measures real boxes and shrinks anything
   overflowing the safe area. Skips `_man` (hand-moved) and `bleed` layers.

**`miniCard(stack, over)`** renders the same stack as a thumbnail. `over` can
override theme, palette, **name, copy and format** — see §5.9 for why those last
three matter.

---

## 4. The judging loop (port this; it is the actual quality mechanism)

Designs are not shipped because they look fine in the editor. They are *judged*.

- **Verdicts** — keep / drop / undecided per design, keyed by **name**:
  `"Split Field|Google|Flat"`. `vKey()`, `verdictOf()`, `setVerdict()`
- **Packs** — ordered lists the user makes by hand. Members are typed strings:
  an archetype pairing `"Split Field|Google|Flat"`, or a saved card `"card:c19-abc"`.
  A recipe vs a finished job — they are not the same animal. `packNew()`, `packKeyItem()`
- **Shipped packs** are recorded in a ledger of names already offered, so **a pack the
  user deletes stays deleted**. Without that, every reload resurrects it.
- **The swipe deck** — designs rendered to images, judged one at a time (Tinder-style),
  results written to a store, then fed back as "keep these elements, retire those".
  Three rounds run so far; each retired compositions and changed what got built next.

**Names, not indices, everywhere.** Retiring one composition renumbers every one after
it. A verdict or pack filed by position silently comes back pointing at different cards.

---

## 5. Hard-won lessons — every one of these was a real bug

Port the **rules**, not just the code.

1. **A cqw number is a different physical size at every trim.** 38 cqw is 29% of a
   4×3 stand and 60% of a credit card. Cap against the card: `Math.min(38, .48*cardHt(f))`.
2. **Tile a texture in millimetres, not cqw**, or grain tiles at 29 mm on a credit card.
   `--mm: calc(100/trimMM)cqw`.
3. **An SVG background keeps its viewBox aspect under `background-size:100% 100%`.**
   A square drawing letterboxes on a 4×3 card. Use `preserveAspectRatio="none"` for
   stretch-fit; use `cover` when the shapes must not distort.
4. **`background-size:cover` crops a square drawing to its middle band.** Draw
   full-bleed graphics at the target aspect (200×150), not square, or tall art gets
   beheaded.
5. **A tiled motif needs margin inside its tile.** Five stars filling their own tile
   fuse into a field of stars; the gap after the fifth is what reads as *a rating*.
6. **A filled bar must tint its icon with `contrast()`, not the fill colour.** Brand on
   brand is an invisible icon.
7. **`bleed` must also exempt from the width clamp**, or a "full-bleed" bar renders
   floating with paper down both sides.
8. **Measure ink, not boxes.** Line art has clear space inside its viewBox; matching
   box heights leaves the glyph visibly smaller than the text. Use `getBBox()`.
9. **A preview renderer takes its words from the live editor.** Correct for a recipe,
   wrong for a saved design — three saved cards all printed the last name typed.
10. **Retiring a composition silently shrinks every curated list naming it.** One
    direction was offering 3 of its 12 before anyone noticed. Warn on an unresolved name.
11. **Assert every string replacement before writing the file.** A reformatted anchor
    made an edit a silent no-op; six compositions existed but were unreachable.

---

## 6. The harnesses — steal these first

Four Playwright scripts drive the real DOM and measure. They caught every bug in §5.

| Harness | Checks |
|---|---|
| `regress` | layer overlaps + off-card, every composition × direction × 4 trims (116 combos each), then PDF page count and trim size |
| `platsweep` | the badge's box as a % of the card — catches a lockup that has grown or collapsed |
| `seam` | any content layer **1.5–94% covered by a colour block** — a word half on brand, half on paper |
| `ringfit` | contents inside a circular frame, via the inscribed-rectangle rule: fits only if `hypot(w/2,h/2) <= r` |

Two lessons about the harnesses themselves:

- **A threshold tuned for one failure mode is blind to its smaller cousin.** `seam`
  started at 12% and missed a 2% notch that was plainly visible. It is 1.5% now.
- **The collision sweep skips background kinds**, so it can never see content sitting
  on a colour block. That is why `seam` exists as a separate check.

---

## 7. Mapping onto TapCard — what transfers, and what does not

| TapStand | TapCard | Verdict |
|---|---|---|
| `FORMATS` (trim in mm, `ar`) | pass style + image slot dims in px @1x/2x/3x | **Maps.** Swap "mm" for "points"; keep the discipline of one unit resolved per target. |
| `GROUNDS` (11 SVG/CSS grounds) | `strip.png` / `background.png` art | **Maps directly.** TapCard already rasterises to canvas. Highest value per hour. |
| `PALETTES` (`fn(brand,bg)`) | `foregroundColor` / `backgroundColor` / `labelColor` | **Maps,** plus a contrast floor — PassKit text is not yours to resize, so colour is the only legibility lever. |
| layer stack + `bodyHTML` | `stripDesign.stack` | **Already there.** TapCard has an ordered layer stack with a Layers panel. This is the join. |
| `ARCHETYPES` (composition) | strip/poster art composition **+** field arrangement | **Splits in two.** See below. |
| `THEMES` (9, type-led) | — | **Mostly does not map.** Apple sets pass typography; you cannot choose a typeface or size for fields. A TapCard "theme" collapses to art treatment + colour role + frame/texture *inside* the generated image. Do not port 9 themes and pretend they differ. |
| packs / verdicts / swipe deck | same | **Maps,** but see §8 — storage differs. |
| harnesses | PassKit validity + contrast + strip-legibility sweep | **Maps in spirit.** The checks change; the discipline is the point. |

**The composition split.** A TapStand composition decides one thing: where everything
goes. A Wallet pass has two surfaces and you only control one of them:

- **Field arrangement** — which of `headerFields / primaryFields / secondaryFields /
  auxiliaryFields / backFields` carry what. Apple lays these out; you choose the slots.
- **Art composition** — the strip or full-bleed background. Here you have real layout
  freedom and TapStand's model ports almost unchanged.

Build the art composition first. It is where the engine earns its keep.

---

## 8. TapCard's own rules bind this port

From `tapcard/CLAUDE.md` — read it, these are non-negotiable:

1. **Offline first** — no backend calls except CDN libs on first load.
2. **In-memory state only.** No `localStorage` / `sessionStorage` / IndexedDB. The sole
   exception is an AI API key whose per-key "Remember on this device" box was ticked.
   **TapStand's packs and verdicts both use `localStorage`.** They cannot be ported as
   written. Hold them in memory and round-trip through the existing design
   save/load file — do not quietly add a third storage exception.
3. **Two-way sync** — canvas ↔ JSON always consistent.
4. **Single file**, no build step.
5. **Graceful degradation** — a missing image must not crash the app.

Also live: a `generic` pass carrying `images.background` exports an **additional
top-level `posterGeneric`** sibling alongside the classic `generic` object, so iOS 26−
gets the classic layout and iOS 27+ gets full-bleed. `passForExport()` in index.html and
`siblingStyles()` in server.js must stay in step. Any composition that targets the
poster face has to emit both.

---

## 9. Staged plan

**Stage 1 — grounds.** Port `GROUNDS` and `gndCSS()`. 11 background graphics, three
paint mechanisms (CSS gradient / one full graphic / tile at a physical size). Render to
canvas at exact PassKit strip dims. Self-contained, immediately visible, and it exercises
lessons §5.1–5.5. Pair it with the existing AI generator: AI fills the photographic
backgrounds, `GROUNDS` draws the geometric ones — different jobs, same slot.

**Stage 2 — palettes with a contrast floor.** `PALETTES.fn(brand,bg)` → the three
PassKit colour keys. Add a WCAG-style check; reject a pairing that fails rather than
shipping unreadable labels.

**Stage 3 — art compositions.** 6–10 to start, as `fn(target) → layer stack` against
TapCard's existing `stripDesign.stack`. Resist writing 7 near-identical siblings; if
they differ by one property, write a **transform** instead (TapStand's `withTapBar()` is
the worked example and says why in its comment).

**Stage 4 — the harness.** Before adding more compositions. Sweep every composition ×
pass style × @1x/@2x/@3x for overflow, seam-straddling and contrast. Without this you
cannot tell a new composition from a new bug.

**Stage 5 — packs and judging.** In-memory, exported to file. Only once there are enough
designs that choosing between them is real work.

Do Stage 4 before Stage 3 grows past about ten compositions. TapStand added the harnesses
late and paid for it: the first sweep that actually swept themes turned "0 flagged" into
27 real failures that had been shipping for weeks.

---

## 10. What to read, in order

1. `var FORMATS=[` — the target shapes
2. `var ARCHETYPES=[` then any `h*`/`c*`/`x*` function — the composition contract
3. `bodyHTML()` — the renderer, one switch
4. `resolveLayout()` — auto-fit and its exemptions
5. `var GROUNDS=` and `gndCSS()` — Stage 1
6. `var PALETTES=[` — Stage 2
7. `packKeyItem()` and `vKey()` — the judging model
8. `withTapBar()` — how to add a variant family without duplicating it

The comments in that file carry the reasoning, including why several earlier attempts
were thrown away. Read them; they are the part that is hard to reconstruct.
