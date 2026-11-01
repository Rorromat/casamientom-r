// film.js · "Save the date — Mili & Rorro": the timeline, the camera over the print table, the pulls, the texts.
// Five portrait sheets lie in a row on the workbench (x = i·1100). Each poster is printed on camera, one ink per pull,
// the camera trucks from sheet to sheet, the last one prints loose and snaps into register on the date, and the film
// ends on the whole row. Everything is a pure function of t.
import { makeTextures, paperSheet, ink, wipeRegion, wipeFront, squeegee, inkFinish, rectPath, polyPath, hex2rgb, mix, hash, clamp, lerp, mulberry } from './engine/silk.js';
import { SCENES, SW, SH, ART, BAND } from './engine/scenes.js';

export const BPM = 112, B = 60 / BPM;
const GAP = 1100, PAPER = '#F3EAD8';
const FD = 'BigShoulders', FT = 'Outfit';

// ---------------- the print schedule (in beats) ----------------
// [pull, beat, length in beats]
const SCHED = [
  [['sky1', 0, .8], ['sky2', 1, .8], ['far', 2, .8], ['mid', 3, .8], ['near', 4, .8], ['lit', 4.5, .45], ['accent', 5, .5], ['accent2', 5.5, .35],
   ['header', 6, .5], ['band', 7, .5], ['b_label', 7.5, .3], ['b_value', 8, .4], ['b_side', 8.5, .3]],
  [['sky1', 13.5, .45], ['sky2', 14, .45], ['accent', 14.5, .45], ['far', 15, .45], ['mid', 15.5, .45], ['lit', 16, .45], ['near', 16.5, .45],
   ['header', 17, .5], ['band', 18, .5], ['b_label', 18.5, .3], ['b_value', 19, .4], ['b_side', 19.5, .3]],
  [['sky1', 24.5, .45], ['sky2', 25, .45], ['far', 25.5, .45], ['mid', 26, .45], ['lit', 26.5, .45], ['near', 27, .45], ['accent', 27.5, .45],
   ['header', 28, .5], ['band', 29, .5], ['b_label', 29.5, .3], ['b_value', 30, .4], ['b_side', 30.5, .3]],
  [['sky1', 35.5, .9], ['sky2', 36.5, .9], ['far', 37.5, .9], ['mid', 38.5, .9], ['near', 39.5, .9], ['accent', 40.5, .5],
   ['header', 41.5, .6], ['band', 42.5, .5], ['b_label', 43, .3], ['b_value', 43.5, .4], ['b_side', 44, .3]],
  [['sky1', 49.5, .24], ['sky2', 49.75, .24], ['far', 50, .24], ['mid', 50.25, .24], ['lit', 50.5, .24], ['near', 50.75, .24], ['accent', 51, .24],
   ['header', 52.5, .5], ['band', 53.5, .5], ['b_label', 54, .3], ['b_value', 54.5, .4], ['b_venue', 55.5, .35], ['b_time', 56, .3]],
];
const SNAP = 52, WALL0 = 61, WALL1 = 63.5, END = 69;
export const DUR = +(END * B).toFixed(3);

// ---------------- easing ----------------
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eio = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);

