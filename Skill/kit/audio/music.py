"""Procedural background music beds — clean, copyright-free, mood-keyed, ducking-friendly.

Designed to sit comfortably under dialogue or carry silent/visual scenes: minimal 1-3 kHz clutter,
warm low-mid harmonic pads, gentle harp/marimba arpeggios, and optional pulse.
"""
import numpy as np
from dsp import SR, secs, t_axis, env_adsr, lp, hp, reverb, db, softclip, place_sec

NOTE = lambda semi, base=220.0: base * (2.0 ** (semi / 12.0))

MOODS = {
    "wonder":   {"root": 220.0, "bpm": 84,  "chords": [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [2, 7, 11, 14]], "arp": True,  "pulse": False, "bright": 2200},
    "curious":  {"root": 246.9, "bpm": 96,  "chords": [[0, 3, 7, 10], [5, 8, 12, 15], [-2, 2, 5, 9], [3, 7, 10, 14]], "arp": True,  "pulse": True,  "bright": 2400},
    "tense":    {"root": 146.8, "bpm": 92,  "chords": [[0, 3, 7],     [-1, 2, 7],    [-4, 0, 3, 8],  [-2, 3, 7]],     "arp": False, "pulse": True,  "bright": 1400},
    "uplift":   {"root": 261.6, "bpm": 100, "chords": [[0, 4, 7],     [7, 11, 14],   [9, 12, 16],    [5, 9, 12]],     "arp": True,  "pulse": True,  "bright": 2800},
    "action":   {"root": 164.8, "bpm": 124, "chords": [[0, 7, 12],    [-2, 5, 10],   [3, 10, 15],    [-4, 3, 8]],     "arp": True,  "pulse": True,  "bright": 3000},
    "somber":   {"root": 196.0, "bpm": 66,  "chords": [[0, 3, 7],     [-4, 0, 3],    [-2, 2, 5],     [-5, -1, 2]],    "arp": False, "pulse": False, "bright": 1300},
    "playful":  {"root": 293.7, "bpm": 112, "chords": [[0, 4, 7, 9],  [5, 9, 12],    [2, 5, 9],      [7, 11, 14]],    "arp": True,  "pulse": False, "bright": 3200},
}


def _pad_voice(freqs, dur, bright):
    n = max(8, secs(dur))
    t = t_axis(n)
    sig = np.zeros(n, dtype=np.float32)
    for f in freqs:
        for det in (-0.004, 0.0, 0.004):
            ph = 2 * np.pi * f * (1 + det) * t
            sig += ((np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) / (3 * len(freqs))).astype(np.float32)
    sig = lp(sig, bright) * env_adsr(n, min(0.9, dur * 0.22), 0.3, 0.85, min(1.2, dur * 0.28))
    return np.stack([sig, np.roll(sig, secs(0.011))], axis=1)


def _pluck(freq, dur=0.55):
    n = max(8, secs(dur))
    t = t_axis(n)
    s = ((np.sin(2 * np.pi * freq * t) + 0.4 * np.sin(4 * np.pi * freq * t)) * np.exp(-t * 6.5)).astype(np.float32)
    att = min(n, secs(0.004))
    if att > 1:
        s[:att] *= np.linspace(0, 1, att, dtype=np.float32)
    return lp(s, 2900) * 0.25


def render_bed(duration: float, mood: str = "wonder", seed: int = 7) -> np.ndarray:
    if mood == "none" or duration <= 0.1:
        return np.zeros((max(1, secs(duration)), 2), dtype=np.float32)
    cfg = MOODS.get(mood, MOODS["wonder"])
    rng = np.random.default_rng(seed)
    beat = 60.0 / cfg["bpm"]
    bar = beat * 4
    n = max(1, secs(duration))
    out = np.zeros((n, 2), dtype=np.float32)

    t = 0.0
    ci = 0
    while t < duration:
        semi = cfg["chords"][ci % len(cfg["chords"])]
        freqs = [NOTE(s, cfg["root"]) for s in semi]
        dur = min(bar * 1.12, duration - t + 0.3)
        place_sec(out, _pad_voice(freqs, dur, cfg["bright"]) * 0.48, t)
        bn = max(8, secs(min(bar, duration - t)))
        bass_t = t_axis(bn)
        bass = (np.sin(2 * np.pi * (freqs[0] * 0.5) * bass_t) * env_adsr(bn, 0.08, 0.2, 0.8, 0.25) * 0.30).astype(np.float32)
        place_sec(out, lp(bass, 220), t)
        if cfg["arp"]:
            step = beat * 0.5
            for k in range(int(bar / step)):
                if t + k * step >= duration:
                    break
                if rng.random() < 0.78:
                    f = freqs[k % len(freqs)] * (2 if k % 5 == 4 else 1)
                    place_sec(out, _pluck(f), t + k * step, pan=float(rng.uniform(-0.45, 0.45)))
        if cfg["pulse"]:
            for k in range(8):
                pt = t + k * beat * 0.5
                if pt >= duration:
                    break
                tn = secs(0.14)
                tt = t_axis(tn)
                th = (np.sin(2 * np.pi * (78 - 30 * tt / 0.14) * tt) * np.exp(-tt * 24) * (0.28 if k % 2 == 0 else 0.14)).astype(np.float32)
                place_sec(out, th, pt)
        t += bar
        ci += 1

    out = reverb(hp(out, 38), size=2.0, wet=0.28, seed=seed)
    fi, fo = min(secs(1.2), n // 4), min(secs(1.8), n // 3)
    if fi > 1:
        out[:fi] *= np.linspace(0, 1, fi, dtype=np.float32)[:, None]
    if fo > 1:
        out[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)[:, None]
    return softclip(out * db(-1))


def render_sections(duration: float, sections: list, seed: int = 7) -> np.ndarray:
    """sections = [{"at": 0, "mood": "tense"}, {"at": 18.5, "mood": "wonder"}, ...]"""
    if not sections:
        return render_bed(duration, "wonder", seed)
    sections = sorted(sections, key=lambda s: s["at"])
    n = max(1, secs(duration))
    out = np.zeros((n, 2), dtype=np.float32)
    xf = 1.2
    for i, s in enumerate(sections):
        a = float(s["at"])
        b = float(sections[i + 1]["at"]) if i + 1 < len(sections) else duration
        bed = render_bed(min(duration - a, (b - a) + xf), s.get("mood", "wonder"), seed + i) * db(s.get("gain", 0))
        if i > 0 and len(bed) > secs(xf):
            m = secs(xf)
            bed[:m] *= np.linspace(0, 1, m, dtype=np.float32)[:, None]
        place_sec(out, bed, a)
    return out
