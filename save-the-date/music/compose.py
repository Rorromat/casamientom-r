"""compose.py · the original score for "Save the date — Mili & Rorro" → music/score.wav
A soft porteño bossa in D major, 112 BPM, 4/4: nylon guitar, jazz double bass, accordion, cajón and egg shaker.
Every ink pull lands on a hit (read from events.json); the music drops out for "El sí" (only a glass-harp flash),
an accordion chord swells back, cuts for one beat, and everything returns on the clamp snap that fixes the date.
Run from anywhere: LIB=<library> python music/compose.py"""
import json, os, sys
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.dirname(D)
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

EV = json.load(open(os.path.join(P, 'events.json')))['ev']
grid = next(e for e in EV if e['type'] == 'grid'); b = grid['beat']; END = grid['end']
T = lambda beat: beat * b
S.seed(5)
ev = []
def n(beat, inst, pitch, dur, vel=.6, pan=0., gain=1.): ev.append((T(beat), inst, pitch, dur * b, vel, pan, gain))
def strum(beat, pitches, dur, vel=.5, pan=-.25, gap=.018, down=True):
    ps = pitches if down else pitches[::-1]
    for k, p in enumerate(ps): ev.append((T(beat) + k * gap, 'guitar_nylon', p, dur * b, vel * (1 - .05 * k), pan, 1.))
def hit(beat, var, vel=.6, pan=0., gain=1.): ev.append((T(beat), 'world_perc', var, None, vel, pan, gain))

CH = {  # guitar voicings and bass roots
    'D':  (['D3', 'A3', 'C#4', 'F#4'], 'D2', 'A1'),
    'Bm': (['B2', 'F#3', 'A3', 'D4'], 'B1', 'F#2'),
    'Em': (['E3', 'B3', 'D4', 'G4'], 'E2', 'B1'),
    'A7': (['A2', 'E3', 'G3', 'C#4'], 'A1', 'E2'),
    'G':  (['G2', 'D3', 'F#3', 'B3'], 'G1', 'D2'),
    'D9': (['D3', 'A3', 'E4', 'F#4', 'B4'], 'D2', 'A1'),
}
def bar(beat, ch, gtr=True, bass=True, perc=True, vel=1.):
    v, r, f = CH[ch]
    if gtr:   # bossa comp: 1, the "and" of 2, 3+ (short)
        strum(beat, v, 1.3, .48 * vel); strum(beat + 1.5, v, .9, .36 * vel, down=False); strum(beat + 2.5, v, 1.2, .40 * vel)
    if bass:
        n(beat, 'jazz_bass', r, 1.4, .72 * vel, .05); n(beat + 2, 'jazz_bass', f, 1.4, .6 * vel, .05)
    if perc:
        for k in range(8): hit(beat + k * .5, 'egg_shaker_soft' if k % 2 else 'egg_shaker_fast', (.28 if k % 2 else .2) * vel, .35)
        hit(beat, 'cajon_flamenco_1', .5 * vel, -.1); hit(beat + 2.5, 'cajon_flamenco_1', .38 * vel, -.1)
        hit(beat + 1, 'cajon_flamenco_2', .3 * vel, -.1); hit(beat + 3, 'cajon_flamenco_2', .34 * vel, -.1)

# ---- A: the three journeys (beats 0–34.5) ----
prog = ['D', 'Bm', 'Em', 'A7'] * 2 + ['D']
for k, ch in enumerate(prog):
    bb = k * 4
    bar(bb, ch, perc=k > 0, vel=.85 if k == 0 else 1.)
# Paris: an accordion tune
for beat, p, d in [(2, 'F#5', .5), (2.5, 'E5', .5), (3, 'D5', 1), (4, 'B4', 1.5), (5.5, 'C#5', .5), (6, 'D5', 1), (7, 'F#5', 1),
                   (8, 'G5', 1.5), (9.5, 'F#5', .5), (10, 'E5', 1), (11, 'B4', 1), (12, 'C#5', 1.5), (13.5, 'E5', .5)]:
    n(beat, 'accordion', p, d * .95, .5, .25)