// ---------------- camera (world units; s = screen px per unit) ----------------
const F = i => ({ cx: i * GAP + 500, cy: 750, s: .68 });
// keys: [beat, {cx, cy, s, roll}, ease into this key]
const KEYS = [
  [0, { cx: 500, cy: 330, s: 1.55 }],
  [4.5, F(0), eo],
  [12.5, { cx: 500, cy: 770, s: .73 }, ss],
  [13.5, { cx: GAP + 500, cy: 560, s: .95 }, eio],
  [18, F(1), ss],
  [23.5, { cx: GAP + 500, cy: 770, s: .7 }, ss],
  [24.5, { cx: 2 * GAP + 500, cy: 760, s: .68, roll: -.012 }, eio],
  [27.5, { cx: 2 * GAP + 520, cy: 620, s: .9, roll: .01 }, ss],
  [29.5, { cx: 2 * GAP + 500, cy: 770, s: .7 }, ss],
  [34.5, { cx: 2 * GAP + 500, cy: 775, s: .71 }, ss],
  [35.5, { cx: 3 * GAP + 500, cy: 745, s: .66 }, eio],
  [48.5, { cx: 3 * GAP + 500, cy: 770, s: .73 }, ss],
  [49.5, { cx: 4 * GAP + 500, cy: 400, s: .92 }, eio],
  [SNAP, F(4), ss],
  [57, F(4), ss],
  [58.5, { cx: 4 * GAP + 500, cy: 1120, s: .95 }, ss],
  [WALL0, { cx: 4 * GAP + 500, cy: 1110, s: .96 }, ss],
  [WALL1, { cx: 2 * GAP + 500, cy: 745, s: .338 }, eio],
  [END, { cx: 2 * GAP + 500, cy: 748, s: .345 }, ss],
];
function camAt(b) {
  let i = 0; while (i < KEYS.length - 1 && KEYS[i + 1][0] <= b) i++;
  const [b0, A] = KEYS[i]; if (i === KEYS.length - 1) return { ...A, roll: A.roll || 0 };
  const [b1, Bk, ez] = KEYS[i + 1], u = (ez || ss)((b - b0) / (b1 - b0));
  const s = Math.exp(lerp(Math.log(A.s), Math.log(Bk.s), u));           // log zoom
  return { cx: lerp(A.cx, Bk.cx, u), cy: lerp(A.cy, Bk.cy, u), s, roll: lerp(A.roll || 0, Bk.roll || 0, u) };
}

// ---------------- pulls ----------------
const sched = SCHED.map(list => Object.fromEntries(list.map(([n, b, d]) => [n, { b, d }])));
function prog(i, name, b) { const q = sched[i][name]; if (!q) return name === 'accent2' || name.startsWith('b_') ? 0 : 1; return clamp((b - q.b) / q.d); }

