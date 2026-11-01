// scenes.js · the five posters of "Save the date — Mili & Rorro", each a portrait sheet (1000×1500 u).
// A scene = { pal, parts: [{ pull, ink, path, knock?, cut?, paint? }], header: { text }, band: {...}, depth? }.
// Parts are listed in print order; `pull` names the squeegee pass that prints them, `ink` is a palette key.
// Places are drawn as generic flat silhouettes, never traced from the couple's photos.
import { mulberry, polyPath, circlePath, ringPath, rectPath, unionPath, bandSteps, ridgeLine, lerp } from './silk.js';

export const SW = 1000, SH = 1500;
export const ART = [44, 44, 912, 1132];            // x, y, w, h of the art window
export const BAND = [44, 1196, 912, 256];          // the dark information band, printed last
const AX0 = ART[0], AY0 = ART[1], AX1 = ART[0] + ART[2], AY1 = ART[1] + ART[3];
const FULL = () => rectPath(AX0 - 20, AY0 - 20, ART[2] + 40, ART[3] + 40);

function blob(p, x, y, rx, ry) { p.moveTo(x + rx, y); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); p.closePath(); }
function star4(x, y, r, k = .22) { return polyPath([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k], [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]); }
// a tapered limb from a to b (width w0 → w1), as a quad
function limb(p, a, b, w0, w1) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  p.moveTo(a[0] + nx * w0 / 2, a[1] + ny * w0 / 2); p.lineTo(b[0] + nx * w1 / 2, b[1] + ny * w1 / 2);
  p.lineTo(b[0] - nx * w1 / 2, b[1] - ny * w1 / 2); p.lineTo(a[0] - nx * w0 / 2, a[1] - ny * w0 / 2); p.closePath();
}
// a bare winter tree: trunk + recursive branches (deterministic)
function tree(p, x, base, h, seed, lean = 0) {
  const r = mulberry(seed);
  const grow = (a, ang, len, w, d) => {
    const b = [a[0] + Math.sin(ang) * len, a[1] - Math.cos(ang) * len];
    limb(p, a, b, w, w * .62);
    if (d === 0 || w < 2.2) return;
    const n = d > 2 ? 2 : 2 + (r() < .5 ? 1 : 0);
    for (let i = 0; i < n; i++) grow(b, ang + (i - (n - 1) / 2) * (.55 + r() * .3) + (r() - .5) * .25, len * (.66 + r() * .14), w * .62, d - 1);
  };
  grow([x, base + 10], lean, h * .36, h * .07, 5);
}
// a heart (point down) centred on x, top at y, width w
function heart(x, y, w) {
  const p = new Path2D(), s = w / 2;
  p.moveTo(x, y + s * .55);
  p.bezierCurveTo(x - s * .1, y - s * .15, x - s * 1.05, y - s * .2, x - s, y + s * .55);
  p.bezierCurveTo(x - s * .95, y + s * 1.05, x - s * .35, y + s * 1.35, x, y + s * 1.85);
  p.bezierCurveTo(x + s * .35, y + s * 1.35, x + s * .95, y + s * 1.05, x + s, y + s * .55);
  p.bezierCurveTo(x + s * 1.05, y - s * .2, x + s * .1, y - s * .15, x, y + s * .55);
  p.closePath(); return p;
}
function skyBands(top, y0, y1, n = 5, curve = 8) {
  const p = rectPath(AX0 - 20, AY0 - 20, ART[2] + 40, top - AY0 + 20); p.addPath(bandSteps(AX0 - 20, ART[2] + 40, top, y1, n, curve)); return p;
}

