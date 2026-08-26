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
    style: new Proxy({
      _props: {},
      setProperty(k, v) { this._props[k] = v },
      removeProperty(k) { delete this._props[k] },
      getPropertyValue(k) { return this._props[k] || '' },
    }, { get: (t, k) => (k in t ? t[k] : ''), set: () => true }),
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
const asis = C.libArt(C.libGet('tap', 'nfc-arcs'), '#B4577A', 'width:1cqw', true);
ok('as-is leaves paint alone', asis.indexOf('stroke:currentColor') < 0);

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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exitCode = fail ? 1 : 0;