// ---------------- colour helpers ----------------
const lum = h => { const c = hex2rgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
function pickInk(bgs, cands, need = 3) { bgs = [].concat(bgs); for (const c of cands) if (c && bgs.every(x => contrast(c, x) >= need)) return c; return cands.slice().sort((a, b) => Math.min(...bgs.map(x => contrast(b, x))) - Math.min(...bgs.map(x => contrast(a, x))))[0]; }
const R2 = (seed, amp) => [(hash(seed * 3.1 + 1) - .5) * 2 * amp, (hash(seed * 7.7 + 1.3) - .5) * 2 * amp];

// ---------------- layout of the printed words (measured once) ----------------
let LAY = null;
function layout() {
  const c = document.createElement('canvas').getContext('2d');
  const fit = (txt, weight, fam, max, maxW, track = 0) => { let s = max; for (;;) { c.font = `${weight} ${s}px ${fam}`; c.letterSpacing = (s * track) + 'px'; const w = c.measureText(txt).width; if (w <= maxW || s < 20) return { size: s, w }; s -= 2; } };
  return SCENES.map(S => {
    const hd = fit(S.header.text, 900, FD, 210, 820, .06);
    const L = { header: { ...hd, x: 86, y: 262 } };
    const bd = S.band, X = BAND[0] + 40, Y = BAND[1];
    if (!S.final) {
      L.label = { size: 30, x: X, y: Y + 66, ...fit(bd.label, 600, FT, 30, 560, .2) };
      L.value = { x: X, y: Y + 200, ...fit(bd.value, 900, FD, 132, 610, .02) };
      L.side = { x: BAND[0] + BAND[2] - 40, y: Y + 200, ...fit(bd.side, 800, FD, 96, 200, .02) };
    } else {
      L.label = { x: X, y: Y + 62, ...fit(bd.label, 600, FT, 30, 600, .2) };
      L.value = { x: X, y: Y + 214, ...fit(bd.value, 900, FD, 150, 440, .02) };
      L.venue = { x: BAND[0] + BAND[2] - 40, y: Y + 150, ...fit(bd.venue, 800, FD, 62, 360, .02) };
      L.time = { x: BAND[0] + BAND[2] - 40, y: Y + 212, ...fit(bd.time, 600, FT, 30, 360, .16) };
    }
    return L;
  });
}

// ---------------- one sheet ----------------
const T = { t: null };
function regionDown(p, seed, box = [-60, -60, SW + 120, 1260], ang = -.05) {
  if (p >= 1) return null;
  const m = new DOMMatrix().translate(SW / 2, 600).rotate(ang * 180 / Math.PI).translate(-SW / 2, -600);
  const o = new Path2D(); o.addPath(wipeRegion(box, 'down', p, seed, 30, 6), m); return o;
}
function frontDown(p, box = [-60, -60, SW + 120, 1260], ang = -.05) {
  const y = wipeFront(box, 'down', p, 30), m = new DOMMatrix().translate(SW / 2, 600).rotate(ang * 180 / Math.PI).translate(-SW / 2, -600);
  const a = m.transformPoint(new DOMPoint(box[0] - 30, y)), bb = m.transformPoint(new DOMPoint(box[0] + box[2] + 30, y));
  const d = m.transformPoint(new DOMPoint(0, 1)), o = m.transformPoint(new DOMPoint(0, 0));
  return { a: [a.x, a.y], b: [bb.x, bb.y], lead: [d.x - o.x, d.y - o.y] };
}

function drawSheet(ctx, i, b) {
  const S = SCENES[i], pal = S.pal, L = LAY[i], seed = 11 + i * 17;
  const loose = S.final && b < SNAP;
  // offsets of loose layers (the last poster floats until the snap)
  const looseAmt = S.final ? (b < SNAP ? 1 : Math.max(0, 1 - (b - SNAP) * 12) * 0) : 0;
  const offOf = (pull) => {
    if (!loose) return [0, 0];
    const d = (S.depth && S.depth[pull]) ?? .5, cam = camAt(b);
    const k = (d - .3);
    return [k * 26 * Math.sin(b * 1.7 + d * 4), k * ((cam.cy - 750) * .22) - k * 18];
  };
  // sheet shadow, paper, clamps
  ctx.save(); ctx.fillStyle = 'rgba(30,18,8,.28)'; ctx.fillRect(14, 18, SW, SH); ctx.restore();
  paperSheet(ctx, T.t, 0, 0, SW, SH, .6);
  ctx.save(); ctx.beginPath(); ctx.rect(ART[0], ART[1], ART[2], ART[3]); ctx.clip();
  S.parts.forEach((pt, j) => {
    const p = prog(i, pt.pull, b); if (p <= 0) return;
    const off = offOf(pt.pull), d = (S.depth && S.depth[pt.pull]) ?? .5;
    ctx.save(); ctx.translate(off[0], off[1]);
    if (pt.cut) { const inv = new Path2D(); inv.rect(-1e4, -1e4, 2e4, 2e4); inv.addPath(pt.cut); ctx.clip(inv, 'evenodd'); }
    if (loose && d >= .25 && p >= 1 && pt.path) {        // loose stencil: a paper sliver and a thickness shadow along its top edge
      ctx.save(); ctx.translate(0, -9 * d); ctx.globalAlpha = .26; ctx.fillStyle = '#140f14'; ctx.fill(pt.path); ctx.restore();
      ctx.save(); ctx.translate(1.5, -3.4); ctx.fillStyle = PAPER; ctx.fill(pt.path); ctx.restore();
    }
    ink(ctx, pt, { color: pal[pt.ink], reg: R2(seed + j * 5, 2.2), clip: regionDown(p, seed + j * 3), sheen: 1, trap: pt.ink === 'lit' ? 0 : 1, lw: 1.8 });
    ctx.restore();
  });
  // header, printed into the sky
  const hp = prog(i, 'header', b);
  if (hp > 0) {
    const H = L.header, off = offOf('sky1');
    const col = pickInk([pal.sky2, pal.sky1], [pal.near, pal.mid, PAPER], 3);
    ctx.save(); ctx.translate(off[0], off[1]);
    ink(ctx, { paint: (c) => { c.font = `900 ${H.size}px ${FD}`; c.letterSpacing = (H.size * .06) + 'px'; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(S.header.text, H.x, H.y); } },
      { color: col, reg: R2(seed + 44, 1.4), clip: hp < 1 ? wipeRegion([H.x - 30, H.y - H.size, H.w + 80, H.size * 1.2], 'right', hp, 13, 40) : null });
    ctx.restore();
  }
  ctx.restore();
  // the information band and its words
  const bp = prog(i, 'band', b);
  if (bp > 0) ink(ctx, { path: rectPath(...BAND) }, { color: pal.near, reg: R2(seed + 51, 1.2), clip: bp < 1 ? wipeRegion([BAND[0] - 30, BAND[1] - 20, BAND[2] + 60, BAND[3] + 40], 'down', bp, 9, 40) : null, sheen: 1 });
  const lab = pickInk(pal.near, [pal.sky1, pal.lit, PAPER], 4.5), val = pickInk(pal.near, [PAPER, pal.sky1], 4.5), key = pickInk(pal.near, [pal.accent, pal.lit, pal.sky1], 3);
  const word = (name, txt, l, weight, fam, track, color, align = 'left') => {
    const p = prog(i, name, b); if (p <= 0) return;
    const x0 = align === 'left' ? l.x : l.x - l.w;
    ink(ctx, { paint: (c) => { c.font = `${weight} ${l.size}px ${fam}`; c.letterSpacing = (l.size * track) + 'px'; c.textAlign = align; c.textBaseline = 'alphabetic'; c.fillText(txt, l.x, l.y); } },
      { color, reg: R2(seed + name.length * 7, 1.2), clip: p < 1 ? wipeRegion([x0 - 20, l.y - l.size, l.w + 60, l.size * 1.3], 'right', p, 31 + name.length, 24) : null });
  };
  const bd = S.band;
  word('b_label', bd.label, L.label, 600, FT, .2, lab);
  if (!S.final) {
    word('b_value', bd.value, L.value, 900, FD, .02, val);
    word('b_side', bd.side, L.side, 800, FD, .02, key, 'right');
  } else {
    word('b_value', bd.value, L.value, 900, FD, .02, key);
    word('b_venue', bd.venue, L.venue, 800, FD, .02, val, 'right');
    word('b_time', bd.time, L.time, 600, FT, .16, lab, 'right');
  }
  inkFinish(ctx, T.t, 0, 0, SW, SH, .6, 1);
  // the squeegee riding the current pull
  for (const [name, q] of Object.entries(sched[i])) {
    const p = clamp((b - q.b) / q.d); if (p <= 0 || p >= 1) continue;
    const pt = S.parts.find(x => x.pull === name);
    let color = pt ? pal[pt.ink] : (name === 'band' ? pal.near : name === 'header' ? pickInk([pal.sky2, pal.sky1], [pal.near, pal.mid, PAPER], 3) : pal.near);
    if (name.startsWith('b_') || name === 'header') continue;          // words are pulled through a small screen: no big blade over them
    let fr;
    if (name === 'band') { const y = wipeFront([BAND[0] - 30, BAND[1] - 20, BAND[2] + 60, BAND[3] + 40], 'down', p, 40); fr = { a: [BAND[0] - 40, y], b: [BAND[0] + BAND[2] + 40, y], lead: [0, 1] }; }
    else fr = frontDown(p);
    squeegee(ctx, fr.a, fr.b, fr.lead, { color, roll: p * 18 + i, scale: 1.25, seed: i * 3 + name.length, handle: .7, bead: 26 });
  }
}

// ---------------- the workbench ----------------
function bench(ctx, x0, y0, x1, y1) {
  const PH = 190;
  for (let k = Math.floor(y0 / PH) - 1; k <= Math.ceil(y1 / PH); k++) {
    const h = hash(k * 13.7 + 2), y = k * PH;
    ctx.fillStyle = mix('#8A6646', '#6E4E34', h); ctx.fillRect(x0, y, x1 - x0, PH);
    ctx.fillStyle = 'rgba(40,24,12,.55)'; ctx.fillRect(x0, y + PH - 5, x1 - x0, 5);
    ctx.fillStyle = 'rgba(255,230,190,.07)'; ctx.fillRect(x0, y + 2, x1 - x0, 3);
    ctx.strokeStyle = 'rgba(50,30,15,.18)'; ctx.lineWidth = 2;
    for (let g = 0; g < 4; g++) { const yy = y + 30 + g * 40 + hash(k * 3 + g) * 20; ctx.beginPath(); ctx.moveTo(x0, yy); for (let x = Math.floor(x0 / 400) * 400; x <= x1 + 400; x += 400) ctx.lineTo(x, yy + Math.sin(x * .004 + k + g) * 6); ctx.stroke(); }
  }
  // old ink stains and tape, muted
  const r = mulberry(5);
  for (let n = 0; n < 26; n++) { const x = -1500 + r() * 9000, y = -900 + r() * 3300, rr = 30 + r() * 70; if (x < x0 - 200 || x > x1 + 200 || y < y0 - 200 || y > y1 + 200) continue; ctx.fillStyle = ['rgba(60,40,70,.16)', 'rgba(120,50,40,.14)', 'rgba(40,60,70,.14)'][n % 3]; ctx.beginPath(); ctx.ellipse(x, y, rr, rr * .7, r() * 3, 0, 7); ctx.fill(); }
}
function clamps(ctx) {   // two hinge clamps at the top of each sheet
  for (let i = 0; i < 5; i++) for (const dx of [180, 820]) {
    const x = i * GAP + dx;
    ctx.fillStyle = 'rgba(20,12,6,.3)'; ctx.fillRect(x - 52 + 8, -70 + 10, 104, 110);
    ctx.fillStyle = '#9A958B'; ctx.fillRect(x - 52, -70, 104, 100);
    ctx.fillStyle = '#B9B4A8'; ctx.fillRect(x - 52, -70, 104, 14);
    ctx.fillStyle = '#6F6A61'; ctx.fillRect(x - 40, 20, 80, 14);
    ctx.fillStyle = '#5C5750'; ctx.beginPath(); ctx.arc(x, -26, 12, 0, 7); ctx.fill();
  }
}

// ---------------- foreground lamp post (screen space), Paris → Edinburgh ----------------
function lampPost(ctx, b) {
  const u = (b - 12.6) / 1.0; if (u <= 0 || u >= 1) return;
  const x = lerp(2300, -500, eio(u));
  ctx.save(); ctx.fillStyle = '#1C2638';
  ctx.fillRect(x - 34, 300, 68, 900);
  ctx.beginPath(); ctx.moveTo(x - 120, 300); ctx.lineTo(x + 120, 300); ctx.lineTo(x + 70, 140); ctx.lineTo(x - 70, 140); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - 90, 120, 180, 26); ctx.beginPath(); ctx.moveTo(x - 50, 120); ctx.lineTo(x, 40); ctx.lineTo(x + 50, 120); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - 60, 300, 120, 30); ctx.fillRect(x - 80, 1000, 160, 120);
  ctx.restore();
}

