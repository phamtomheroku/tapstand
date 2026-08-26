/* Functional test for the icon library.
 *
 *   node tools/test-icons.js
 *
 * There is no browser here: the page's <script> is stripped of its IIFE wrapper
 * and run against a stub DOM, so its internals can be called directly. This
 * cannot tell you the modal LOOKS right — open the page for that — but it does
 * check the things a big single-file edit actually breaks: reference resolution,
 * legacy saves still opening, every shipped icon being tintable and mask-safe,
 * and the save/load round-trip carrying an added tile. No dependencies. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.resolve(__dirname,'..','index.html'), 'utf8');
let code = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
code = code.replace(/^\s*\(function\(\)\{\s*/, '').replace(/\}\)\(\);\s*$/, '');

const RECT = { left: 0, top: 0, width: 400, height: 600, right: 400, bottom: 600, x: 0, y: 0 };
const cache = new Map();
function el(tag, id) {
  const node = {
    tagName: (tag || 'div').toUpperCase(), id: id || '',
    /* paint() sets the whole wrapper in one cssText string now, so the stub has to
       parse it — otherwise the tests are blind to everything a layer is given. */
    style: new Proxy({
      _props: {},
      setProperty(k, v) { this._props[k] = v },
      removeProperty(k) { delete this._props[k] },
      getPropertyValue(k) { return this._props[k] || '' },
    }, {
      get: (t, k) => (k in t ? t[k] : ''),
      set: (t, k, v) => {
        t[k] = v;
        if (k === 'cssText') String(v).split(';').forEach((d) => {
          const c = d.indexOf(':'); if (c < 0) return;
          const prop = d.slice(0, c).trim(), val = d.slice(c + 1).trim();
          if (!prop) return;
          t._props[prop] = val;
          t[prop.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase())] = val;
        });
        return true;
      },
    }),
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false } },
    dataset: {}, children: [], options: [], files: [],
    value: '', textContent: '', innerHTML: '', checked: false, hidden: true,
    appendChild(c){ this.children.push(c); return c },
    removeChild(){}, remove(){}, addEventListener(){}, removeEventListener(){},
    setAttribute(){}, getAttribute(){ return null }, removeAttribute(){},
    focus(){}, blur(){}, click(){}, querySelector(){ return null }, querySelectorAll(){ return [] },
    closest(){ return null }, contains(){ return false }, matches(){ return false },
    getBoundingClientRect(){ return RECT }, setPointerCapture(){}, add(o){ this.options.push(o) },
  };
  return node;
}
function byId(id) { if (!cache.has(id)) cache.set(id, el('div', id)); return cache.get(id) }

// seed the fields paint() actually reads
byId('bname').value = 'Ridgeline Coffee';
byId('brand').value = '#B4577A';
byId('bg').value = '#FBF8F6';
byId('starCol').value = '#B4577A';
byId('starSync').checked = true;
byId('autoFit').checked = true;
byId('copy').value = 'How did we do?';

const document = {
  documentElement: el('html'), body: el('body'), head: el('head'), title: '',
  fonts: { add(){}, ready: Promise.resolve() },
  createElement: (t) => el(t), createElementNS: (n, t) => el(t),
  createTextNode: () => el('#text'), createDocumentFragment: () => el('#f'),
  getElementById: byId, querySelector: () => el('div'), querySelectorAll: () => [],
  addEventListener(){}, removeEventListener(){}, contains(){ return true },
};
class FR { readAsText(){} readAsDataURL(){} }
const win = {
  document, location: { protocol: 'file:', href: 'file:///x', hash: '', search: '' },
  navigator: { userAgent: 'node', clipboard: {} },
  matchMedia: () => ({ matches: false, addEventListener(){}, addListener(){} }),
  getComputedStyle: () => new Proxy({ getPropertyValue: () => '' }, { get: (t, k) => (k in t ? t[k] : '') }),
  requestAnimationFrame: (f) => { f(0); return 1 }, cancelAnimationFrame(){},
  setTimeout(){ return 1 }, clearTimeout(){}, setInterval(){ return 1 }, clearInterval(){},
  addEventListener(){}, removeEventListener(){}, print(){}, alert(){},
  devicePixelRatio: 1, innerWidth: 1200, innerHeight: 900,
  FileReader: FR, FontFace: function(){ this.load = () => Promise.resolve(this) },
  Image: function(){ return el('img') }, Blob: function(){ return {} },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL(){} },
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  Option: function (t, v) { return { text: t, value: v == null ? t : v } },
  localStorage: (() => { const m = {}; return {
    getItem: (k) => (k in m ? m[k] : null), setItem(k, v) { m[k] = String(v) },
    removeItem(k) { delete m[k] } } })(),
  console,
};
win.window = win; win.self = win;
win.unescape = (s) => decodeURIComponent(s);
const C = vm.createContext(win);
vm.runInContext(code, C, { filename: 'page', timeout: 20000 });

/* paint() clears real .lay nodes via querySelectorAll, which the stub cannot do —
   so tests clear card.children themselves through draw(). And breakLockup measures
   the two halves off the DOM, so give it two halves with rects it can measure. */
byId('card').querySelector = function (sel) {
  if (sel.indexOf('data-id') < 0) return null;
  return {
    querySelector: (s) => ({
      getBoundingClientRect: () => s.indexOf('logo') > 0
        ? { left: 40, top: 100, width: 80, height: 30, right: 120, bottom: 130 }
        : { left: 160, top: 100, width: 60, height: 30, right: 220, bottom: 130 },
    }),
  };
};

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name) }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  <- ' + extra : '')) }
}

