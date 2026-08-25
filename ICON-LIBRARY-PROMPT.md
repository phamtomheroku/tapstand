# Prompt: build the icon library — UI and content

Copy everything below the line into a **new Claude Code session on your own machine**, in a
clone of `https://github.com/phamtomheroku/tapstand`. It is self-contained; the new session
needs no context from anywhere else.

---

## The project

`index.html` in this repo is a single-file editor (no build step, no server — you open the file
in a browser) that designs printed NFC "tap to leave a review" cards for local businesses. All
the JS is one `<script>` at the bottom, wrapped in `(function(){ "use strict"; ... })()`, so
nothing is on `window`. Edit that file in place.

**Non-negotiables:**
- Stays a single self-contained file — no bundler, no npm deps in the page, no CDN scripts
- Works opened as `file://`, not just over http
- Don't break the existing PDF export, which prints the card at exact trim size

## What I want built

Two marks on the card currently accept a one-at-a-time file upload. I want a proper **icon
library** behind both, plus the icon content to fill it.

1. **The tap mark** — the icon showing the gesture (hand holding a phone, contactless waves).
   This is the main visual on most cards.
2. **The platform mark** — the review platform's logo (Google, Yelp, TripAdvisor, Facebook).

### The interaction I want

- I click a layer on the card. Its controls appear in the **inspector** panel (already exists,
  built by `drawInspector()`, renders into `#inspector`).
- At the **top of that inspector**, for a layer that takes an icon, there's a **“Choose from
  library”** button. Top, not buried under the sliders — it's the first thing I reach for.
- Clicking it opens a **modal over the whole screen**: background dimmed and blurred, the icon
  grid centred, and an **× in the top-right corner** to close.
- The grid shows **only the icons for that layer's category**. Tap-mark layer → tap icons only.
  Lockup/platform layer → platform logos only. I don't want to scroll past Yelp to find a hand.
- Click an icon → it applies to the layer and the modal closes.
- Esc closes it. Clicking the dimmed backdrop closes it. Focus returns to the button.

### Wire it into what's already there

Read these before writing anything — the patterns to copy already exist in the file:

| What | Where |
|---|---|
| Existing modal (holder detail) | `.modal` / `.mbd` / `.mx` CSS, `#modal` markup, `openHolder()` / `closeHolder()` |
| Inspector for the selected layer | `function drawInspector()`, renders into `#inspector` |
| Current tap-icon picker (replace this) | the `<select id="iIcon">` inside `drawInspector()` |
| Built-in tap icons | `var TAP_ICONS = {...}` plus `var ICON_W = {...}` for per-icon aspect |
| How a mark gets drawn/tinted | `function tapArt(w,h)` inside `bodyHTML()`'s `case 'tap'` |
| Platform mark state | `S.platImg`, `S.platImgMode` (`'asis'` or `'tint'`), used in `case 'lockup'` |
| Tap mark state | `S.tapImg`, `S.tapImgMode` |
| Re-render after a change | call `paint()` |

The existing modal already does dim + `backdrop-filter: blur(2px)` and has the `.mx` close
button styled in the top-right — reuse that CSS rather than inventing a second look. Build a
**separate** modal element for the library though; don't overload `#modal`, it's the holder
sheet and has its own open/close logic.

Match the existing visual language: mono uppercase labels at ~10px with letter-spacing, hairline
`var(--rule)` borders, `var(--accent)` on hover/active, square-ish 2–3px radii. The file has all
of these as CSS variables already.

### Also add

- **Upload into the library**, per category — so a file I drop becomes a permanent tile in that
  category's grid, not just a one-shot replacement. In-memory for the session is fine.
- The current single-upload wells (`#tapDrop`, `#platDrop`) should keep working.
- **Save/load round-trip:** `$('saveDesign')` writes a JSON blob and the loader reads it back.
  If a layer now references a library icon, that reference has to survive the round-trip. Look
  at the object literal in the `saveDesign` click handler and add whatever you need.

## The icon content

Files go in this layout, and the library reads `manifest.json`:

```
icons/
  manifest.json
  tap/hand-phone.svg
  tap/waves.svg
  platform/google.svg
  platform/yelp.svg
```

```json
{
  "tap": [
    { "file": "hand-phone.svg", "name": "Hand holding phone" },
    { "file": "waves.svg",      "name": "Contactless waves" }
  ],
  "platform": [
    { "file": "google.svg", "name": "Google" }
  ]
}
```

Array order is grid order. **First `tap` entry becomes the editor's default mark** — put the
hand-holding-a-phone one first, it's the clearest at small print sizes.