// ---------------- render ----------------
let C, X;
export function setup(canvas) {
  C = canvas; X = C.getContext('2d');
  T.t = makeTextures(PAPER, 7);
  LAY = layout();
  return { dur: DUR, ev: events() };
}
export function render(t) {
  const b = t / B, W = C.width, H = C.height, cam = camAt(b);
  // the clamp jolt at the snap
  let jx = 0, jy = 0; const js = b - SNAP; if (js > 0 && js < .5) { const a = Math.exp(-js * 9) * 7; jx = Math.sin(js * 90) * a; jy = Math.cos(js * 70) * a * .6; }
  X.setTransform(1, 0, 0, 1, 0, 0); X.fillStyle = '#5a3f2a'; X.fillRect(0, 0, W, H);
  X.save();
  X.translate(W / 2 + jx, H / 2 + jy); X.rotate(cam.roll || 0); X.scale(cam.s, cam.s); X.translate(-cam.cx, -cam.cy);
  const vw = W / cam.s / 2 + 200, vh = H / cam.s / 2 + 200;
  bench(X, cam.cx - vw, cam.cy - vh, cam.cx + vw, cam.cy + vh);
  for (let i = 0; i < 5; i++) {
    const x0 = i * GAP; if (x0 + SW < cam.cx - vw || x0 > cam.cx + vw) continue;
    X.save(); X.translate(x0, 0); drawSheet(X, i, b); X.restore();
  }
  clamps(X);
  X.restore();
  lampPost(X, b);
}

