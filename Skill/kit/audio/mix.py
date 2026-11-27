#!/usr/bin/env python3
"""Universal film audio mixer & two-pass EBU R128 loudness master -> build/mix.wav.

Supports ALL project audio configurations cleanly:
  1. Single narration `voiceover` in config.json (auto-ducks music & ambience under speech)
  2. Per-shot character `dialogue` clips (`shot.dialogue: [{"at": 0.2, "src": "audio/lines/01.wav", "gain": 0}]`)
  3. Silent / instrumental / Foley-only films (`voiceover: null` — builds score + ambience + SFX cleanly!)

Mastering uses true two-pass FFmpeg `loudnorm` (pass 1 measures I/TP/LRA/thresh; pass 2 applies linear
normalization when headroom allows, falling back gracefully to dynamic loudnorm) to hit `cfg.loudness`
(default -14.0 LUFS, -1.5 dBTP).
"""
import argparse, json, re, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "tools"))
from dsp import SR, secs, db, place_sec, write_wav, softclip
from sfx import render_sfx, render_ambience
from music import render_bed, render_sections
from common import require_bin, project_dir, load_json


def decode_audio(src: Path, ff: str) -> np.ndarray:
    raw = subprocess.check_output(
        [ff, "-v", "error", "-i", str(src), "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    )
    arr = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    return arr.reshape(-1, 2)


def voice_envelope(vo: np.ndarray) -> np.ndarray:
    mono = np.mean(np.abs(vo), axis=1)
    win = max(1, int(0.06 * SR))
    rms = np.sqrt(np.maximum(0.0, uniform_filter1d(mono * mono, win)))
    active = (rms > max(float(np.percentile(rms, 25)) * 1.6, 0.008)).astype(np.float64)
    held = maximum_filter1d(active, max(1, int(0.28 * SR)))
    smooth = uniform_filter1d(held, max(1, int(0.32 * SR)))
    return np.clip(smooth, 0.0, 1.0)


def two_pass_loudnorm(ff: str, raw_wav: Path, out_wav: Path, target_i: float = -14.0, target_tp: float = -1.5, target_lra: float = 11.0):
    """Run two-pass FFmpeg loudnorm so loudness hits target cleanly without single-pass pumping."""
    p1 = subprocess.run(
        [
            ff, "-hide_banner", "-nostats", "-i", str(raw_wav),
            "-af", f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}:print_format=json",
            "-f", "null", "-",
        ],
        capture_output=True,
        text=True,
    )
    m = re.search(r"\{\s*\"input_i\"[\s\S]*?\}", p1.stderr or "")
    if m:
        try:
            stats = json.loads(m.group(0))
            in_i = float(stats["input_i"])
            in_tp = float(stats["input_tp"])
            in_lra = float(stats["input_lra"])
            in_thresh = float(stats["input_thresh"])
            offset = float(stats.get("target_offset", 0.0))
            if np.isfinite(in_i) and in_i > -70.0:
                af = (
                    f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}"
                    f":measured_I={in_i}:measured_TP={in_tp}:measured_LRA={in_lra}"
                    f":measured_thresh={in_thresh}:offset={offset}:linear=true"
                )
                subprocess.check_call([ff, "-y", "-v", "error", "-i", str(raw_wav), "-af", af, "-ar", str(SR), str(out_wav)])
                return stats
        except Exception:
            pass

    # Fallback if audio is completely silent or measurement JSON couldn't parse
    subprocess.check_call(
        [ff, "-y", "-v", "error", "-i", str(raw_wav), "-af", f"loudnorm=I={target_i}:TP={target_tp}:LRA={target_lra}", "-ar", str(SR), str(out_wav)]
    )
    return None


