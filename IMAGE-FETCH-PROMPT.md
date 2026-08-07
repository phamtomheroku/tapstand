# Prompt: fetch product photos for the tap stand suite

Copy everything below the line into a **new Claude Code session on a machine with a browser**
(your laptop, or Claude Code on the web with Chromium). It is self-contained — the new session
needs no context from anywhere else.

---

## Task

Fetch one product photo for each of 15 holder bodies and commit them to a public GitHub repo.

**Repo:** `https://github.com/phamtomheroku/tapstand` — clone it if you don't have it.

**Where the images go:** the `img/` directory at the repo root, as `<slug>.jpg`.

The page (`index.html`) already looks for `img/<slug>.jpg` on load and swaps its line drawing for
the photo automatically. There is **no code to change** — this is purely a matter of putting
correctly-named files in the right folder. A missing file is fine; the drawing stays. So a partial
result is genuinely useful, and you should commit what you get rather than holding everything back
for the ones that failed.

## The 15 files

| Save as | What it is | Source page |
|---|---|---|
| `img/slant-back.jpg` | Clear cast acrylic slant-back sign holder, 4×6 portrait | https://dasherproducts.com/products/slant-back-acrylic-sign-holder-8-5-x-11-inches-premium-portrait-ad-frames-table-sign-display-holder-clear-easel-style-frame-plastic-brochure-holder-for-home-office-store-restaraunt-6-pack |
| `img/magnetic-block.jpg` | Two-slab magnetic acrylic block frame, 4×6, corner magnets | https://us.amazon.com/AMEITECH-Acrylic-Picture-Frameless-Magnetic/dp/B079GQT3JT |
| `img/curved-frosted.jpg` | Curved / bent acrylic countertop sign holder | https://www.displaysandholders.com/products/sign-holders-ad-frames/curved-sign-holders.html |
| `img/walnut-wedge.jpg` | Wood base with clear acrylic front panel | https://www.etsy.com/listing/1298393384/acrylic-menu-sign-holder-with-ashwood |
| `img/solid-block.jpg` | Solid wood block with a slot cut in the top holding a card | https://www.etsy.com/market/nfc_tap_stand |
| `img/terrazzo.jpg` | Terrazzo / speckled cast stone card holder | https://us.amazon.com/BAOHD-Terrazzo-Business-Handmade-Concrete/dp/B0D8PF1RGZ |
| `img/compact-square.jpg` | Small square/compact acrylic slant sign holder | https://buybulkdisplays.com/shop/acrylic-sign-holders/economy-slant-back-acrylic-sign-holders/ |
| `img/tap-card.jpg` | Printed PVC NFC card (CR80, 85.6 × 54 mm) | https://seritag.com/nfc-tags/cp-cards-ntag213 |
| `img/easel-back.jpg` | Picture frame with a hinged easel kickstand | https://www.displays2go.com/C-23684/Tabletop-Sign-Holders-Frames-Displays-Countertop-Use |
| `img/a-frame.jpg` | Double-sided A-frame acrylic table tent, 4×6 | https://www.amazon.com/Acrylic-Table-Tent-Menu-Holders/dp/B0018X00KI |
| `img/brass-pedestal.jpg` | Gold/brass weighted-base table sign or number holder | https://www.amazon.com/HOHIYA-Number-Holders-Wedding-Restaurants/dp/B0826XBJCR |
| `img/table-wedge.jpg` | Low-profile angled sign holder, or 3M VHB tape roll | https://www.amazon.com/3m-vhb-tape-double-sided/s?k=3m+vhb+tape+double+sided |
| `img/adhesive-card.jpg` | PVC NFC card, ideally shown adhered to a surface | https://seritag.com/nfc-tags/cp-cards-ntag213 |
| `img/bare-disc.jpg` | 30 mm round white NFC disc tag, on-metal PVC | https://seritag.com/nfc-tags/printed-om-pvc-disc |
| `img/wall-plaque.jpg` | Adhesive wall-mount acrylic sign holder, 4×6, no drilling | https://www.amazon.com/NIUBEE-Acrylic-Adhesive-Restaurant-Drilling/dp/B07DLTWHS6 |

## Image spec

- **JPEG**, named exactly as in the table
- Roughly **4:3 landscape**, about **800–1000 px** wide
- **Under 300 KB each** — the page has no lazy loading and there are 15 of them
- Crop to the product. No watermarks, no seller badges, no price overlays, no collage/multi-panel
  images, no lifestyle shots where the product is incidental
- A plain white or light background is ideal, since the page's cards sit on a light panel

## How to do it

Use a real browser — these sites block plain `curl` and most return 403 to non-browser agents.

1. Open the source page in Chrome (or Playwright/Chromium if you're driving it headlessly)
2. Find the main product image, open it at full resolution, save it
3. Convert/resize to the spec above (`sips` on macOS, ImageMagick `convert`, or `sharp` in Node)
4. Save into `img/` with the exact filename

If a source page is dead, gone, or the photo is unusable, **substitute freely** — search for the
same product type and take a better photo from any supplier. The filename and the product *category*
are what matter; nothing is tied to that specific listing. Note any substitutions in your summary.

## Verify before committing

Open `index.html` in a browser from the repo root and check:

- Each body that got a photo shows it instead of a line drawing, in the card grid
- Clicking that body shows the photo in the detail sheet too
- Bodies with no photo still show their drawing and look normal
- Nothing overflows or distorts — the slot is `aspect-ratio: 120/104` with `object-fit: cover`

Then commit with a message listing which slugs you filled and which you couldn't, and push to `main`.
GitHub Pages serves this repo, so the live page updates on push.

## Two things to get right

**Report honestly.** If you only got 9 of 15, say 9 of 15 and name the 6. Do not generate,
illustrate, or invent an image to fill a gap — a drawing is already the fallback and it is better
than a fake photo. Do not describe a file as saved unless it is on disk.

**This repo is public and served on GitHub Pages.** Merchant product photography is the seller's
copyrighted work, and republishing it on a public site is a different thing from saving it for
private reference. Prefer, in order: (1) manufacturer or supplier images where the supplier
explicitly permits reuse, (2) images the seller offers for affiliate/partner use, (3) anything
clearly licensed for reuse. If you can't establish that for a given image, still save it — but list
it in your summary as *unverified licence* so it can be swapped for an own-shot photo later.

The genuinely correct long-term answer is photographing the actual samples: own photos of own stock,
consistent background, no licensing question at all, and they show the product with the real printed
insert in it. Treat this fetch as a placeholder set.