// ---------------- texts on screen, for readcheck ----------------
export function texts(t) {
  const b = t / B, cam = camAt(b), out = [];
  const toS = (x, y) => [(x - cam.cx) * cam.s + 960, (y - cam.cy) * cam.s + 540];
  SCENES.forEach((S, i) => {
    const L = LAY[i], ox = i * GAP;
    const add = (id, txt, l, align = 'left') => {
      const p = prog(i, id, b); if (p < 1) return;
      const x0 = align === 'left' ? l.x : l.x - l.w;
      const a = toS(ox + x0, l.y - l.size * .8), c = toS(ox + x0 + l.w, l.y + 4);
      if (a[0] < 0 || a[1] < 0 || c[0] > 1920 || c[1] > 1080) return;
      out.push({ id: S.id + ':' + id, text: txt, x0: a[0], y0: a[1], x1: c[0], y1: c[1] });
    };
    add('header', S.header.text, L.header);
    add('b_label', S.band.label, L.label);
    add('b_value', S.band.value, L.value);
    if (!S.final) add('b_side', S.band.side, L.side, 'right');
    else { add('b_venue', S.band.venue, L.venue, 'right'); add('b_time', S.band.time, L.time, 'right'); }
  });
  if (b > 12.6 && b < 13.6) return out.filter(() => false);
  return out;
}