console.log('\n== library shape ==');
ok('tap set non-empty', C.libSet('tap').length === 13, C.libSet('tap').length);
ok('motif set non-empty', C.libSet('motif').length === 59, C.libSet('motif').length);
ok('platform set empty', C.libSet('platform').length === 0);
ok('default tap mark is hand-phone', C.libSet('tap')[0].id === 'hand-phone');

console.log('\n== reference resolution ==');
ok('lib: prefix', C.libRef('lib:nfc-arcs', 'tap').id === 'nfc-arcs');
ok('bare legacy id "waves"', C.libRef('waves', 'tap').id === 'waves');
ok('legacy alias "phone"', C.libRef('phone', 'tap').id === 'phone-waves');
ok('legacy alias "hand"', C.libRef('hand', 'tap').id === 'hand-phone');
ok('legacy motif "coffee"', C.libRef('coffee', 'motif').id === 'coffee');
ok('legacy motif "none" -> nothing', C.libRef('none', 'motif') === null);
ok('empty -> nothing', C.libRef('', 'tap') === null);
ok('wrong category -> nothing', C.libRef('coffee', 'tap') === null);
ok('empty tap icon falls back to first entry',
   C.tapEntry({ icon: '' }).id === 'hand-phone');
ok('unknown id falls back to first entry',
   C.tapEntry({ icon: 'lib:nope' }).id === 'hand-phone');