// ============ 1 · PARÍS — the bridge railing at dawn, a pink heart padlock with M&R ============
export function paris() {
  const pal = { sky1: '#F4DCC4', sky2: '#E9A88F', far: '#B39AB9', mid: '#5E7FA6', lit: '#EBC36E', near: '#23304A', accent: '#E2557A' };
  const SUN = [712, 640], SR = 66;
  const sky1 = { path: FULL(), knock: circlePath(...SUN, SR) };
  const sky2 = { path: skyBands(300, 300, 600, 5, 10), cut: circlePath(...SUN, SR + 14) };
  // far: a row of mansard-roofed blocks and a dome, on the far quay
  const far = new Path2D(); { const r = mulberry(5); let x = AX0 - 20;
    while (x < AX1 + 20) { const w = 70 + r() * 70, top = 600 + r() * 40, m = 22 + r() * 10;
      far.moveTo(x, 740); far.lineTo(x, top + m); far.lineTo(x + 10, top); far.lineTo(x + w - 10, top); far.lineTo(x + w, top + m); far.lineTo(x + w, 740); far.closePath();
      for (let k = 0; k < 2; k++) far.rect(x + 14 + r() * (w - 30), top - 16, 9, 18);
      x += w - 2; }
    far.moveTo(206, 600); far.ellipse(260, 600, 54, 62, 0, Math.PI, 0); far.closePath(); far.rect(254, 520, 12, 24); far.rect(196, 598, 128, 30); }
  // mid: the river, glints knocked out to paper under the sun
  const river = rectPath(AX0 - 20, 736, ART[2] + 40, 460);
  const glint = new Path2D(); { const r = mulberry(9);
    for (let i = 0; i < 9; i++) { const y = 760 + i * 30, w = 150 - i * 12 + r() * 30; glint.rect(SUN[0] - w / 2 + (r() - .5) * 40, y, w, 7); } }
  // near: the bridge railing (lattice), deck below
  const near = new Path2D();
  near.rect(AX0 - 20, 880, ART[2] + 40, 22); near.rect(AX0 - 20, 1104, ART[2] + 40, 14); near.rect(AX0 - 20, 1130, ART[2] + 40, 80);
  for (let x = AX0 - 120; x < AX1 + 120; x += 64) { limb(near, [x, 900], [x + 200, 1106], 9, 9); limb(near, [x + 200, 900], [x, 1106], 9, 9); }
  for (let x = AX0 + 20; x < AX1; x += 256) near.rect(x, 870, 26, 260);
  // lit: brass padlocks hanging on the lattice
  const locks = new Path2D(); { const r = mulberry(17);
    for (const [x, y] of [[120, 960], [178, 1010], [262, 950], [380, 1040], [422, 980], [770, 960], [830, 1030], [880, 950], [690, 1060], [310, 1070], [120, 1060]]) {
      const w = 26 + r() * 10, h = w * 1.05; locks.addPath(ringPath(x, y - h * .2, w * .26, w * .4)); locks.rect(x - w / 2, y - h * .2, w, h); } }
  // accent: the big heart padlock with its shackle around the top rail
  const HX = 560, HY = 912, HW = 190;
  const shackle = new Path2D(); shackle.moveTo(HX - 60, HY + 60); shackle.arc(HX, HY + 10, 60, Math.PI, 0); shackle.lineTo(HX + 60, HY + 60); shackle.lineTo(HX + 38, HY + 60); shackle.arc(HX, HY + 10, 38, 0, Math.PI, true); shackle.lineTo(HX - 38, HY + 60); shackle.closePath();
  const hp = heart(HX, HY + 34, HW); hp.addPath(shackle);
  const mr = { paint: (c) => { c.font = `900 64px BigShoulders`; c.letterSpacing = '3px'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('M&R', HX, HY + 150); c.fillRect(HX - 44, HY + 168, 88, 6); c.fillRect(HX - 32, HY + 184, 64, 6); } };
  return {
    id: 'paris', pal, header: { text: 'PARÍS' },
    band: { label: 'ESTAMPILLA Nº 1', value: 'EL CANDADO', side: 'M&R' },
    parts: [
      { pull: 'sky1', ink: 'sky1', ...sky1 },
      { pull: 'sky2', ink: 'sky2', ...sky2 },
      { pull: 'far', ink: 'far', path: far },
      { pull: 'mid', ink: 'mid', path: river, knock: glint },
      { pull: 'near', ink: 'near', path: near },
      { pull: 'lit', ink: 'lit', path: locks },
      { pull: 'accent', ink: 'accent', path: hp },
      { pull: 'accent2', ink: 'near', ...mr },
    ],
  };
}

