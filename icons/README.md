# icons/

Source of truth for the editor's icon library. `manifest.json` lists each category
in grid order; every entry names a file next to it.

```
node tools/build-icons.js
```

rewrites the generated `ICON_LIB` block inside `index.html` from this folder. The
page never loads anything from here at runtime — it can't, because it has to work
opened as a `file://` URL, where Chrome blocks `fetch()` of a sibling JSON and
refuses to load a sibling image as a CSS mask. Change a file here, run the build,
commit both.

**The first entry in `tap` is the editor's default mark.** Reorder the array to
change what every card gets out of the box.

## File rules

Everything in `tap/` and `motif/` is **tinted with the client's brand colour**.

- **SVG** is inlined, so the page sets its stroke colour and its stroke weight. Ship
  a tight `viewBox`, no `width`/`height` on the root, no gradients, no embedded
  raster. `currentColor` or nothing — the build rewrites `#000`. Stroke weight is
  stripped and re-applied at render so every icon reads at the same optical weight
  (2 units in a 24-unit box, scaled by the short side of whatever box it was drawn
  in). Under 10 KB.
- **Raster** is used as a **mask**, so only its alpha matters. It must be genuinely
  transparent. A white background is not transparency — it masks as a solid
  brand-coloured rectangle, and you won't notice until it's on the card. The build
  rejects an opaque white `<rect>` in an SVG but cannot see inside a PNG, so check
  it yourself:

  ```js
  sharp('icons/tap/whatever.png').stats().then(s => console.log('has alpha:', !s.isOpaque))
  ```

  ```python
  Image.open(p).convert('RGBA').getchannel('A').getextrema()   # (255, 255) means opaque — unusable
  ```

`platform/` entries carry `"asis": true` and keep their own colours, so full-colour
artwork is fine there. Same transparency requirement.

## Where these came from

| Set | Licence | Used for |
|---|---|---|
| [Lucide](https://lucide.dev) | ISC | tap marks, most decorations |
| [Tabler Icons](https://tabler.io/icons) | MIT | tap marks, decorations |
| [Iconoir](https://iconoir.com) | MIT | tap marks |
| Tap Stand | — | `tap/hand-phone`, `tap/phone-waves`, `tap/waves`, `tap/tap-mark.png` |

All three third-party sets are permissively licensed and free for commercial use.
Each entry records its origin in `manifest.json` (`src`, `lic`) and the editor shows
it on the tile's tooltip.

## platform/ — deliberately empty

No review-platform logo is committed here. Each platform's own brand terms rule out
a third party selling a printed card carrying their mark, and two of the three make
you accept an agreement to get the file at all:

- **Google** — Partner Marketing Hub, *How to show Google's brand*:
  "(In fact, no Google brand elements at all, including logos and product icons,
  should appear on your company's merchandise.)" and "Don't use the Google logo in
  marketing materials for a business or to imply endorsement from Google." The old
  public brand resource centre now redirects to a partner-gated hub.
- **Yelp** — <https://www.yelp.com/brand>: the licence over the logo files is
  "non-transferable", and Yelp says outright "This is not a trademark license". The
  ToS require "prior written consent" for any trademark use.
- **Meta / Facebook** — <https://www.meta.com/brand/resources/facebook/logo/>:
  "Facebook does not permit or license any of its assets for use on merchandise or
  other products, such as clothing, hats or mugs." The download is gated behind a
  checkbox accepting the guidelines.
- **Tripadvisor** — the guidelines live in a JavaScript asset-library app that could
  not be read; **not established either way**.

A business putting "review us on Google/Yelp" on its *own* counter card is a
different question from a vendor selling that card as a product — Yelp explicitly
names "marketing materials" and "in-store signage" as approved surfaces for its
badge. If you get written clearance, drop the file in `platform/`, add it to
`manifest.json` with `"asis": true`, and re-run the build.

Until then the editor's Platform logos set is empty and the lockup falls back to the
plain word, or to whatever file the user drops into the well themselves.