// ---------------- events for the score and the foley ----------------
function events() {
  const ev = [];
  SCHED.forEach((list, i) => list.forEach(([name, bt, d]) => {
    const kind = name.startsWith('b_') || name === 'header' ? 'word' : name === 'band' ? 'band' : 'pull';
    ev.push({ t: +(bt * B).toFixed(4), type: kind, name, sheet: i, dur: +(d * B).toFixed(4) });
  }));
  for (const [b0, b1] of [[12.5, 13.5], [23.5, 24.5], [34.5, 35.5], [48.5, 49.5]]) ev.push({ t: +(b0 * B).toFixed(4), type: 'truck', dur: +((b1 - b0) * B).toFixed(4) });
  ev.push({ t: +(12.9 * B).toFixed(4), type: 'lamp' });
  ev.push({ t: +(27.5 * B).toFixed(4), type: 'fire' });
  ev.push({ t: +(40.5 * B).toFixed(4), type: 'flash' });
  ev.push({ t: +(34.5 * B).toFixed(4), type: 'silence', end: +(44 * B).toFixed(4) });
  ev.push({ t: +(51.25 * B).toFixed(4), type: 'hush', end: +(SNAP * B).toFixed(4) });
  ev.push({ t: +(SNAP * B).toFixed(4), type: 'snap' });
  ev.push({ t: +(WALL0 * B).toFixed(4), type: 'wall', dur: +((WALL1 - WALL0) * B).toFixed(4) });
  ev.push({ t: 0, type: 'grid', bpm: BPM, beat: B, end: DUR });
  return ev.sort((a, b) => a.t - b.t);
}