# Edinburgh: ukulele arpeggios in eighths
for k, ch in enumerate(['A7', 'D', 'Bm', 'Em', 'A7']):
    v = CH[ch][0]; base = 14 + k * 2
    for j in range(4): n(base + j * .5, 'ukulele', [S.name(S.midi(p) + 12) for p in v][j % len(v)], .5, .42, .45)
# the dragon: low accordion stabs, darbuka, the fire hit
for beat in [24, 25.5, 28, 29.5, 32]: n(beat, 'accordion', 'D3' if beat < 28 else 'E3', .4, .55, -.3); n(beat, 'accordion', 'A3' if beat < 28 else 'B3', .4, .5, -.3)
hit(27.5, 'darbuka_doom', .9, 0, 1.2); hit(27.5, 'cajon_flamenco_1', .8); n(27.5, 'jazz_bass', 'D1', 2, .9)
for k in range(6): hit(30 + k * .5, 'darbuka_tak', .35 + .05 * k, .2)

# ---- B: silence; "El sí" (34.5–44): only the ring's flash ----
for k, p in enumerate(['A5', 'D6', 'F#5']): n(40.5 + k * .12, 'glass', p, 5, .55, (-.3, .3, 0)[k], .9)
# a soft accordion chord swells back in, then cuts one beat before the snap
for p in ['D4', 'F#4', 'A4', 'E5']: ev.append(dict(t=T(44), inst='accordion', pitch=p, dur=T(51.25) - T(44), vel=.42, pan=.1, attack=2.2, release=.05))

# ---- C: the snap (52) and the wedding poster ----
v = CH['D9'][0]; strum(52, v, 3.6, .7, gap=.012); n(52, 'jazz_bass', 'D2', 2, .9); hit(52, 'cajon_flamenco_1', .95, 0, 1.3); hit(52, 'darbuka_doom', .7)
for p in ['D4', 'A4', 'F#5']: n(52, 'accordion', p, 1.6, .6, .2)
bar(52, 'D', gtr=False, bass=False, perc=True)
bar(56, 'G'); bar(58, 'A7', perc=False)
for k in range(4): hit(58 + k * .5, 'egg_shaker_fast', .3, .35)
for beat, p, d in [(53, 'A5', 1), (54, 'G5', .5), (54.5, 'F#5', .5), (55, 'E5', 1), (56, 'D5', 1.5), (57.5, 'E5', .5), (58, 'F#5', 1), (59, 'E5', 1.5)]:
    n(beat, 'accordion', p, d * .95, .52, .25)
# the last chord, ringing over the wall of prints
strum(61, CH['D9'][0], 8, .55, gap=.03); n(61, 'jazz_bass', 'D2', 7, .7)
for p in ['D4', 'F#4', 'A4', 'D5']: ev.append(dict(t=T(61), inst='accordion', pitch=p, dur=T(68.5) - T(61), vel=.42, pan=.15, attack=.4, release=.4))
for k, p in enumerate(['D6', 'A5', 'F#5', 'D5']): n(61.5 + k * .5, 'glass', p, 4, .4, (.3, -.2, .2, -.3)[k], .7)

# ---- one pull, one hit: a soft cajón tap or darbuka on every ink that lands outside the groove's own hits ----
for e in EV:
    if e['type'] != 'pull': continue
    beat = e['t'] / b
    if 34.5 <= beat < 52: hit(beat, 'bongo_muted', .25, -.35, .8)
    elif beat < 34.5 and abs(beat - round(beat)) > .01: hit(beat, 'darbuka_tak', .3, -.3, .8)

mix = S.render(ev, dur=END + 2)
mix = S.room(mix, size=.35, mix=.14)
sf.write(os.path.join(D, 'score.wav'), mix.astype(np.float32), SR)
print('score.wav', round(len(mix) / SR, 2), 's')
print('\n'.join(S.credits(['guitar_nylon', 'accordion', 'jazz_bass', 'world_perc', 'glass', 'ukulele'])))
