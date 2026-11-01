// Page contract: window.DUR, window.render(t), window.EV, window.TEXTS(t), window.READY. ?a=&b= renders a stretch.
import { setup, render, texts } from './film.js';
const Q = new URLSearchParams(location.search);
await Promise.all(['900 40px BigShoulders', '800 40px BigShoulders', '600 40px Outfit'].map(f => document.fonts.load(f, 'AÍÓ·')));
const TL = setup(document.getElementById('c'));
const A = +(Q.get('a') ?? 0), Bn = +(Q.get('b') ?? TL.dur);
window.DUR = +(Bn - A).toFixed(3);
window.EV = TL.ev.filter(e => e.t >= A - 1e-6 && e.t < Bn).map(e => ({ ...e, t: +(e.t - A).toFixed(3) }));
window.render = t => render(t + A);
window.TEXTS = t => texts(t + A);
window.READY = true;
