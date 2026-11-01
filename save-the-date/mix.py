"""mix.py · score + foley + ambience → out/mix.wav  (LIB=<library> python mix.py)
Foley by material, driven by events.json: squeegee over mesh for every ink pull (band-passed noise with a ~250 Hz mesh grain,
faster = brighter) and a wet squelch as it ends; paper stamps for the words; the clamp (wood + metal) on the snap;
whooshes for the table moves and the lamp post; a fire roar for the dragon.
Ambience from inside the prints: print-shop room tone throughout; winter wind in Edinburgh; the lake's water from one beat
before "El sí" (J-cut) running under the Buenos Aires pulls (L-cut); summer-evening crickets after the snap."""
import json, os, sys
import numpy as np, soundfile as sf
P = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, os.path.join(LIB, 'core/audio'))
from sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, clack, thump, whoosh, compress, limit, add

EV = json.load(open(os.path.join(P, 'events.json')))['ev']
grid = next(e for e in EV if e['type'] == 'grid'); B = grid['beat']; DUR = grid['end']
TOT = DUR + 1.0; N = int(TOT * SR); tt = np.arange(N) / SR
rng = np.random.default_rng(3)
amb = np.zeros((N, 2)); fol = np.zeros((N, 2))
evs = lambda tp: [e for e in EV if e['type'] == tp]

def scrape(d, bright=1.0):
    x_t = t_(d)
    grain = .65 + .35 * np.abs(np.sin(2 * np.pi * (230 + 50 * bright) * x_t + rng.random() * 6)) ** 2
    x = bp(noise(d), 700 * bright, min(9000, 5200 * bright), 2) * grain + lp(noise(d), 380) * .3
    e = np.minimum(1, x_t / .02) * np.minimum(1, (d - x_t) / .05) * (1 - .25 * x_t / d)
    return norm(x * e)
def squelch(f=140):
    d = .16; x_t = t_(d)
    return norm(np.sin(2 * np.pi * f * x_t * (1 - .9 * x_t)) * env_exp(d, .05) + lp(noise(d), 900) * env_exp(d, .03) * .5)
def stamp():
    d = .14; x_t = t_(d)
    return norm(lp(noise(d), 1200) * env_exp(d, .012) + np.sin(2 * np.pi * 160 * x_t) * env_exp(d, .03) * .7 + bp(noise(d), 2500, 6000) * env_exp(d, .006) * .4)
def seg_env(a, b, fi, fo): return np.clip(np.minimum((tt - a) / max(fi, 1e-3), (b - tt) / max(fo, 1e-3)), 0, 1)
def bed(x, a, b, g, fi=.6, fo=.6, roll=700):
    en = seg_env(a, b, fi, fo); amb[:, 0] += x * en * g; amb[:, 1] += np.roll(x, roll) * en * g

# ---------------- foley ----------------
for e in evs('pull'):
    d = e['dur']; br = 1.25 if d < .2 else (1.0 if d < .3 else .85)
    add(fol, scrape(d + .05, br), e['t'], .16, rng.uniform(-.25, .25))
    add(fol, squelch(120 + 40 * rng.random()), e['t'] + d * .9, .07, 0)
for e in evs('band'): add(fol, scrape(e['dur'], .9), e['t'], .12, .1)
for e in evs('word'):
    add(fol, stamp(), e['t'] + e['dur'] * .6, .2 if e['name'] != 'b_value' else .3, -.1)
for e in evs('truck'): add(fol, whoosh(e['dur'] * .9, .8), e['t'] + .05, .07, 0)
for e in evs('lamp'): add(fol, lp(whoosh(.5, 1), 1400), e['t'], .14, -.4)
for e in evs('wall'): add(fol, whoosh(e['dur'], .6), e['t'], .05, 0)
for e in evs('fire'):
    d = 1.1; x_t = t_(d); roar = (lp(noise(d), 900) * .8 + bp(noise(d), 1200, 3500) * .3) * np.minimum(1, x_t / .04) * np.exp(-x_t / .45)
    add(fol, norm(roar), e['t'], .2, .35); add(fol, thump(.9, 60), e['t'], .25, 0)
for e in evs('snap'):                                       # the clamp: the loudest single sound
    add(fol, clack(.8, 1), e['t'], .5, 0); add(fol, thump(1, 55), e['t'], .5, 0); add(fol, clack(1.3, .7), e['t'] + .03, .25, .1)

# ---------------- ambience ----------------
room = lp(brown(TOT), 240) * .5 + bp(noise(TOT), 150, 900) * .07
amb[:, 0] += room * .04; amb[:, 1] += room * .038
truck = {round(e['t'] / B): e['t'] for e in evs('truck')}
t_edin, t_drag, t_si, t_ba = truck[12] if 12 in truck else 12.5 * B, 23.5 * B, 34.5 * B, 48.5 * B
wind = (lp(noise(TOT), 900) * .6 + bp(noise(TOT), 1500, 5000) * .08) * (.55 + .45 * np.sin(2 * np.pi * .13 * tt + .7) ** 2)
bed(wind, 12.5 * B, 24.5 * B, .04)
swell = .55 + .45 * np.sin(2 * np.pi * .16 * tt + 1.2) ** 2
water = (lp(noise(TOT), 650) * .7 + bp(noise(TOT), 1200, 4500) * .12) * swell
snap = evs('snap')[0]['t']
bed(water, 33.6 * B, snap + .4, .07, fi=1.2, fo=.5)          # J-cut into "El sí", L-cut under the last pulls
def chirp(d, f):
    x_t = t_(d); return norm(np.sin(2 * np.pi * f * x_t) * (np.sin(2 * np.pi * 38 * x_t) > 0) * np.sin(np.pi * x_t / d))
for k in range(26): add(amb, chirp(.25, 4300 + 300 * rng.random()), snap + .4 + k * .42 + rng.random() * .15, .006, rng.uniform(-.7, .7))

# ---------------- music, ducks and silences ----------------
mus, sr = sf.read(os.path.join(P, 'music/score.wav'), dtype='float32')
assert sr == SR
m = np.zeros((N, 2)); L = min(N, len(mus)); m[:L] = mus[:L]
mix = m * .9 + fol + amb
mix = limit(mix, .95)
os.makedirs(os.path.join(P, 'out'), exist_ok=True)
sf.write(os.path.join(P, 'out/mix.wav'), mix[:int(DUR * SR)].astype(np.float32), SR)
print('mix.wav', round(DUR, 2), 's · peak', round(float(np.abs(mix).max()), 3))