// ============ 2 · EDIMBURGO — the castle on its crag, a winter sun, bare trees ============
export function edimburgo() {
  const pal = { sky1: '#EEF1F4', sky2: '#B8C9D9', far: '#8B9BB0', mid: '#4A5D78', lit: '#D9CDB4', near: '#1F2A3C', accent: '#F2B134' };
  const sky2 = skyBands(250, 250, 520, 6, 6);
  const sun = circlePath(230, 560, 64);
  const far = new Path2D(); { const pts = ridgeLine([AX0 - 20, 690], [AX1 + 20, 650], 70, 6, 3); far.moveTo(AX0 - 20, 1200); pts.forEach(q => far.lineTo(q[0], q[1])); far.lineTo(AX1 + 20, 1200); far.closePath(); }
  // the crag and the castle
  const crag = polyPath([[150, 1200], [170, 900], [240, 830], [300, 760], [350, 700], [420, 650], [560, 628], [700, 620], [820, 640], [900, 610], [AX1 + 30, 600], [AX1 + 30, 1200]]);
  const castle = new Path2D();
  castle.rect(330, 520, 600, 112);                                             // curtain wall
  for (let x = 330; x < 930; x += 30) castle.rect(x, 504, 16, 18);              // crenels
  castle.rect(560, 380, 110, 142); for (let x = 560; x < 670; x += 28) castle.rect(x, 362, 16, 20);   // keep
  castle.rect(612, 300, 6, 82);                                                 // flag pole
  castle.rect(380, 440, 70, 82); for (let x = 380; x < 450; x += 26) castle.rect(x, 424, 14, 18);    // west tower
  castle.moveTo(740, 520); castle.lineTo(740, 450); castle.lineTo(830, 400); castle.lineTo(920, 450); castle.lineTo(920, 520); castle.closePath();   // the long hall, pitched roof
  castle.rect(286, 560, 60, 72);
  const mid = unionPath([crag, castle]);
  // lit faces: crag facets and the sun-side walls
  const lit = new Path2D();
  lit.addPath(polyPath([[170, 900], [240, 830], [300, 760], [262, 900], [214, 1010], [190, 1200], [160, 1200]]));
  lit.addPath(polyPath([[350, 700], [420, 650], [470, 660], [420, 720], [380, 800], [330, 760]]));
  lit.addPath(polyPath([[560, 628], [640, 624], [600, 700], [560, 760], [520, 700]]));
  lit.rect(560, 380, 28, 142); lit.rect(380, 440, 20, 82); lit.rect(330, 520, 24, 112);
  lit.addPath(polyPath([[740, 450], [830, 400], [800, 430], [760, 460]]));
  // near: bare winter trees, a dark ground; the castle's windows
  const near = new Path2D(); { const r = mulberry(21);
    near.moveTo(AX0 - 20, 1200); for (let x = AX0 - 20; x <= AX1 + 20; x += 40) near.lineTo(x, 1080 + Math.sin(x * .013) * 18 + r() * 12); near.lineTo(AX1 + 20, 1200); near.closePath();
    tree(near, 110, 1090, 620, 4, .05); tree(near, 880, 1100, 560, 8, -.08); tree(near, 470, 1110, 300, 12, .02);
    for (const [x, y] of [[600, 420], [628, 420], [600, 470], [628, 470], [400, 470], [780, 470], [820, 470], [860, 470], [500, 560], [540, 560], [700, 560], [880, 560]]) { near.rect(x, y, 10, 22); } }
  const flag = polyPath([[618, 302], [680, 316], [618, 334]]);
  return {
    id: 'edimburgo', pal, header: { text: 'EDIMBURGO' },
    band: { label: 'ESTAMPILLA Nº 2', value: 'EL CASTILLO', side: 'M&R' },
    parts: [
      { pull: 'sky1', ink: 'sky1', path: FULL() },
      { pull: 'sky2', ink: 'sky2', path: sky2 },
      { pull: 'accent', ink: 'accent', path: unionPath([sun, flag]) },
      { pull: 'far', ink: 'far', path: far },
      { pull: 'mid', ink: 'mid', path: mid },
      { pull: 'lit', ink: 'lit', path: lit },
      { pull: 'near', ink: 'near', path: near },
    ],
  };
}

