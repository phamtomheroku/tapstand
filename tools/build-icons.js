#!/usr/bin/env node
/* Rewrites the generated icon-library block inside index.html from icons/.
 *
 *   node tools/build-icons.js
 *
 * icons/ is the source of truth: manifest.json lists each category in grid
 * order, and every entry names a file next to it. The block is INLINED into
 * index.html rather than fetched at runtime because the editor has to work
 * when it is opened as a file:// page, where Chrome blocks fetch() of a
 * sibling JSON — and where a CSS mask will not load a sibling image either,
 * even though an <img> will.
 *
 * No dependencies. Node 14+.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ICONS = path.join(ROOT, 'icons');
const PAGE = path.join(ROOT, 'index.html');
const OPEN = '/* === ICON LIBRARY: GENERATED — do not edit by hand === */';
const CLOSE = '/* === END ICON LIBRARY === */';

const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg',
               '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

function die(msg) { console.error('build-icons: ' + msg); process.exit(1); }

/* Every icon is drawn at the same optical weight regardless of the box it was
   authored in: 2 units of stroke in a 24-unit box. Scale by the SHORT side —
   a 124x100 mark was drawn against its 100, not its 124. */
function houseWeight(w, h) { return +(2 * Math.min(w, h) / 24).toFixed(2); }

function readVector(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const vb = (raw.match(/viewBox="([^"]+)"/) || [])[1];
  if (!vb) die(path.basename(file) + ' has no viewBox — add a tight one, no width/height');
  const n = vb.trim().split(/[\s,]+/).map(Number);
  if (n.length !== 4 || n.some(isNaN)) die(path.basename(file) + ' has a malformed viewBox');
  const w = n[2], h = n[3];

  let body = raw.replace(/<!--[\s\S]*?-->/g, '')
                .replace(/^[\s\S]*?<svg[^>]*>/, '')
                .replace(/<\/svg>[\s\S]*$/, '')
                .replace(/\s+/g, ' ')
                .trim();

  /* A white background is not transparency. As a mask it would print as a solid
     brand-coloured rectangle, and you would not notice until it was on the card. */
  const opaqueBox = new RegExp(
    '<rect[^>]*\\bfill="(#fff|#ffffff|white)"[^>]*>', 'i');
  if (opaqueBox.test(body)) die(path.basename(file) + ' has an opaque white <rect> behind the art');
  if (/<image[\s>]/i.test(body)) die(path.basename(file) + ' embeds a raster image — trace it or ship it as a PNG');
  if (/<(linearGradient|radialGradient)[\s>]/i.test(body)) die(path.basename(file) + ' uses a gradient — flatten it to one colour');

  /* Does this file carry its own paint? The house treatment supplies fill:none
     and stroke:currentColor on the root, which is exactly what a stroked
     line-art icon needs and would wreck a full-colour logo. Only a file with
     real colours in it can be rendered as-is — a stroked one rendered bare gets
     the SVG default of solid black fill and turns into a blob. */
  const own = /\b(fill|stroke)="(?!none|currentColor)[^"]+"/i.test(body);

  return { vb, w, h, body, own };
}

function readRaster(file) {
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext];
  if (!mime) die(path.basename(file) + ' is not an image this build understands');
  const buf = fs.readFileSync(file);
  return { u: 'data:' + mime + ';base64,' + buf.toString('base64'), bytes: buf.length };
}

/* PNG dimensions straight out of the IHDR chunk, so an entry gets a real aspect
   ratio without pulling in an image library. */
function pngSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47)
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  return null;
}

const manifestPath = path.join(ICONS, 'manifest.json');
if (!fs.existsSync(manifestPath)) die('icons/manifest.json is missing');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const out = [];
const report = [];
const seen = Object.create(null);

for (const cat of Object.keys(manifest)) {
  const rows = manifest[cat] || [];
  const lines = [];
  for (const item of rows) {
    if (!item || !item.file) die('an entry in "' + cat + '" has no "file"');
    const file = path.join(ICONS, cat, item.file);
    if (!fs.existsSync(file)) die('icons/' + cat + '/' + item.file + ' is listed in the manifest but not on disk');

    const id = item.id || item.file.replace(/\.[^.]+$/, '');
    const key = cat + '/' + id;
    if (seen[key]) die('duplicate id "' + id + '" in "' + cat + '"');
    seen[key] = true;

    const e = { id: id, n: item.name || id };
    if (path.extname(file).toLowerCase() === '.svg') {
      const v = readVector(file);
      e.vb = v.vb;
      e.sw = item.sw != null ? item.sw : houseWeight(v.w, v.h);
      e.ar = +(v.w / v.h).toFixed(3);
      e.p = v.body;
      if (v.own) e.own = 1;
      if (v.body.length > 10240) console.warn('  ! ' + key + ' is over 10 KB of markup');
    } else {
      const r = readRaster(file);
      const dim = pngSize(fs.readFileSync(file));
      e.ar = item.ar != null ? item.ar : (dim ? +(dim.w / dim.h).toFixed(3) : 1);
      e.u = r.u;
      if (r.bytes > 81920) console.warn('  ! ' + key + ' is over 80 KB');
    }
    if (item.src) e.from = item.src;
    if (item.lic) e.lic = item.lic;
    if (item.asis) e.asis = 1;

    lines.push(JSON.stringify(e));
  }
  out.push(JSON.stringify(cat) + ':[\n' + lines.join(',\n') + ']');
  report.push(cat + ' ' + rows.length);
}

const block =
  OPEN + '\n' +
  '/* Regenerate with: node tools/build-icons.js   (source of truth: icons/) */\n' +
  'var ICON_LIB={' + out.join(',\n') + '};\n' +
  CLOSE;

let page = fs.readFileSync(PAGE, 'utf8');
const a = page.indexOf(OPEN);
const b = page.indexOf(CLOSE);
if (a < 0 || b < 0 || b < a)
  die('index.html has no generated block — it must contain the two marker comments');

page = page.slice(0, a) + block + page.slice(b + CLOSE.length);
fs.writeFileSync(PAGE, page);
console.log('build-icons: ' + report.join(', ') + '  ->  ' +
  (Buffer.byteLength(block) / 1024).toFixed(1) + ' KB inlined');
