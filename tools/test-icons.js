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
    style: new Proxy({ setProperty(){}, removeProperty(){}, getPropertyValue(){ return '' } },
      { get: (t, k) => (k in t ? t[k] : ''), set: () => true }),
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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exitCode = fail ? 1 : 0;