// ============ 3 · EL DRAGÓN — a dragon of our own, wings open, breathing fire at night ============
export function dragon() {
  const pal = { sky1: '#2E3A6E', sky2: '#1A2148', far: '#46558C', mid: '#3F7F6A', lit: '#93C9A2', near: '#11162A', accent: '#F26B3A' };
  const stars = new Path2D(); { const r = mulberry(31);
    for (let i = 0; i < 60; i++) { const x = AX0 + 10 + r() * (ART[2] - 20), y = AY0 + 10 + r() * 330, s = 1.6 + r() * 2.6; stars.moveTo(x + s, y); stars.arc(x, y, s, 0, Math.PI * 2); stars.closePath(); } }
  const sky2top = rectPath(AX0 - 20, AY0 - 20, ART[2] + 40, 400 - AY0 + 20);
  const sky2b = bandSteps(AX0 - 20, ART[2] + 40, 400, 640, 5, 0);
  const far = new Path2D(); { const pts = ridgeLine([AX0 - 20, 860], [AX1 + 20, 820], 140, 6, 11); far.moveTo(AX0 - 20, 1200); pts.forEach(q => far.lineTo(q[0], q[1])); far.lineTo(AX1 + 20, 1200); far.closePath(); }
  // the dragon (mid): torso, neck, head facing right, two open wings, tail
  const C = [470, 760];
  const body = new Path2D();
  body.moveTo(C[0] + 90, C[1]); body.ellipse(C[0], C[1], 90, 150, -.12, 0, Math.PI * 2); body.closePath();
  limb(body, [C[0] + 20, C[1] - 110], [C[0] + 70, C[1] - 260], 92, 70);                 // neck
  limb(body, [C[0] + 70, C[1] - 250], [C[0] + 100, C[1] - 330], 74, 62);
  const head = polyPath([[C[0] + 70, C[1] - 360], [C[0] + 130, C[1] - 380], [C[0] + 210, C[1] - 352], [C[0] + 250, C[1] - 340], [C[0] + 196, C[1] - 322], [C[0] + 238, C[1] - 296], [C[0] + 180, C[1] - 296], [C[0] + 120, C[1] - 290], [C[0] + 72, C[1] - 300]]);
  const horns = polyPath([[C[0] + 92, C[1] - 368], [C[0] + 50, C[1] - 440], [C[0] + 118, C[1] - 376]]); horns.addPath(polyPath([[C[0] + 120, C[1] - 378], [C[0] + 110, C[1] - 446], [C[0] + 150, C[1] - 378]]));
  const wingL = polyPath([[C[0] - 40, C[1] - 90], [C[0] - 200, C[1] - 300], [C[0] - 400, C[1] - 380], [C[0] - 380, C[1] - 250], [C[0] - 420, C[1] - 160], [C[0] - 330, C[1] - 120], [C[0] - 340, C[1] - 30], [C[0] - 240, C[1] - 40], [C[0] - 200, C[1] + 40], [C[0] - 60, C[1] - 10]]);
  const wingR = polyPath([[C[0] + 60, C[1] - 120], [C[0] + 240, C[1] - 260], [C[0] + 400, C[1] - 300], [C[0] + 400, C[1] - 190], [C[0] + 450, C[1] - 120], [C[0] + 350, C[1] - 90], [C[0] + 360, C[1]], [C[0] + 260, C[1] - 10], [C[0] + 220, C[1] + 60], [C[0] + 80, C[1] - 20]]);
  const tail = new Path2D(); limb(tail, [C[0] + 40, C[1] + 120], [C[0] + 220, C[1] + 230], 60, 34); limb(tail, [C[0] + 220, C[1] + 230], [C[0] + 360, C[1] + 210], 34, 16);
  tail.addPath(polyPath([[C[0] + 352, C[1] + 196], [C[0] + 410, C[1] + 186], [C[0] + 360, C[1] + 230]]));
  const legs = new Path2D(); limb(legs, [C[0] - 40, C[1] + 100], [C[0] - 70, C[1] + 230], 56, 40); limb(legs, [C[0] + 50, C[1] + 100], [C[0] + 70, C[1] + 230], 56, 40);
  const mid = unionPath([wingL, wingR, body, head, horns, tail, legs]);
  // lit: belly plates and the wings' leading edges
  const lit = new Path2D();
  lit.moveTo(C[0] + 40, C[1] - 120); lit.ellipse(C[0] + 10, C[1] + 10, 36, 120, -.12, 0, Math.PI * 2); lit.closePath();
  limb(lit, [C[0] + 50, C[1] - 120], [C[0] + 86, C[1] - 300], 30, 22);
  limb(lit, [C[0] - 40, C[1] - 92], [C[0] - 200, C[1] - 300], 14, 10); limb(lit, [C[0] - 200, C[1] - 300], [C[0] - 400, C[1] - 380], 10, 4);
  limb(lit, [C[0] + 60, C[1] - 122], [C[0] + 240, C[1] - 262], 14, 10); limb(lit, [C[0] + 240, C[1] - 262], [C[0] + 400, C[1] - 300], 10, 4);
  // near: the rock it stands on, wing bones, claws, back spikes
  const near = new Path2D();
  near.addPath(polyPath([[AX0 - 20, 1200], [AX0 - 20, 1040], [200, 1000], [330, 984], [460, 990], [640, 1010], [800, 1050], [AX1 + 20, 1030], [AX1 + 20, 1200]]));
  for (const tip of [[C[0] - 380, C[1] - 250], [C[0] - 330, C[1] - 120], [C[0] - 240, C[1] - 40]]) limb(near, [C[0] - 200, C[1] - 300], tip, 12, 5);
  for (const tip of [[C[0] + 400, C[1] - 190], [C[0] + 350, C[1] - 90], [C[0] + 260, C[1] - 10]]) limb(near, [C[0] + 240, C[1] - 260], tip, 12, 5);
  for (const [x, s] of [[C[0] - 70, -1], [C[0] + 70, 1]]) for (let k = -1; k <= 1; k++) near.addPath(polyPath([[x + k * 14 - 7, C[1] + 226], [x + k * 14 + 7, C[1] + 226], [x + k * 18 + s * 4, C[1] + 250]]));
  for (let k = 0; k < 5; k++) { const a = [C[0] - 10 + k * 22, C[1] - 150 - k * 46]; near.addPath(polyPath([[a[0] - 14, a[1] + 10], [a[0] - 34, a[1] - 18], [a[0] + 4, a[1] - 4]])); }
  near.addPath(polyPath([[C[0] + 196, C[1] - 322], [C[0] + 214, C[1] - 314], [C[0] + 200, C[1] - 308]]));   // the open jaw's dark
  // accent: the fire and the embers, the eye
  const fire = new Path2D();
  fire.moveTo(C[0] + 236, C[1] - 330);
  fire.bezierCurveTo(C[0] + 320, C[1] - 400, C[0] + 400, C[1] - 330, C[0] + 520, C[1] - 400);
  fire.bezierCurveTo(C[0] + 480, C[1] - 330, C[0] + 540, C[1] - 300, C[0] + 560, C[1] - 250);
  fire.bezierCurveTo(C[0] + 470, C[1] - 290, C[0] + 420, C[1] - 260, C[0] + 380, C[1] - 220);
  fire.bezierCurveTo(C[0] + 360, C[1] - 280, C[0] + 300, C[1] - 300, C[0] + 236, C[1] - 314);
  fire.closePath();
  { const r = mulberry(41); for (let i = 0; i < 14; i++) fire.addPath(star4(C[0] + 330 + r() * 230, C[1] - 470 + r() * 280, 6 + r() * 9, .3)); }
  fire.moveTo(C[0] + 150, C[1] - 352); fire.arc(C[0] + 144, C[1] - 352, 7, 0, Math.PI * 2); fire.closePath();
  return {
    id: 'dragon', pal, header: { text: 'EL DRAGÓN' },
    band: { label: 'ESTAMPILLA Nº 3', value: 'EL SUSTO', side: 'M&R' },
    parts: [
      { pull: 'sky1', ink: 'sky1', path: FULL() },
      { pull: 'sky2', ink: 'sky2', path: sky2top, knock: stars },
      { pull: 'sky2', ink: 'sky2', path: sky2b },
      { pull: 'far', ink: 'far', path: far },
      { pull: 'mid', ink: 'mid', path: mid },
      { pull: 'lit', ink: 'lit', path: lit },
      { pull: 'near', ink: 'near', path: near },
      { pull: 'accent', ink: 'accent', path: fire },
    ],
  };
}