def main():
    ap = argparse.ArgumentParser(description="Mix voice/dialogue, score, ambience, and SFX with two-pass loudnorm.")
    ap.add_argument("--project", required=True)
    ap.add_argument("--out", default=None, help="Output wav (default <project>/build/mix.wav)")
    args = ap.parse_args()

    ff = require_bin("ffmpeg")
    proj = project_dir(args.project)
    cfg = load_json(proj / "config.json", {})
    shots = load_json(proj / "story/shots.json", {"shots": []})["shots"]
    shot_end = max((float(s["start"]) + float(s["dur"]) for s in shots), default=float(cfg.get("duration") or 5.0))

    # 1. Build voice / dialogue stem (optional!)
    vo_rel = cfg.get("voiceover")
    has_vo = bool(vo_rel) and (proj / vo_rel).exists()
    if has_vo:
        vo_raw = decode_audio(proj / vo_rel, ff)
        dur = max(shot_end, len(vo_raw) / SR)
    else:
        vo_raw = None
        dur = max(shot_end, float(cfg.get("duration") or 5.0))

    n = max(1, secs(dur))
    voice = np.zeros((n, 2), dtype=np.float32)
    has_any_speech = False
    if vo_raw is not None:
        place_sec(voice, vo_raw.astype(np.float32) * db(cfg.get("voiceGain", 0)), 0.0)
        has_any_speech = True

    # Layer any per-shot dialogue / TTS clips into the voice stem
    for sh in shots:
        for dlg in sh.get("dialogue", []) or []:
            src_rel = dlg.get("src")
            if src_rel and (proj / src_rel).exists():
                clip = decode_audio(proj / src_rel, ff).astype(np.float32) * db(dlg.get("gain", 0))
                place_sec(voice, clip, float(sh["start"]) + float(dlg.get("at", 0)), pan=float(dlg.get("pan", 0.0)))
                has_any_speech = True

    duck = voice_envelope(voice).astype(np.float32) if has_any_speech else np.zeros(n, dtype=np.float32)

    # 2. Music bed (sectioned or single mood)
    mcfg = cfg.get("music", {"mood": "wonder", "gain": -15})
    if isinstance(mcfg, str):
        mcfg = {"mood": mcfg, "gain": -15}
    if mcfg.get("sections"):
        mus = render_sections(dur, mcfg["sections"])
    else:
        mus = render_bed(dur, mcfg.get("mood", "wonder"))
    base_mus_gain = float(mcfg.get("gain", -15)) + (0.0 if has_any_speech else 4.0)
    mus = mus[:n] * db(base_mus_gain)
    if len(mus) < n:
        mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
    mus *= (1.0 - duck * (1.0 - db(mcfg.get("duck", -9))))[:, None]

    # 3. Per-shot ambience + SFX (accepts either `kind` or `name` key in JSON!)
    amb = np.zeros((n, 2), dtype=np.float32)
    fx = np.zeros((n, 2), dtype=np.float32)
    for sh in shots:
        st, sd = float(sh["start"]), float(sh["dur"])
        ac = sh.get("ambience")
        if ac:
            if isinstance(ac, str):
                ac = {"kind": ac, "gain": -24}
            akind = ac.get("kind") or ac.get("name")
            if akind:
                place_sec(amb, render_ambience(akind, sd + 0.5) * db(ac.get("gain", -24)), max(0.0, st - 0.25))
        for ev in sh.get("sfx", []) or []:
            ekind = ev.get("kind") or ev.get("name")
            if ekind:
                clip = render_sfx(ekind, dur=ev.get("dur"), seed=ev.get("seed"), pitch=ev.get("pitch")) * db(ev.get("gain", -6))
                place_sec(fx, clip, st + float(ev.get("at", 0)), pan=float(ev.get("pan", 0.0)))
    amb *= (1.0 - duck * (1.0 - db(-5)))[:, None]

    # 4. Sum + two-pass EBU R128 loudness normalize
    master = softclip(voice + mus + amb + fx)
    out = Path(args.out).resolve() if args.out else (proj / "build/mix.wav")
    tmp = out.with_suffix(".raw.wav")
    write_wav(tmp, master)

    target_lufs = float(cfg.get("loudness", -14.0))
    has_signal = float(np.max(np.abs(master))) > 1e-5
    if has_signal:
        two_pass_loudnorm(ff, tmp, out, target_i=target_lufs, target_tp=-1.5, target_lra=11.0)
        tmp.unlink(missing_ok=True)
    else:
        tmp.rename(out)

    _, norm = wavfile.read(out)
    pk = 20 * np.log10(max(1e-6, np.max(np.abs(norm)) / 32768.0))
    print(f"Mixed {dur:.1f}s -> {out}  (target {target_lufs:.1f} LUFS, peak {pk:.1f} dBFS, speech={'yes' if has_any_speech else 'no'}, {len(shots)} shots)")


if __name__ == "__main__":
    main()
