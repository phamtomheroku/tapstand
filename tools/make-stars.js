#!/usr/bin/env node
/* Generates the star-row elements in icons/motif/.
 *
 *   node tools/make-stars.js
 *
 * Every review card wants a row of stars and the library had none, so they are
 * drawn here rather than sourced: a five-pointed star is exact geometry, and a
 * generated vector tints cleanly, stays a couple of KB and prints crisp at any
 * trim. Raster stars keyed off a white background would do none of that.
 *
 * Two fills, because the library renders them two different ways:
 *   solid   -- the path carries fill="currentColor" stroke="none", so it ignores
 *              the house fill:none/stroke:currentColor treatment and reads as a
 *              filled mark.
 *   outline -- the path carries NO paint at all, so it inherits the house
 *              treatment exactly like the Lucide/Tabler icons already in the set.
 * Neither trips build-icons.js's `own` test, which only fires on paint that is
 * something other than none/currentColor — so both stay tintable.
 *
 * No dependencies. Node 14+.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'icons', 'motif');

const R = 12;                       // outer radius, on a 24-unit grid
const r = R * 0.382;                // inner radius: the pentagram ratio
const N = 5;                        // points on the star

function starPoints(cx, cy) {
  const pts = [];
  for (let i = 0; i < N * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = (-90 + i * (360 / (N * 2))) * Math.PI / 180;
    pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
  }
  return pts;
}

/* Sutherland-Hodgman against a vertical line, so the half star is a real polygon
   rather than a clipPath. A clipPath would need an id, and several of these can
   be inlined into one page at once — colliding ids would silently clip the wrong
   mark. */
function clipLeftOf(pts, xMax) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], prev = pts[(i + pts.length - 1) % pts.length];
    const curIn = cur[0] <= xMax, prevIn = prev[0] <= xMax;
    if (curIn !== prevIn) {
      const t = (xMax - prev[0]) / (cur[0] - prev[0]);
      out.push([xMax, prev[1] + t * (cur[1] - prev[1])]);
    }
    if (curIn) out.push(cur);
  }
  return out;
}

const n = v => (Math.round(v * 1000) / 1000).toString();
const poly = pts => 'M' + pts.map(p => n(p[0]) + ' ' + n(p[1])).join('L') + 'Z';

function bbox(all) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  all.forEach(p => {
    if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
    if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
  });
  return { x0, y0, x1, y1 };
}

/* count: how many stars. half: draw the LAST one half filled. gap: units between
   star bounding boxes. solid: filled vs line art. */
function row(count, opts) {
  opts = opts || {};
  const gap = opts.gap == null ? 6 : opts.gap;
  const solid = !!opts.solid;
  const half = !!opts.half;

  const step = 2 * R * Math.sin(72 * Math.PI / 180) + gap;   // star width + gap
  const centres = [];
  for (let i = 0; i < count; i++) centres.push(24 + i * step);

  const every = centres.map(cx => starPoints(cx, 24));
  const b = bbox([].concat.apply([], every));
  // an outline needs room for its stroke; a half row carries one outlined star
  const pad = (solid && !half) ? 0.4 : 1.6;
  const vb = [b.x0 - pad, b.y0 - pad, (b.x1 - b.x0) + pad * 2, (b.y1 - b.y0) + pad * 2];

  const paint = solid
    ? ' fill="currentColor" stroke="none"'
    : '';                                  // inherit the house treatment
  const body = [];
  every.forEach((pts, i) => {
    const last = i === count - 1;
    if (half && last) {
      // the outline of the whole star, then a solid left half sitting inside it
      body.push('<path d="' + poly(pts) + '"/>');
      body.push('<path d="' + poly(clipLeftOf(pts, centres[i])) +
                '" fill="currentColor" stroke="none"/>');
    } else {
      body.push('<path d="' + poly(pts) + '"' + paint + '/>');
    }
  });

  return '<svg viewBox="' + vb.map(n).join(' ') + '" xmlns="http://www.w3.org/2000/svg">' +
         body.join('') + '</svg>\n';
}

const FILES = [
  ['stars-solid-5.svg',        row(5, { solid: true })],
  ['stars-solid-5-tight.svg',  row(5, { solid: true, gap: 2 })],
  ['stars-outline-5.svg',      row(5, {})],
  ['stars-outline-5-tight.svg',row(5, { gap: 2 })],
  // four solid and a half — the rating everyone actually recognises
  ['stars-half-5.svg',         row(5, { solid: true, half: true })],
  ['stars-solid-4.svg',        row(4, { solid: true })],
  ['star-single.svg',          row(1, { solid: true })],
  ['star-single-outline.svg',  row(1, {})],
];

FILES.forEach(([name, svg]) => {
  fs.writeFileSync(path.join(OUT, name), svg);
  console.log('  ' + name + '  ' + svg.length + ' bytes');
});
console.log('make-stars: wrote ' + FILES.length + ' files to icons/motif/');