// ============ 4 · EL SÍ — a lake at dusk under the mountains; a ring flashes on the water ============
export function elsi() {
  const pal = { sky1: '#F6CD98', sky2: '#EE9A73', far: '#9A7FA8', mid: '#3E7079', lit: '#FBE6B4', near: '#1E3B3F', accent: '#F4C542' };
  const SUN = [500, 676], SR = 92;
  const sky1 = { path: FULL(), knock: circlePath(...SUN, SR) };
  const sky2 = { path: skyBands(220, 220, 560, 6, 12), cut: circlePath(...SUN, SR + 16) };
  // far: mountains, the far shore's tree line
  const far = new Path2D(); { const pts = ridgeLine([AX0 - 20, 640], [AX1 + 20, 600], 260, 5, 7);
    far.moveTo(AX0 - 20, 760); pts.forEach(q => far.lineTo(q[0], q[1])); far.lineTo(AX1 + 20, 760); far.closePath();
    const r = mulberry(13); for (let x = AX0 - 20; x < AX1 + 20; x += 24 + r() * 20) blob(far, x, 700 - r() * 10, 18 + r() * 16, 12 + r() * 14); far.rect(AX0 - 20, 700, ART[2] + 40, 30); }
  const snow = new Path2D(); { const pts = ridgeLine([AX0 - 20, 640], [AX1 + 20, 600], 260, 5, 7);
    for (let i = 2; i < pts.length - 2; i++) { const [x, y] = pts[i]; if (y < pts[i - 1][1] && y < pts[i + 1][1] && y < 600) { snow.addPath(polyPath([[x, y], [x + 34, y + 30], [x + 14, y + 26], [x, y + 40], [x - 16, y + 24], [x - 30, y + 28]])); } } }
  // mid: the lake, a column of glints knocked out under the sun
  const lake = rectPath(AX0 - 20, 728, ART[2] + 40, 470);
  const glint = new Path2D(); { const r = mulberry(19);
    for (let i = 0; i < 12; i++) { const y = 750 + i * 30, w = 210 - i * 13 + r() * 30; glint.rect(SUN[0] - w / 2 + (r() - .5) * 30, y, w, 8); } }
  // near: the shore, reeds, a lamp post with its railing
  const near = new Path2D(); { const r = mulberry(23);
    near.addPath(polyPath([[AX0 - 20, 1200], [AX0 - 20, 1060], [140, 1080], [260, 1120], [AX1 + 20, 1130], [AX1 + 20, 1200]]));
    for (let i = 0; i < 18; i++) { const x = AX0 + i * 14 + r() * 8, h = 120 + r() * 140; limb(near, [x, 1100], [x + (r() - .3) * 40, 1100 - h], 7, 1.5); }
    near.rect(820, 760, 14, 380); near.rect(800, 740, 54, 22); near.addPath(polyPath([[806, 740], [827, 706], [848, 740]]));
    near.rect(640, 1040, AX1 - 620, 12); for (let x = 650; x < AX1 + 20; x += 52) near.rect(x, 1040, 10, 90); }
  const lamp = rectPath(808, 762, 38, 0);
  // accent: the ring, and its flash on the water
  const RX = 360, RY = 880;
  const ring = unionPath([ringPath(RX, RY, 26, 38), polyPath([[RX - 18, RY - 40], [RX, RY - 64], [RX + 18, RY - 40], [RX, RY - 30]])]);
  const flash = unionPath([star4(RX, RY - 8, 110, .12), star4(RX + 120, RY - 90, 26, .25), star4(RX - 110, RY + 60, 18, .25)]);
  return {
    id: 'elsi', pal, header: { text: 'EL SÍ' },
    band: { label: 'ESTAMPILLA Nº 4', value: 'ELLA DIJO QUE SÍ', side: 'M&R' },
    parts: [
      { pull: 'sky1', ink: 'sky1', ...sky1 },
      { pull: 'sky2', ink: 'sky2', ...sky2 },
      { pull: 'far', ink: 'far', path: far },
      { pull: 'far', ink: 'lit', path: snow },
      { pull: 'mid', ink: 'mid', path: lake, knock: glint },
      { pull: 'near', ink: 'near', path: near },
      { pull: 'accent', ink: 'accent', path: flash, cut: ringPath(RX, RY, 22, 42) },
      { pull: 'accent', ink: 'accent', path: ring },
    ],
  };
}