console.log('\n== rendering ==');
const art = C.libArt(C.libGet('tap', 'nfc-arcs'), '#B4577A', 'width:11cqw;height:11cqw');
ok('vector renders an svg', /^<svg /.test(art));
ok('vector carries its viewBox', art.indexOf('viewBox="0 0 24 24"') > 0);
ok('vector is tinted', art.indexOf('color:#B4577A') > 0);
ok('vector overrides .tapring stroke-width inline', /stroke-width:2[;"]/.test(art));
ok('vector has round caps', art.indexOf('stroke-linecap:round') > 0);
const heavy = C.libArt(C.libGet('tap', 'hand-phone'), '#000', 'width:1cqw;height:1cqw');
ok('100-unit mark keeps its own weight', /stroke-width:8.33[;"]/.test(heavy));
const raster = C.libArt(C.libGet('tap', 'tap-mark'), '#B4577A', 'width:11cqw;height:11cqw');
ok('raster is masked, not an img', raster.indexOf('mask:url(') > 0 && raster.indexOf('<img') < 0);
ok('raster mask takes the brand colour', raster.indexOf('background:#B4577A') > 0);
// asking line art to render as-is is refused — bare paths default to solid black
const asis = C.libArt(C.libGet('tap', 'nfc-arcs'), '#B4577A', 'width:1cqw', true);
ok('as-is is ignored for line art, which has no paint of its own',
   asis.indexOf('stroke:currentColor') > 0);
const asisR = C.libArt({ u: 'data:image/png;base64,AAA', ar: 1 }, '#B4577A', 'width:1cqw', true);
ok('but a raster as-is is an img, not a mask',
   asisR.indexOf('<img') === 0 && asisR.indexOf('mask') < 0);

console.log('\n== every shipped icon is mask-safe and tintable ==');
let opaque = 0, untinted = 0;
for (const cat of ['tap', 'motif']) for (const e of C.libSet(cat)) {
  if (!e.p) continue;
  if (/<rect[^>]*fill="(#fff|#ffffff|white)"/i.test(e.p)) { opaque++; console.log('   opaque bg:', e.id) }
  const s = C.libArt(e, '#123456', 'width:1cqw');
  if (s.indexOf('color:#123456') < 0) { untinted++; console.log('   untinted:', e.id) }
}
ok('no opaque white backgrounds', opaque === 0);
ok('every vector takes the tint', untinted === 0);

console.log('\n== the card actually paints ==');
C.S.sel = null;
C.paint();
const card = byId('card');
const drawn = card.children.map(c => c.innerHTML).join('\n');
ok('paint produced layers', card.children.length > 0, card.children.length);
ok('tap ring rendered with a mark', drawn.indexOf('tapring') > 0);
ok('the default mark is in the paint', /viewBox="0 0 100 120"/.test(drawn));

console.log('\n== switching a mark ==');
const tapL = C.S.stack.filter(L => L.k === 'tap')[0];
ok('found a tap layer', !!tapL);
tapL.icon = 'lib:contactless';
card.children.length = 0; C.paint();
ok('picked mark shows up',
   card.children.map(c => c.innerHTML).join('').indexOf('M15 21.5C19 16 19 8 15 2.5') > 0);
ok('ring width follows the icon aspect', C.tapAR(tapL) === C.libGet('tap', 'contactless').ar);

console.log('\n== decorations ==');
const deco = { t: 'box', k: 'motif', x: .8, y: .2, s: .7, g: 'lib:pizza', _man: true };
C.layerId(deco); C.S.stack.push(deco);
card.children.length = 0; C.paint();
let html2 = card.children.map(c => c.innerHTML).join('');
ok('decoration renders', html2.indexOf('viewBox="0 0 24 24"') > 0);
deco.c = 'accent';
card.children.length = 0; C.paint();
ok('decoration recolours without throwing', card.children.length > 0);
ok('a missing decoration renders nothing, not a crash',
   (deco.g = 'lib:does-not-exist', card.children.length = 0, C.paint(), true));
deco.g = 'lib:pizza';

console.log('\n== save / load round-trip ==');
C.libUser.motif.push({ id: 'u99-my-mark', n: 'My mark', from: 'Yours', lic: 'yours',
                       vb: '0 0 24 24', sw: 2, ar: 1, p: '<path d="M2 2h20v20H2z"/>' });
deco.g = 'lib:u99-my-mark';
C.S.platLib = null;
const blob = { v: 1, stack: C.S.stack, dir: C.S.dir, plate: C.S.plate, theme: C.S.theme,
  pal: C.S.pal, fmt: C.S.fmt, name: 'x', copy: '', brand: '#B4577A', bg: '#fff',
  logo: null, userFonts: [], dispFont: '', bodyFont: '',
  platImg: null, platImgMode: 'asis', platLib: null,
  tapImg: null, tapImgMode: 'tint', iconLib: C.libUser, starCol: null };
const round = JSON.parse(JSON.stringify(blob));
ok('added tile survives JSON', round.iconLib.motif.some(e => e.id === 'u99-my-mark'));
ok('layer reference survives JSON',
   round.stack.some(L => L.k === 'motif' && L.g === 'lib:u99-my-mark'));
// simulate the loader restoring the added tiles, then resolving the reference
C.libUser.motif = round.iconLib.motif.slice();
ok('reference resolves after restore', C.libRef('lib:u99-my-mark', 'motif').n === 'My mark');
let maxUid = 0;
round.iconLib.motif.forEach(e => { const n = parseInt(String(e.id).slice(1), 10); if (n > maxUid) maxUid = n });
ok('uid counter recovers past added ids', maxUid === 99, maxUid);

console.log('\n== platform lockup ==');
C.libUser.platform.push({ id: 'u1-fake', n: 'Fake', asis: 1, vb: '0 0 24 24',
                          sw: 2, ar: 2.5, p: '<path fill="#4285F4" d="M1 1h22v10H1z"/>' });
C.setPlatLib('u1-fake');
ok('platLib set', C.S.platLib === 'u1-fake');
let lock = C.S.stack.filter(L => L.k === 'lockup')[0];
if (!lock) { lock = { t: 'box', k: 'lockup', x: .5, y: .3, s: 1, word: 'Google' };
             C.layerId(lock); C.S.stack.push(lock) }
if (lock) {
  card.children.length = 0; C.paint();
  html2 = card.children.map(c => c.innerHTML).join('');
  ok('platform logo lands in the lockup', html2.indexOf('#4285F4') > 0);
  ok('platform logo keeps its own colours', html2.indexOf('stroke:currentColor') < 0 ||
     html2.indexOf('fill="#4285F4"') > 0);
} else { console.log('  --   no lockup layer in this plate; skipped'); }
C.setPlatImg('data:image/png;base64,AAA');
ok('dropping a file clears the library pick', C.S.platLib === null);

console.log('\n== legacy save opens ==');
const legacy = { stack: [{ t: 'box', k: 'tap', x: .5, y: .5, s: 1, cap: 'TAP', icon: 'waves' },
                         { t: 'box', k: 'motif', x: .2, y: .3, s: 1, g: 'coffee' }] };
C.S.stack = legacy.stack; C.S.sel = null;
card.children.length = 0; C.paint();
html2 = card.children.map(c => c.innerHTML).join('');
ok('legacy tap icon still draws', /viewBox="0 0 100 100"/.test(html2));
ok('legacy motif still draws', html2.indexOf('M10 2v2') > 0);

console.log('\n== the ring, and the mark inside it ==');
function ringOf(h) { const m = h.match(/class="tapring" style="width:([\d.]+)cqw/); return m && +m[1] }
function markOf(h) { const m = h.match(/viewBox="0 0 100 100"[\s\S]*?width:([\d.]+)cqw/); return m && +m[1] }
function draw() { card.children.length = 0; C.paint(); return card.children.map(c => c.innerHTML).join('') }
const tapL2 = { t: 'box', k: 'tap', x: .5, y: .5, s: 1, cap: 'TAP', icon: 'lib:waves' };
C.layerId(tapL2); C.S.stack = [tapL2]; C.selectOnly(null);
let out = draw();
ok('no circle unless it is asked for', ringOf(out) === null && out.indexOf('border:none') > 0);
ok('the mark still renders without one', markOf(out) > 0);

tapL2.ring = 'circle';
out = draw();
ok('picking a ring brings the circle back', ringOf(out) > 0);
const inRing = markOf(out);
tapL2.mk = 1.6;
out = draw();
ok('mark size scales the mark', Math.abs(markOf(out) / inRing - 1.6) < 0.01,
   markOf(out) + ' vs ' + inRing);
ok('and leaves the ring alone', ringOf(out) === ringOf(draw()));
tapL2.mk = null; tapL2.ring = 'theme';
ok('theme falls back to the theme ring', ringOf(draw()) > 0);
tapL2.ring = null;

console.log('\n== stars take their own colour ==');
const starL = { t: 'box', k: 'stars', x: .5, y: .2, s: 1 };
C.layerId(starL); C.S.stack = [starL];
ok('a stars layer renders', draw().indexOf('stars') > 0);
function nodeOf(kind) { draw(); return card.children.filter(c => c.dataset.k === kind)[0] }
starL.starCol = '#00ff88';
let starNode = nodeOf('stars');
ok('the layer carries its own --b-star',
   starNode && starNode.style.getPropertyValue('--b-star') === '#00ff88',
   starNode && starNode.style.getPropertyValue('--b-star'));
starL.onBand = 1;
starNode = nodeOf('stars');
ok('and it beats the on-band contrast flip',
   starNode.style.getPropertyValue('--b-star') === '#00ff88');
delete starL.starCol; delete starL.onBand;
ok('"Follow card" gives it back to the card',
   nodeOf('stars').style.getPropertyValue('--b-star') === '');

console.log('\n== breaking the lockup apart ==');
const lock2 = { t: 'box', k: 'lockup', x: .5, y: .3, s: 1, word: 'Google' };
C.layerId(lock2); C.S.stack = [lock2]; C.selectOnly(lock2.id);
out = draw();
ok('the lockup marks its two halves', /data-part="logo"/.test(out) && /data-part="plat"/.test(out));
C.breakLockup(lock2);
const kinds = C.S.stack.map(L => L.k).sort().join(',');
ok('it becomes a logo layer and a platform layer', kinds === 'logo,plat', kinds);
ok('the lockup itself is gone', !C.S.stack.some(L => L.k === 'lockup'));
ok('both halves come out selected', C.S.multi.length === 2);
ok('both are marked hand-placed so auto-fit leaves them', C.S.stack.every(L => L._man));
const logoOut = C.S.stack.filter(L => L.k === 'logo')[0];
const platOut = C.S.stack.filter(L => L.k === 'plat')[0];
ok('each half lands where it was actually sitting',
   Math.abs(logoOut.x - 0.2) < .001 && Math.abs(platOut.x - 0.475) < .001,
   logoOut.x + ' / ' + platOut.x);
ok('and they keep the lockup\'s own scale', logoOut.s === 1 && platOut.s === 1);
ok('a lone platform layer still draws', draw().length > 0);

console.log('\n== selecting more than one ==');
const a1 = { t: 'text', text: 'a', x: .2, y: .2, s: 1 };
const a2 = { t: 'text', text: 'b', x: .4, y: .4, s: 1 };
const a3 = { t: 'text', text: 'c', x: .6, y: .6, s: 1 };
[a1, a2, a3].forEach(L => C.layerId(L));
C.S.stack = [a1, a2, a3];
C.selectOnly(a1.id);
ok('one selected means no group', C.S.multi.length === 0 && C.selected().length === 1);
C.selectToggle(a2.id);
ok('adding a second makes a group of two', C.selected().length === 2);
ok('both read as selected', C.isSel(a1.id) && C.isSel(a2.id) && !C.isSel(a3.id));
C.selectToggle(a3.id);
ok('a third joins', C.selected().length === 3);
C.selectToggle(a3.id);
ok('toggling it again drops it', C.selected().length === 2 && !C.isSel(a3.id));
C.selectToggle(a2.id);
ok('dropping back to one collapses the group', C.S.multi.length === 0 && C.selected().length === 1);
C.selectOnly(null);
ok('clearing selects nothing', C.selected().length === 0);

console.log('\n== a locked layer never joins a move ==');
a3.locked = true;
C.S.multi = [a1.id, a2.id, a3.id]; C.S.sel = a1.id;
ok('selected() leaves the locked one out', C.selected().length === 2);
a3.locked = false;

console.log('\n== logo box ==');
const logoL = { t: 'box', k: 'logo', x: .5, y: .3, s: 1 };
C.layerId(logoL); C.S.stack = [logoL]; C.S.sel = null;
card.children.length = 0; C.paint();
ok('logo box falls back to the 2.8:1 slot',
   /width:42cqw;height:15cqw/.test(card.children.map(c => c.innerHTML).join('')));
logoL.lw = 60; logoL.lh = 40;
card.children.length = 0; C.paint();
ok('logo box follows its own width and height',
   /width:60cqw;height:40cqw/.test(card.children.map(c => c.innerHTML).join('')));

console.log('\n== upload staging ==');
const deco2 = { t: 'box', k: 'motif', x: .5, y: .5, s: 1, g: 'lib:coffee' };
C.layerId(deco2); C.S.stack.push(deco2); C.S.sel = deco2.id;
C.openLib('motif', deco2, null);
ok('the sheet opens on the grid, not the stage',
   byId('libStage').hidden === true && byId('libGrid').hidden === false);

const SVG = { vb: '0 0 24 24', sw: 2, p: '<path d="M4 4h16v16H4z"/>', disp: 'data:,' };
C.stageOpen('motif', 'my-mark.svg', 'svg', SVG, 24, 24);
ok('a dropped file takes over the sheet',
   byId('libStage').hidden === false && byId('libGrid').hidden === true);
ok('"Add a file" hides while one is being placed', byId('libPick').hidden === true);
ok('Cancel and Add appear', byId('libStageAdd').hidden === false && byId('libStageCancel').hidden === false);

const beforeCancel = C.libUser.motif.length;
C.stageClose();
ok('Cancel adds nothing and leaves the sheet open',
   C.libUser.motif.length === beforeCancel && byId('libStage').hidden === true &&
   byId('libGrid').hidden === false);

C.stageOpen('motif', 'my-mark.svg', 'svg', SVG, 24, 24);
C.stageCommit();
let made = C.libUser.motif[C.libUser.motif.length - 1];
ok('an untouched placement round-trips the viewBox', made.vb === '0 0 24 24', made.vb);
ok('it is stored as a vector, not flattened', !!made.p && !made.u);
ok('the layer it was opened on gets it', deco2.g === 'lib:' + made.id, deco2.g);
ok('the stage closes itself after adding', byId('libStage').hidden === true);

C.stageOpen('motif', 'zoomed.svg', 'svg', SVG, 24, 24);
C.stage.z = 2; C.stageCommit();
made = C.libUser.motif[C.libUser.motif.length - 1];
ok('zooming to 200% crops the viewBox to the middle half', made.vb === '6 6 12 12', made.vb);

C.stageOpen('motif', 'panned.svg', 'svg', SVG, 24, 24);
C.stage.ox = -24; C.stageCommit();
made = C.libUser.motif[C.libUser.motif.length - 1];
ok('dragging shifts the crop by the right number of user units',
   made.vb === '2.4 0 24 24', made.vb);

C.stageOpen('motif', 'wide.svg', 'svg', { vb: '0 0 48 24', sw: 2, p: '<path d="M0 0h48v24H0z"/>', disp: 'data:,' }, 48, 24);
C.stageCommit();
made = C.libUser.motif[C.libUser.motif.length - 1];
ok('a wide file is cropped square, not squashed', made.ar === 1);
ok('and the crop is centred on it', made.vb === '0 -12 48 48', made.vb);

console.log('\n== staged tiles still survive a save ==');
const blob2 = JSON.parse(JSON.stringify({ stack: C.S.stack, iconLib: C.libUser }));
ok('a staged tile is in the saved blob',
   blob2.iconLib.motif.some(e => e.id === made.id));
ok('and the layer still points at one', /^lib:/.test(blob2.stack.filter(L => L.k === 'motif')[0].g));

console.log('\n== mark and caption in one spot ==');
const tapL3 = { t: 'box', k: 'tap', x: .5, y: .8, s: 1, cap: 'TAP TO REVIEW', icon: 'lib:waves' };
C.layerId(tapL3); C.S.stack = [tapL3]; C.selectOnly(null);
let t = draw();
ok('stacked by default', /flex-direction:column/.test(t) && /TAP TO REVIEW/.test(t));
tapL3.lay = 'inline';
t = draw();
ok('side by side puts them on one row', /flex-direction:row/.test(t));
ok('and the caption is still there', /TAP TO REVIEW/.test(t));
ok('the mark shrinks to sit on the line', markOf(t) < 15 && markOf(t) > 0, markOf(t));
tapL3.lay = 'mark';
t = draw();
ok('mark only drops the caption', markOf(t) > 0 && t.indexOf('TAP TO REVIEW') < 0);
tapL3.lay = 'cap';
t = draw();
ok('caption only drops the mark', markOf(t) === null && /TAP TO REVIEW/.test(t));
tapL3.lay = 'inline'; tapL3.mk = 1.8;
ok('mark size still applies side by side', markOf(draw()) > markOf((tapL3.mk = 1, draw())));
tapL3.lay = null; tapL3.mk = null;

console.log('\n== a decoration can keep its own colours — when it has any ==');
const wm = { t: 'box', k: 'motif', x: .5, y: .5, s: 3, g: 'lib:coffee' };
C.layerId(wm); C.S.stack = [wm];
ok('tinted by default', /stroke:currentColor/.test(draw()));
ok('the shipped set is line art, so it has no own paint',
   !C.libOwnPaint(C.libGet('motif', 'coffee')));
wm.asis = true;
ok('asking line art to keep its colours is ignored, not obeyed into a black blob',
   /stroke:currentColor/.test(draw()));
wm.asis = null;

// a colour SVG, the kind you would actually watermark with
C.libUser.motif.push({ id: 'u-colour', n: 'Colour mark', vb: '0 0 24 24', sw: 2, ar: 1,
                       own: 1, p: '<path fill="#4285F4" d="M2 2h20v20H2z"/>' });
const wm2 = { t: 'box', k: 'motif', x: .5, y: .5, s: 3, g: 'lib:u-colour' };
C.layerId(wm2); C.S.stack = [wm2];
ok('a file with real colours does have own paint',
   C.libOwnPaint(C.libGet('motif', 'u-colour')));
ok('and is still tinted unless asked otherwise', /stroke:currentColor/.test(draw()));
wm2.asis = true;
let bare = draw();
ok('as-is leaves its paint alone', !/stroke:currentColor/.test(bare));
ok('and the colour survives', /#4285F4/.test(bare));
ok('a raster always counts as having its own paint',
   C.libOwnPaint({ u: 'data:image/png;base64,AAA' }));
ok('and line art parsed at upload time is flagged honestly',
   C.libParseSVG('<svg viewBox="0 0 24 24"><path d="M2 2h20"/></svg>').own === 0 &&
   C.libParseSVG('<svg viewBox="0 0 24 24"><path fill="#f00" d="M2 2h20"/></svg>').own === 1);

console.log('\n== depth ==');
const back = { t: 'text', text: 'back', x: .2, y: .2 };
const mid = { t: 'text', text: 'mid', x: .3, y: .3 };
const front = { t: 'text', text: 'front', x: .4, y: .4 };
[back, mid, front].forEach(L => C.layerId(L));
C.S.stack = [back, mid, front];
draw();
const z = () => card.children.map(c => [c.dataset.id, +c.style.zIndex]);
ok('stack order is z order', z()[0][1] < z()[2][1]);
C.selectOnly(front.id);
// stack index 0 paints first, so it is the back
C.S.stack = [front].concat(C.S.stack.filter(o => o !== front));
ok('sending to back puts it first in the stack', C.S.stack[0] === front);
ok('and the others keep their order', C.S.stack[1] === back && C.S.stack[2] === mid);

console.log('\n== capture / apply is one definition of a card ==');
C.S.stack = [{ t: 'box', k: 'tap', x: .5, y: .5, s: 1, cap: 'ONE', icon: 'lib:waves', ring: 'circle' }];
C.S.fmt = 0; byId('bname').value = 'Card One';
const capA = C.captureDesign();
ok('capture takes the stack', capA.stack.length === 1 && capA.stack[0].cap === 'ONE');
ok('capture takes the format and the name', capA.fmt === 0 && capA.name === 'Card One');
ok('capture carries the added library tiles', !!capA.iconLib);

C.S.stack = [{ t: 'box', k: 'tap', x: .3, y: .7, s: 1, cap: 'TWO' }];
byId('bname').value = 'Card Two';
C.applyDesign(JSON.parse(JSON.stringify(capA)));
ok('apply puts the first one back', C.S.stack[0].cap === 'ONE' && byId('bname').value === 'Card One');
ok('apply clears the selection', C.S.sel === null && C.S.multi.length === 0);

console.log('\n== the card shelf ==');
C.S.cards = []; C.shelfDraw();
ok('an empty shelf says so', byId('shelf').innerHTML.indexOf('NOTHING SAVED') > 0);
const c1 = C.shelfAdd(C.captureDesign(), 'Alpha');
byId('bname').value = 'Beta';
C.S.stack = [{ t: 'box', k: 'tap', x: .5, y: .5, s: 1, cap: 'BETA' }];
const c2 = C.shelfAdd(C.captureDesign(), 'Beta');
ok('two cards on the shelf', C.S.cards.length === 2);
ok('each row is drawn', (byId('shelf').innerHTML.match(/class="crow/g) || []).length === 2);
ok('both start ticked', C.S.cards.every(c => c.on));
ok('a card keeps a deep copy, not a live reference',
   (C.S.stack.push({ t: 'text', text: 'x', x: .1, y: .1 }), c2.d.stack.length === 1),
   c2.d.stack.length);

console.log('\n== which cards land on the sheet ==');
ok('both ticked and both at this format', C.sheetPicks().length === 2);
c2.on = false;
ok('unticking drops one', C.sheetPicks().length === 1 && C.sheetPicks()[0].id === c1.id);
c2.on = true;
c2.fmt = 3;
ok('a card saved at another size is skipped', C.sheetPicks().length === 1);
c2.fmt = C.S.fmt;
C.S.cards.forEach(c => { c.on = false });
ok('nothing ticked falls back to the card on screen', C.sheetPicks() === null);
C.S.cards.forEach(c => { c.on = true });

console.log('\n== the sheet reports what it will do ==');
C.updateSheetFit();
const fit = byId('sheetFit').textContent;
ok('the fit line names the designs', /2 designs/.test(fit), fit);
ok('and still names the grid', /\d+ up/.test(fit), fit);

console.log('\n== a card too heavy for the device is kept, not dropped ==');
const realLS = win.localStorage;
win.localStorage = { getItem: () => null, removeItem() {},
  setItem(k, v) { if (v.length > 400) throw new Error('QuotaExceeded'); } };
C.S.cards[1].d.logo = 'data:image/png;base64,' + 'A'.repeat(2000);
const persisted = C.cardsPersist();
ok('persisting reports it could not keep everything', persisted === false || C.S.cardSkip.length > 0);
ok('the heavy card is still on the shelf', C.S.cards.length === 2);
ok('and it is named as session-only', C.S.cardSkip.indexOf(C.S.cards[1].id) >= 0);
C.shelfDraw();
ok('the row says SESSION', byId('shelf').innerHTML.indexOf('SESSION') > 0);
win.localStorage = realLS;

console.log('\n== every composition builds at every trim ==');
{
  const fmtN = 8, bad = [];
  let stacks = 0;
  for (let p = 0; p < C.PLATES.length; p++) {
    for (let f = 0; f < fmtN; f++) {
      let st;
      try { C.S.fmt = f; st = C.PLATES[p][1](f) } catch (e) { bad.push(C.PLATES[p][0] + '@' + f + ': threw ' + e.message); continue }
      if (!Array.isArray(st) || !st.length) { bad.push(C.PLATES[p][0] + '@' + f + ': empty'); continue }
      stacks++;
      const taps = st.filter(L => L.k === 'tap');
      if (taps.length !== 1) bad.push(C.PLATES[p][0] + '@' + f + ': ' + taps.length + ' taps');
      for (const L of st) {
        if (typeof L.x !== 'number' || typeof L.y !== 'number')
          bad.push(C.PLATES[p][0] + '@' + f + ': ' + (L.k || L.t) + ' has no position');
        if (L.g === undefined && (L.k === 'motif' || L.k === 'pattern' || L.k === 'hero'))
          bad.push(C.PLATES[p][0] + '@' + f + ': ' + L.k + ' has no graphic');
      }
    }
  }
  C.S.fmt = 0;
  ok(C.PLATES.length + ' compositions, ' + stacks + ' stacks, all sound', bad.length === 0,
     bad.slice(0, 4).join(' | '));
  ok('the twelve new ones are all there', C.PLATES.length === 28, C.PLATES.length);
}

console.log('\n== every composition renders, and so does its miniature ==');
{
  const broke = [];
  C.paint();                                   // seed PREVIEW
  for (let p = 0; p < C.PLATES.length; p++) {
    const st = C.PLATES[p][1](0);
    try { st.forEach(L => C.bodyHTML(L, C.PREVIEW.ctx)) }
    catch (e) { broke.push(C.PLATES[p][0] + ': body ' + e.message); continue }
    let mini;
    try { mini = C.miniCard(st) } catch (e) { broke.push(C.PLATES[p][0] + ': mini ' + e.message); continue }
    if (!mini || mini.indexOf('class="mini') < 0) broke.push(C.PLATES[p][0] + ': empty miniature');
  }
  ok('every composition renders and previews', broke.length === 0, broke.slice(0, 3).join(' | '));
  const m = C.miniCard(C.PLATES[0][1](0));
  ok('a miniature is a real card, not a swatch', /aspect-ratio/.test(m) && /--b-brand/.test(m));
  ok('and it uses the same layer positioning as the card', /left:\d/.test(m) && /transform:translate/.test(m));
}

console.log('\n== directions still point at compositions that exist ==');
{
  const bad = [];
  C.DIRECTIONS.forEach((d) => {
    (d.pl || []).forEach((i) => { if (!C.PLATES[i]) bad.push(d.k + ' -> plate ' + i) });
    if (d.def) {
      if (!C.THEMES[d.def[0]]) bad.push(d.k + ' -> theme ' + d.def[0]);
      if (!C.PALETTES[d.def[1]]) bad.push(d.k + ' -> palette ' + d.def[1]);
      if (!C.PLATES[d.def[2]]) bad.push(d.k + ' -> default plate ' + d.def[2]);
    }
    ['pat', 'hero', 'motif'].forEach((g) => {
      const bank = g === 'pat' ? C.PATTERNS : g === 'hero' ? C.HEROES : null;
      if (bank && !(d.g[g] in bank)) bad.push(d.k + ' -> ' + g + ' "' + d.g[g] + '"');
      if (g === 'motif' && !C.libGet('motif', d.g.motif)) bad.push(d.k + ' -> motif "' + d.g.motif + '"');
    });
  });
  ok(C.DIRECTIONS.length + ' directions, every reference resolves', bad.length === 0, bad.join(' | '));
}

console.log('\n== the docked library ==');
C.dockDraw();
ok('folders render', byId('dockFolders').innerHTML.indexOf('Favourites') > 0);
ok('every asset folder is offered',
   ['Tap marks', 'Decorations', 'Platform', 'Logos', 'Images']
     .every(n => byId('dockFolders').innerHTML.indexOf(n) > 0));
ok('and every style folder',
   ['Compositions', 'Themes', 'Palettes', 'Directions']
     .every(n => byId('dockFolders').innerHTML.indexOf(n) > 0));
ok('the grid fills with the current folder', byId('dockGrid').innerHTML.indexOf('dtile') > 0);

C.S.favs = {};
ok('favourites starts empty', Object.keys(C.S.favs).length === 0);
C.toggleFav('tap', 'waves');
ok('starring records it', C.isFav('tap', 'waves'));
C.dockFolder = 'fav'; C.dockDraw();
ok('the favourites folder shows it', byId('dockGrid').innerHTML.indexOf('waves') > 0);
ok('and nothing else', (byId('dockGrid').innerHTML.match(/dtile/g) || []).length === 1);
C.toggleFav('plate', 'p3');
C.dockDraw();
ok('a style can be starred alongside an asset',
   (byId('dockGrid').innerHTML.match(/dtile/g) || []).length === 2);
C.toggleFav('tap', 'waves'); C.toggleFav('plate', 'p3');
C.dockDraw();
ok('un-starring empties it again', byId('dockGrid').innerHTML.indexOf('NOTHING STARRED') > 0);

C.dockFolder = 'motif'; C.dockDraw();
ok('a decoration folder lists the whole set',
   (byId('dockGrid').innerHTML.match(/dtile/g) || []).length === C.libSet('motif').length);

console.log('\n== clicking a tile does the useful thing ==');
{
  C.S.stack = C.PLATES[0][1](0);
  const tapL = C.S.stack.filter(L => L.k === 'tap')[0];
  C.selectOnly(tapL.id ? tapL.id : (C.layerId(tapL), tapL.id));
  C.dockUse('tap', 'nfc-arcs');
  ok('a tap mark goes to the selected tap layer', tapL.icon === 'lib:nfc-arcs', tapL.icon);
  C.selectOnly(null);
  const before = C.S.stack.length;
  C.dockUse('motif', 'pizza');
  ok('with nothing selected it lands as a new decoration', C.S.stack.length === before + 1);
  const added = C.S.stack[C.S.stack.length - 1];
  ok('and that decoration is selected and hand-placed', C.S.sel === added.id && added._man);
  C.dockUse('plate', 'p16');
  ok('a composition tile swaps the whole layout', C.S.plate === 16);
  C.dockUse('theme', 't3');
  ok('a theme tile swaps the theme', C.S.theme === 3);
  C.dockUse('dir', 'd6');
  ok('a direction tile applies its whole starting point',
     C.S.dir === 6 && C.S.theme === C.DIRECTIONS[6].def[0]);
}

console.log('\n== a platform mark and a logo make their own slot ==');
{
  C.libUser.platform = [{ id: 'u-plat', n: 'A badge', u: 'data:image/png;base64,AAA', ar: 2.4, asis: 1 }];
  C.libUser.logo = [{ id: 'u-logo', n: 'A logo', u: 'data:image/png;base64,BBB', ar: 2.8, asis: 1 }];
  // a stack with nowhere to put either
  C.S.stack = C.PLATES[0][1](0).filter(L => L.k !== 'lockup' && L.k !== 'logo' && L.k !== 'plat');
  C.S.stack.forEach(L => C.layerId(L));
  C.selectOnly(null);
  ok('the card has no slot for a platform mark',
     !C.S.stack.some(L => L.k === 'lockup' || L.k === 'plat'));
  C.dockUse('platform', 'u-plat');
  ok('clicking one makes the slot', C.S.stack.some(L => L.k === 'plat'));
  ok('and sets the mark', C.S.platLib === 'u-plat');
  const pl = C.S.stack.filter(L => L.k === 'plat')[0];
  ok('the new slot is selected', C.S.sel === pl.id);
  ok('hand-placed, so auto-fit leaves it', pl._man === true);
  ok('and it is clear of the tap target',
     Math.abs(pl.y - C.S.stack.filter(L => L.k === 'tap')[0].y) > 0.2);
  ok('it actually draws the mark', draw().indexOf('data:image/png;base64,AAA') >= 0);

  const n1 = C.S.stack.length;
  C.dockUse('platform', 'u-plat');
  ok('clicking again does not stack up slots', C.S.stack.length === n1);

  C.dockUse('logo', 'u-logo');
  ok('a logo makes a logo slot when there is none', C.S.stack.some(L => L.k === 'logo'));
  ok('and it draws', draw().indexOf('data:image/png;base64,BBB') >= 0);

  // with a lockup already there, the mark belongs to it — no new layer
  C.S.stack = [{ t: 'box', k: 'lockup', x: .5, y: .3, s: 1, word: 'Google' },
               { t: 'box', k: 'tap', x: .5, y: .8, s: 1, cap: 'TAP' }];
  C.S.stack.forEach(L => C.layerId(L));
  const n2 = C.S.stack.length;
  C.dockUse('platform', 'u-plat');
  ok('an existing lockup takes it instead of getting a sibling', C.S.stack.length === n2);
  ok('and the lockup shows it', draw().indexOf('data:image/png;base64,AAA') >= 0);
}

console.log('\n== pictures get real room to grow ==');
{
  ok('a headline stays at 220%', C.maxScale({ k: 'head' }) === 2.2);
  ok('so does a text layer', C.maxScale({ t: 'text' }) === 2.2);
  ['plat', 'logo', 'lockup', 'motif', 'hero', 'pattern'].forEach((k) => {
    ok(k + ' can reach 600%', C.maxScale({ k: k }) === 6);
  });

  C.libUser.platform = [{ id: 'u-wide', n: 'Wide badge', u: 'data:image/png;base64,AAA', ar: 2.4, asis: 1 }];
  C.S.platLib = 'u-wide';
  const plat = { t: 'box', k: 'plat', x: .5, y: .35, s: 1, ph: 11, word: 'Google' };
  C.layerId(plat);
  C.S.stack = [plat, Object.assign({ t: 'box', k: 'tap', x: .5, y: .8, s: 1, cap: 'TAP' }, {})];
  C.S.stack.forEach(L => C.layerId(L));
  function boxOf(h) { const m = h.match(/height:([\d.]+)cqw;width:([\d.]+)cqw/); return m && [+m[1], +m[2]] }
  const small = boxOf(draw());
  ok('the mark draws at its height times its aspect',
     small && Math.abs(small[1] / small[0] - 2.4) < 0.01, small && (small[1] / small[0]));
  plat.s = 4;
  const big = boxOf(draw());
  ok('scaling past the old cap actually grows it', big[0] > small[0] * 3.5, big && big[0]);
  plat.s = 1; plat.ph = 50;
  const tall = boxOf(draw());
  // a 2.4:1 badge asked to be half the card TALL would be 120% of it wide, so the
  // width cap takes over — which is the clamp working, not the height failing
  ok('mark height grows it on its own', tall[0] > small[0] * 3, tall && tall[0]);
  ok('the card width stops it there', Math.abs(tall[1] - 96) < 0.01, tall && tall[1]);
  ok('and it keeps its aspect', Math.abs(tall[1] / tall[0] - 2.4) < 0.01);
  plat.ph = 30;
  const tallNarrow = boxOf(draw());
  ok('under the cap, height is exactly what you asked for',
     Math.abs(tallNarrow[0] - 30) < 0.01, tallNarrow && tallNarrow[0]);
  plat.ph = 70; plat.s = 6;
  const huge = boxOf(draw());
  ok('the card width is the ceiling, and it does not move when you scale',
     Math.abs(huge[1] - 96) < 0.01, huge && huge.join('x'));
  ok('and the aspect survives the clamp', Math.abs(huge[1] / huge[0] - 2.4) < 0.01);

  // the slot the dock creates must not carry a narrower ceiling than the default
  C.S.stack = [{ t: 'box', k: 'tap', x: .5, y: .8, s: 1, cap: 'TAP' }];
  C.S.stack.forEach(L => C.layerId(L));
  C.selectOnly(null);
  C.dockUse('platform', 'u-wide');
  const made = C.S.stack.filter(L => L.k === 'plat')[0];
  ok('a dock-made slot has no width of its own to override the default',
     made.pw === undefined, made.pw);
  made.ph = 34;
  const fromDock = boxOf(draw());
  ok('so raising its height on a fresh slot actually works',
     Math.abs(fromDock[0] - 34) < 0.01, fromDock && fromDock.join('x'));
  C.S.platLib = null;
}

console.log('\n== a decoration can wear an asset from any folder ==');
{
  C.libUser.image.push({ id: 'u-pic', n: 'A photo', u: 'data:image/png;base64,AAA', ar: 1, asis: 1 });
  ok('libRefAny finds it across categories', C.libRefAny('lib:u-pic').n === 'A photo');
  ok('and still finds a decoration', C.libRefAny('lib:pizza').id === 'pizza');
  ok('and a tap mark', C.libRefAny('lib:waves').id === 'waves');
  const d = { t: 'box', k: 'motif', x: .5, y: .5, s: 1, g: 'lib:u-pic', asis: 1 };
  C.layerId(d); C.S.stack = [d];
  ok('and a decoration renders one', draw().indexOf('<img') >= 0);
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exitCode = fail ? 1 : 0;
