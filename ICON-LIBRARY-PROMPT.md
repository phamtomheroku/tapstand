# Prompt: build the icon library for the tap stand editor

Copy everything below the line into a **new Claude Code session on your own machine** — one
with a browser and access to your local files. It is self-contained; the new session needs no
context from anywhere else.

---

## What you're doing

I run an editor at `https://github.com/phamtomheroku/tapstand` (single file, `index.html`) that
designs printed NFC "tap to leave a review" cards for local businesses. Two marks on the card
need an icon library instead of the one-at-a-time upload it has now:

1. **The tap mark** — the icon showing the gesture: a hand holding a phone, contactless waves,
   that sort of thing. This is the main visual on most cards.
2. **The platform mark** — the review platform's logo: Google, Yelp, TripAdvisor, Facebook.

Your job is to collect the image files and commit them in the exact layout below. The editor
already knows how to read that layout, so **there is no code to write** — this is purely
collecting files, converting them to spec, and committing.

## Where the files go

```
icons/
  manifest.json
  tap/
    hand-phone.svg
    waves.svg
    ...
  platform/
    google.svg
    yelp.svg
    ...
```

`manifest.json` is what the editor reads. Format:

```json
{
  "tap": [
    { "file": "hand-phone.svg", "name": "Hand holding phone" },
    { "file": "waves.svg",      "name": "Contactless waves" }
  ],
  "platform": [
    { "file": "google.svg", "name": "Google" },
    { "file": "yelp.svg",   "name": "Yelp" }
  ]
}
```

Order in the array is the order they appear in the library. Put the best one first in each
category — the first `tap` entry becomes the editor's default mark.

## The file spec — this part matters

The editor tints these with the business's brand colour by using the image as a **CSS mask**.
That only works on a file where the artwork is opaque and everything else is transparent. A
white background is not transparent, and it will render as a solid brand-coloured rectangle
instead of an icon. So:

**For `tap/` icons — SVG strongly preferred:**
- Single colour (or `currentColor`), no gradients, no embedded raster
- Stroked line art is fine; keep `stroke-linecap="round"` and `stroke-linejoin="round"`
- A tight `viewBox` around the artwork — no padding baked in, the editor handles spacing
- No `width`/`height` attributes on the root `<svg>` (the editor sets those)
- Under 10 KB each

**If SVG isn't available, transparent PNG:**
- Real alpha channel — check it, don't assume. A PNG saved from a white-background JPEG is
  still white, it just looks clean on a white page
- Roughly 600–900 px on the long edge, tight-cropped to the artwork
- Under 80 KB each

**For `platform/` logos:** these keep their own colours (the editor has a "keep its own colours"
toggle that is on by default for platform marks), so full-colour SVG or transparent PNG is fine.
Same transparency requirement.

## What to collect

**`tap/` — aim for 8–12.** I want variety in how the gesture is drawn, all in a consistent line
weight so they look like one set:
- Hand holding a phone with waves coming off the top (**this is the one I want first/default** —
  it's the clearest at small print sizes)
- Bare contactless/NFC waves, the standard EMV-style mark
- A phone on its own with waves
- A hand with a single finger tapping
- A phone tapping a card/surface
- Anything else in the same family that reads instantly at 15 mm

Good sources: **Noun Project**, **Flaticon**, **Iconoir**, **Lucide**, **Phosphor**, **Tabler
Icons**, **SVG Repo**. The last four are open-source icon sets (MIT/ISC) and are the safest
choice — free to use commercially, no attribution headaches. Prefer those where they have
something suitable.

**`platform/` — Google, Yelp, TripAdvisor, Facebook, plus any others you think are worth having.**

## One thing to get right on the platform logos

These are trademarks, and each platform publishes its own brand-asset page with the official
files and the rules for using them. Get them from there, not from a Google image search:

- Google: https://about.google/brand-resource-center/
- Yelp: https://www.yelp.com/brand
- TripAdvisor: https://tripadvisor.mediaroom.com/logo-guidelines
- Facebook/Meta: https://about.meta.com/brand/resources/

Two specific things worth knowing, because they affect what I can actually print:
- Google's brand permissions **do not cover third-party merchandise**. Using the G to say "leave
  us a Google review" on a card a business owns is generally fine as nominative use; putting it
  on a product I sell is a different question. Note in your summary what each platform's terms
  actually say so I can decide per platform.
- Several platforms require a minimum clear space and forbid recolouring their logo. That's why
  the editor keeps platform marks in their own colours by default.

If a logo's licence is unclear, **still commit it** but flag it in your summary as *unverified
licence* so I can pull it later.

## How to work

Use a real browser — most icon sites block plain `curl`.

**Check every file's transparency before committing.** This is the single most common failure
and it is invisible until it's on the card. Quick check in Node:

```js
// npm i sharp
const sharp = require('sharp');
sharp('icons/tap/hand-phone.png').stats().then(s => console.log('has alpha:', s.isOpaque === false));
```

Or in Python with Pillow: `Image.open(p).convert('RGBA').getchannel('A').getextrema()` — if that
returns `(255, 255)` the file is fully opaque and **will not work**.

**Verify before committing:**
1. Open `index.html` from the repo root in a browser
2. In the editor, click the tap mark layer → **Choose from library** → your icons should be there
3. Pick one, then change the brand colour — the icon should follow the brand colour
4. If an icon renders as a solid coloured block, its background isn't transparent — fix it

Then commit with a message listing what you added per category and push to `main`. GitHub Pages
serves this repo, so the live page updates on push.

## Report honestly

If you got 6 tap icons and not 12, say 6 and name them. If a platform's brand page requires an
account or a signed agreement you couldn't complete, say that rather than grabbing the logo from
elsewhere and calling it done. Do not generate or draw an icon to fill a gap — I would rather
have a short, real set.