// ============ 5 · BUENOS AIRES — the old station hall at evening, string lights, the date ============
export function baires() {
  const pal = { sky1: '#F7E0A8', sky2: '#F0A46E', far: '#C58BA0', mid: '#2F6E6A', lit: '#F6D49A', near: '#1E2B33', accent: '#E4533D' };
  const sky2 = skyBands(250, 250, 560, 6, 10);
  const far = new Path2D(); { const r = mulberry(51); let x = AX0 - 20;
    while (x < AX1 + 20) { const w = 40 + r() * 60, h = 80 + r() * 160; far.rect(x, 690 - h, w, h + 40); if (r() < .3) far.rect(x + w * .4, 690 - h - 40, 6, 40); x += w + r() * 6; } }
  // mid: the station: two wings, a central pavilion with a gable and a clock, a canopy
  const mid = new Path2D();
  mid.rect(120, 640, 270, 220); mid.rect(610, 640, 270, 220);                   // wings
  mid.rect(390, 560, 220, 300);                                                 // pavilion
  mid.moveTo(370, 560); mid.lineTo(500, 450); mid.lineTo(630, 560); mid.closePath();   // gable
  mid.rect(100, 624, 310, 16); mid.rect(590, 624, 310, 16);                     // cornices
  mid.rect(80, 860, 840, 24);                                                   // platform edge
  // lit: arched windows, the clock face, the doors
  const lit = new Path2D();
  const arch = (x, y, w, h) => { lit.moveTo(x, y + h); lit.lineTo(x, y + w / 2); lit.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); lit.lineTo(x + w, y + h); lit.closePath(); };
  for (const x0 of [140, 630]) for (let k = 0; k < 4; k++) arch(x0 + 14 + k * 62, 690, 38, 120);
  arch(436, 660, 128, 200);
  lit.moveTo(532, 520); lit.arc(500, 520, 32, 0, Math.PI * 2); lit.closePath();
  // near: the platform, rails, two trees, the clock hands, lamp posts
  const near = new Path2D(); { const r = mulberry(57);
    near.rect(AX0 - 20, 884, ART[2] + 40, 320);
    for (const x of [44, 956]) { near.rect(x - 14 + (x < 500 ? 40 : -40), 640, 28, 260); for (let i = 0; i < 16; i++) blob(near, x + (x < 500 ? 40 : -40) + (r() - .5) * 220, 520 + r() * 200, 50 + r() * 40, 40 + r() * 30); }
    limb(near, [500, 520], [500, 498], 5, 5); limb(near, [500, 520], [516, 528], 5, 5);
    for (const x of [300, 700]) { near.rect(x - 5, 760, 10, 124); near.addPath(polyPath([[x - 16, 760], [x, 738], [x + 16, 760]])); }
    near.rect(500 - 64, 860, 128, 0); }
  const rails = new Path2D(); for (const y of [960, 1010, 1080, 1130]) rails.rect(AX0 - 20, y, ART[2] + 40, 7);
  for (let x = AX0; x < AX1; x += 46) rails.rect(x, 952, 14, 190);
  // accent: the garland of lights between the trees and the gable
  const lights = new Path2D();
  const sag = (a, b, s, n) => { for (let i = 0; i <= n; i++) { const t = i / n, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t) + s * 4 * t * (1 - t); lights.moveTo(x + 9, y + 12); lights.arc(x, y + 12, 9, 0, Math.PI * 2); lights.closePath(); } };
  const cable = new Path2D(); const line = (a, b, s) => { for (let i = 0; i < 40; i++) { const t0 = i / 40, t1 = (i + 1) / 40; limb(cable, [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0) + s * 4 * t0 * (1 - t0)], [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1) + s * 4 * t1 * (1 - t1)], 3, 3); } };
  for (const [a, b, s, n] of [[[90, 580], [500, 470], 60, 9], [[500, 470], [910, 580], 60, 9], [[90, 700], [910, 700], 50, 16]]) { sag(a, b, s, n); line(a, b, s); }
  return {
    id: 'baires', pal, header: { text: 'BUENOS AIRES' }, final: true,
    band: { label: 'NOS CASAMOS · VIERNES', value: '05·03·27', venue: 'ESTACIÓN FÁTIMA', time: 'CEREMONIA 18 H' },
    depth: { sky1: 0, sky2: .1, far: .3, mid: .6, lit: .62, near: 1, rails: 1, accent: .85 },
    parts: [
      { pull: 'sky1', ink: 'sky1', path: FULL() },
      { pull: 'sky2', ink: 'sky2', path: sky2 },
      { pull: 'far', ink: 'far', path: far },
      { pull: 'mid', ink: 'mid', path: mid },
      { pull: 'lit', ink: 'lit', path: lit },
      { pull: 'near', ink: 'near', path: unionPath([near, rails]) },
      { pull: 'accent', ink: 'accent', path: unionPath([lights, cable]) },
    ],
  };
}

export const SCENES = [paris(), edimburgo(), dragon(), elsi(), baires()];
