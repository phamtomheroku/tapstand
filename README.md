# Tap Stand

The physical side of an NFC tap-to-review product line: what to put the tag in, where to
buy it, and what goes on the printed face.

**→ [phamtomheroku.github.io/tapstand](https://phamtomheroku.github.io/tapstand/)**

One self-contained `index.html`. No build step, no dependencies, no network requests —
double-click it and it runs.

## What's in it

**15 holder bodies**, drawn as side elevations in their real materials — walnut, oak,
terrazzo, brass, clear and frosted acrylic, PVC. The profile is what decides how a phone
meets the face, so that's the view. Click any body for its full spec, the industries it
suits, and every supplier that carries it.

**An industry coverage matrix** — 14 verticals with placement and per-site volume. A café
buys two, a hotel buys forty; that's what decides which bodies are worth stocking.

**A layered insert editor.** Every element on the card is a layer: drag it anywhere, add
text layers, reorder, hide, lock. Two plates (stand insert and flat review card), four trim
sizes, brand colour and logo per client, and overlays for safe area, holder lip and the
30 mm NTAG213 disc drawn at true scale behind the tap ring.

**89 sourcing links** across 20 categories — tags, bodies, adhesives, machines, print shops,
compliance, competitors. Mark any link Shortlist / Ordered / Ruled out, keep notes against
each body, and export the lot as JSON.

## How it fits together

The destination never lives on the tag. Every tag holds one stable URL on your own domain,
and the server decides where it goes — so a client can rebrand, move, or switch the stand
from reviews to a menu without the hardware changing. That's also why every tag in a batch
is identical, which is what makes same-day activation possible.

## Adding photos

Drop a photo into `img/` named for its body (`slant-back.jpg`, `walnut-wedge.jpg`, …) and the
page swaps the drawing for the real thing automatically. See [`img/README.md`](img/README.md)
for the full filename list. Absent files change nothing, so a partial set is fine.

## Two rules this product respects

- **No review gating.** Every tap goes to the public review page. Steering unhappy customers
  to a private form breaks Google's policy and the FTC's 2024 rule on consumer reviews.
- **No Google logo.** "Leave us a Google review" is referential use and fine. Reproducing the
  four-colour G on merchandise isn't covered by Google's brand permissions.

Both are linked from the Sourcing section.

---

Related: the loyalty-pass side of this lives in [tapcard](https://github.com/phamtomheroku/tapcard).
