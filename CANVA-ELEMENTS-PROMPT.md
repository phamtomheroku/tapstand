# Prompt: generate the small card elements with Canva AI

Copy everything below the line into a **Claude session on your own machine** — one with a
browser, your Canva account, and a clone of `https://github.com/phamtomheroku/tapstand`.
It is self-contained; the new session needs no context from anywhere else.

---

## What this is

I sell NFC "tap to leave a review" cards to local businesses. The editor that designs them is
`index.html` in this repo — a single self-contained file, no build step, opened straight in a
browser. It has an icon library, and the cards are assembled from those pieces.

I want to use **Canva's AI** to generate more of the small elements — star rows, badge chips,
frames, dividers, little decorations — then bring the good ones into the library and keep
re-prompting until they're right. You have the Canva MCP connector, so you can generate,
look at the result, and iterate without me in the loop.

## The one hard rule

**Do not generate the Google logo, the "review us on Google" badge, or any platform mark.**
Those are trademarks. An AI approximation is both legally wrong and visually wrong — the
proportions and colours will be subtly off and it will look counterfeit on a printed card. The
real lockup is already in `icons/platform/` and came from Google's brand page.

Generate what goes *around* it: the chip it sits in, the stars above it, the rule beneath it.

## What to generate

Work through these, roughly in priority order:

**Star rows** — the most useful, because every review card wants one.
- Five solid stars, evenly spaced
- Five outline stars
- Four-and-a-half stars (one half-filled)
- A tighter, smaller-gap version of each

**Badge containers** — a shape the Google lockup can sit inside.
- Plain rounded-rectangle chip, empty
- Chip with a hairline border
- A plaque / shield outline
- A simple laurel or bracket pair that frames a mark

**Dividers and ornaments**
- Short centred rules, plain and dashed
- Corner brackets (a set of four)
- A small chevron or arrow pointing down toward a tap mark

**Motifs** for trades not covered yet — check `icons/motif/` first for what already exists,
then fill gaps (there are ~60 already, so look before generating).

## The spec that actually matters

The editor **tints** most of these with the business's brand colour. A raster is used as a CSS
mask; an SVG has its stroke set. Both only work on artwork that is a **single colour on real
transparency**. A white background is not transparency — it renders as a solid brand-coloured
rectangle where the element should be. Verify alpha, don't assume it.

**Prefer SVG.** It's vector, tiny, and tints cleanly. On Canva, SVG export is a paid-plan
feature — check whether your plan has it before building a workflow around it. Transparent-
background PNG export may also be plan-gated; verify rather than trusting me on either.

- **SVG:** single colour or `currentColor`, no gradients, no embedded raster, tight `viewBox`,
  no `width`/`height` on the root `<svg>`, under 10 KB
- **PNG:** real alpha channel, 600–900 px on the long edge, tight-cropped, under 80 KB

**Full-colour pieces** that must keep their own colours (a platform mark, a photo) get
`"asis": true` in the manifest and are not tinted.

## Getting a usable element out of Canva AI

Canva generates *designs*, not isolated elements, so the prompt has to fight that. What works:

- Say **one single mark**, explicitly
- Say **plain white background**, **no photographs, no gradients, no drop shadows, no 3D**
- Say **one solid colour only**
- Say **no words, no letters, no numbers, no text of any kind** — and expect to say it twice,
  because it will add text anyway
- Say **generous even margins**
- Name the print size: "reads clearly at 20 mm tall"
- `design_type: "logo"` gets closer to a single mark than the poster and social types

Then iterate. Change one thing per attempt so you can tell what moved. If four candidates all
have text, the prompt needs the no-text instruction moved to the front, not repeated at the end.

Expect to throw most of them away. A generated element that is nearly right but has a stray
flourish is worse than none — it will look like a mistake on a printed card at 100 mm wide.

## Where the files go

```
icons/
  manifest.json          <- lists each category in grid order
  tap/                   <- tap marks
  platform/              <- platform lockups (do not generate these)
  motif/                 <- decorations, trade symbols
```

Add the file, add an entry to `manifest.json` in the category and position you want, then:

```
node tools/build-icons.js
```

That regenerates the inlined block in `index.html` — the page must not fetch `icons/` at
runtime, because it has to work opened as a `file://` page where Chrome blocks that. `icons/`
is the source of truth; never hand-edit the generated block.

A manifest entry looks like:

```json
{ "file": "stars-solid-5.svg", "name": "Five stars, solid", "src": "Canva AI", "lic": "see Canva content licence" }
```

Add `"sw": 4.5` to override stroke weight. The default is `2 x min(width,height) / 24`, which
suits an icon drawn on a 24-unit grid. If you draw on a bigger grid with finer detail, that
default will be far too heavy and the strokes will merge into a blob — set `sw` yourself and
look at it.

## Check the licence before anything ships

Canva's Content Licence Agreement governs what you can do with Canva stock content on a
physical product you sell, and separately restricts using it in a logo. I am selling printed
cards to businesses, so this matters. Read the current terms and tell me what they say for:

1. Canva stock elements printed on a product sold to a client
2. AI-generated output from Canva's Magic tools used commercially

Note it per element in the manifest's `lic` field. If something is unclear, say so rather than
guessing — I would rather drop an element than find out later.

## Verify before committing

1. Open `index.html` from the repo root as a `file://` URL — that is how I use it
2. Library panel → the new element is in its category and its tile renders
3. Click it onto a card, then change the brand colour — the element should follow it.
   **If it renders as a solid coloured block, its background is not transparent**
4. Export a Card PDF and confirm it is still crisp at trim size
5. Check it at the smallest trim (85.6 x 54 mm credit card) — detail that reads on a 4x6 often
   turns to mud there

Then commit with a message saying which elements you added and which you rejected, and push
to `main`. GitHub Pages serves this repo, so the live page updates on push.

## Report honestly

If you generated twenty and only three were usable, say three and name them. Don't commit the
near-misses to pad the count. If Canva's export won't give you transparency on my plan, say so
plainly — that changes the whole approach and I need to know rather than get a folder of
white-background PNGs. And if an element looked fine in Canva but broke in the editor, tell me
what broke; that is usually a bug on my side worth fixing.