Because this must also work on `file://`, where `fetch()` of a local JSON is blocked in Chrome:
inline the manifest and the icon SVG source **into `index.html` as the built-in set**, and treat
the `icons/` folder as the source of truth you regenerate from. A small script that reads
`icons/` and rewrites the generated block in `index.html` is the clean way to do this — your
call on the exact mechanism, but the page must not depend on loading a sibling file at runtime.
There's precedent in the file: the current default tap mark is embedded as a base64 data URI
with a comment explaining that a CSS mask won't load a `file://` sibling even though `<img>`
will.

### File spec — this part is the one that bites

The editor tints the tap mark with the business's brand colour by using the image as a **CSS
mask**. That only works when the artwork is opaque and everything else is transparent. **A white
background is not transparency** — it will render as a solid brand-coloured rectangle instead of
an icon, and you won't notice until it's on the card. I already lost time to exactly this.

**`tap/` icons — SVG strongly preferred:**
- Single colour or `currentColor`; no gradients, no embedded raster
- Stroked line art is fine — keep `stroke-linecap="round"`, `stroke-linejoin="round"`
- Tight `viewBox`, no baked-in padding; no `width`/`height` on the root `<svg>`
- Under 10 KB each

**Transparent PNG only if no SVG exists:** real alpha channel (verify it), 600–900 px long edge,
tight-cropped, under 80 KB.

**`platform/` logos** keep their own colours (there's a "keep its own colours" toggle, on by
default for platform marks), so full-colour SVG or transparent PNG is fine. Same transparency
requirement.

### What to collect

**`tap/` — 8 to 12**, all in a consistent line weight so they read as one set:
- Hand holding a phone with waves off the top ← **first, this is the default**
- Bare contactless/NFC waves (the standard EMV-style mark)
- A phone on its own with waves
- A hand with one finger tapping
- A phone tapping a card or surface
- Anything else in the same family that reads instantly at 15 mm tall

Prefer the open-source icon sets — **Lucide, Phosphor, Tabler, Iconoir** (MIT/ISC, commercially
free, consistent weight within a set). Fall back to Noun Project / Flaticon / SVG Repo only if
those don't have something suitable.

**`platform/` — Google, Yelp, TripAdvisor, Facebook**, plus any others worth having.

## The trademark question — get this right

Platform logos are trademarks. Pull them from each platform's own brand-asset page, not from an
image search:

- Google: https://about.google/brand-resource-center/
- Yelp: https://www.yelp.com/brand
- TripAdvisor: https://tripadvisor.mediaroom.com/logo-guidelines
- Facebook/Meta: https://about.meta.com/brand/resources/

Two things that actually affect what I can print, so **report what each platform's terms say**
rather than assuming:
- Google's brand permissions **do not cover third-party merchandise**. A business putting "leave
  us a Google review" on their own counter card is one thing; me selling that card as a product
  is a different question.
- Several platforms require minimum clear space and forbid recolouring. That's why platform
  marks default to keeping their own colours.

If a licence is unclear, **still commit the file** but flag it in your summary as *unverified
licence* so I can pull it later.

## How to work

Use a real browser — most icon sites block plain `curl`.

**Check every file's transparency before committing.** In Node with `sharp`:
```js
sharp('icons/tap/hand-phone.png').stats().then(s => console.log('has alpha:', !s.isOpaque));
```
In Python with Pillow: `Image.open(p).convert('RGBA').getchannel('A').getextrema()` — if that
returns `(255, 255)` the file is fully opaque and **will not work as a mask**.

**Verify in the actual editor before you commit:**
1. Open `index.html` from the repo root in a browser — as a `file://` URL, since that's how I use it
2. Click the tap ring on the card → the inspector shows **Choose from library** at the top
3. Click it → modal opens, backdrop dimmed and blurred, × top-right, tap icons only
4. Pick one → it applies and the modal closes
5. Change the brand colour → the icon follows the brand colour. **If it renders as a solid
   coloured block, that file's background isn't transparent**
6. Click the lockup layer → Choose from library → platform logos only, no tap icons
7. Esc closes; clicking the backdrop closes
8. Save the design, reload the page, load the JSON back → the library icon is still there
9. Export a Card PDF and confirm the icon is in it at the right size

Then commit and push to `main`. GitHub Pages serves this repo, so the live page updates on push.

## Report honestly

If you got 6 tap icons and not 12, say 6 and name them. If a platform's brand page needs an
account or a signed agreement you couldn't complete, say that rather than grabbing the logo
elsewhere and calling it done. Don't generate or hand-draw an icon to fill a gap — I'd rather
have a short real set than a padded one. And if something in the editor fought you, say what,
rather than working around it silently.
