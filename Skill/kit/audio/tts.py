#!/usr/bin/env python3
"""Dual-engine TTS router & speech-timing analyzer for Code Film Studio.

Primary voice policy:
  - Main Male   (default narrator / male lead): edge-tts -> en-US-BrianMultilingualNeural ("brian")
  - Main Female (co-host / female narrator):    Kokoro   -> af_heart ("af_heart")
  - Additional Male roles   (@voice:auto):      curated edge-tts male voices
  - Additional Female roles (@voice:auto):      curated Kokoro female voices

Supports both single-clip synthesis (--text ... --out ...) and batch cue manifests
(--cues cues.json or --project <dir>), outputting 48 kHz mono/stereo WAV or MP3 plus
exact waveform speech bounds and internal breath pauses (for frame-accurate lip-sync & L-cuts).
"""
from __future__ import annotations
import argparse, asyncio, json, os, subprocess, sys, tempfile
from pathlib import Path
import numpy as np

KIT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(KIT / "tools"))
from common import find_ffmpeg, load_json, save_json
from dsp import SR, write_wav

# ---------------------------------------------------------------------------
# Curated Cast Roster: edge-tts for Male, Kokoro for Female
# ---------------------------------------------------------------------------
VOICE_CATALOG: dict[str, dict] = {
    # === MALE VOICES (edge-tts) ===
    "brian": {
        "engine": "edge",
        "voice_id": "en-US-BrianMultilingualNeural",
        "gender": "male",
        "role": "MAIN MALE (default narrator, explainers, 2nd-person, warm host)",
        "fallback_kokoro": "am_fenrir",
    },
    "andrew": {
        "engine": "edge",
        "voice_id": "en-US-AndrewMultilingualNeural",
        "gender": "male",
        "role": "Warm, empathetic friend / grounded 3rd-person storyteller",
        "fallback_kokoro": "am_michael",
    },
    "eric": {
        "engine": "edge",
        "voice_id": "en-US-EricNeural",
        "gender": "male",
        "role": "Crisp, dry, skeptical co-host / deadpan comedy foil",
        "fallback_kokoro": "am_puck",
    },
    "christopher": {
        "engine": "edge",
        "voice_id": "en-US-ChristopherNeural",
        "gender": "male",
        "role": "Deep, serious cinema / noir / suspense narrator",
        "fallback_kokoro": "am_adam",
    },
    "guy": {
        "engine": "edge",
        "voice_id": "en-US-GuyNeural",
        "gender": "male",
        "role": "Energetic, punchy vertical [SHORT] / action host",
        "fallback_kokoro": "am_liam",
    },
    "ryan": {
        "engine": "edge",
        "voice_id": "en-GB-RyanNeural",
        "gender": "male",
        "role": "Classic British documentary / fable narrator",
        "fallback_kokoro": "bm_george",
    },
    "roger": {
        "engine": "edge",
        "voice_id": "en-US-RogerNeural",
        "gender": "male",
        "role": "Mature, authoritative professor / mentor / elder",
        "fallback_kokoro": "am_onyx",
    },

    # === FEMALE VOICES (Kokoro) ===
    "af_heart": {
        "engine": "kokoro",
        "voice_id": "af_heart",
        "lang": "a",
        "gender": "female",
        "role": "MAIN FEMALE (flagship warm, expressive narrator & co-host)",
        "fallback_edge": "en-US-AvaMultilingualNeural",
    },
    "af_bella": {
        "engine": "kokoro",
        "voice_id": "af_bella",
        "lang": "a",
        "gender": "female",
        "role": "Rich, intimate emotional storytelling & 2nd-person narration",
        "fallback_edge": "en-US-EmmaMultilingualNeural",
    },
    "af_sarah": {
        "engine": "kokoro",
        "voice_id": "af_sarah",
        "lang": "a",
        "gender": "female",
        "role": "Clear, articulate science / technology explainer",
        "fallback_edge": "en-US-JennyNeural",
    },
    "af_nicole": {
        "engine": "kokoro",
        "voice_id": "af_nicole",
        "lang": "a",
        "gender": "female",
        "role": "Soft, calm, reflective / nocturnal / noir atmosphere",
        "fallback_edge": "en-US-AriaNeural",
    },
    "af_nova": {
        "engine": "kokoro",
        "voice_id": "af_nova",
        "lang": "a",
        "gender": "female",
        "role": "Bright, energetic vertical [SHORT] & playful comedy",
        "fallback_edge": "en-US-AnaNeural",
    },
    "af_sky": {
        "engine": "kokoro",
        "voice_id": "af_sky",
        "lang": "a",
        "gender": "female",
        "role": "Light, curious conversational partner",
        "fallback_edge": "en-US-MichelleNeural",
    },
    "bf_emma": {
        "engine": "kokoro",
        "voice_id": "bf_emma",
        "lang": "b",
        "gender": "female",
        "role": "Warm British storyteller / documentary narrator",
        "fallback_edge": "en-GB-SoniaNeural",
    },
}

ALIASES: dict[str, str] = {
    "default": "brian",
    "male": "brian",
    "male_main": "brian",
    "narrator": "brian",
    "host": "brian",
    "female": "af_heart",
    "female_main": "af_heart",
    "cohost": "af_heart",
    "narrator_f": "af_heart",
    "heart": "af_heart",
    "bella": "af_bella",
    "sarah": "af_sarah",
    "nicole": "af_nicole",
    "nova": "af_nova",
    "sky": "af_sky",
    "emma": "bf_emma",
}


def resolve_voice_spec(spec: str, gender_hint: str | None = None) -> dict:
    """Resolve an alias, catalog key, raw edge-tts Neural ID, or raw Kokoro voice ID."""
    key = (spec or "default").strip()
    low = key.lower()
    if low == "auto":
        low = "af_heart" if (gender_hint or "").lower().startswith("f") else "brian"
    if low in ALIASES:
        low = ALIASES[low]
    if low in VOICE_CATALOG:
        return dict(VOICE_CATALOG[low], preset=low)
    if "neural" in low or "-" in key:
        return {
            "preset": key,
            "engine": "edge",
            "voice_id": key,
            "gender": gender_hint or "male",
            "role": "Custom edge-tts voice",
            "fallback_kokoro": "af_heart" if (gender_hint or "").startswith("f") else "am_fenrir",
        }
    return {
        "preset": key,
        "engine": "kokoro",
        "voice_id": key,
        "lang": "b" if low.startswith("b") else "a",
        "gender": "female" if low.startswith(("af_", "bf_")) else "male",
        "role": "Custom Kokoro voice",
        "fallback_edge": "en-US-AvaMultilingualNeural" if low.startswith(("af_", "bf_")) else "en-US-BrianMultilingualNeural",
    }


# ---------------------------------------------------------------------------
# Engine Backends: edge-tts & Kokoro (kokoro / kokoro-onnx)
# ---------------------------------------------------------------------------
async def _edge_synthesize_async(text: str, voice_id: str, out_mp3: Path, speed: float = 1.0) -> list[dict]:
    import edge_tts
    pct = int(round((speed - 1.0) * 100))
    rate_str = f"{pct:+d}%"
    comm = edge_tts.Communicate(text=text, voice=voice_id, rate=rate_str, boundary="WordBoundary")
    words: list[dict] = []
    with open(out_mp3, "wb") as f:
        async for chunk in comm.stream():
            ctype = chunk.get("type")
            if ctype == "audio":
                f.write(chunk["data"])
            elif ctype == "WordBoundary":
                off = float(chunk.get("offset", 0)) / 10_000_000.0
                dur = float(chunk.get("duration", 0)) / 10_000_000.0
                wtxt = str(chunk.get("text", "")).strip()
                if wtxt:
                    words.append({"word": wtxt, "start": round(off, 3), "end": round(off + max(0.04, dur), 3)})
    return words


def synthesize_edge(text: str, voice_id: str, out_path: Path, speed: float = 1.0) -> list[dict]:
    ff = find_ffmpeg()
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp_mp3 = Path(tmp.name)
    try:
        words = asyncio.run(_edge_synthesize_async(text, voice_id, tmp_mp3, speed=speed))
        if not tmp_mp3.exists() or tmp_mp3.stat().st_size < 128:
            raise RuntimeError(f"edge-tts produced empty output for voice '{voice_id}'")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if out_path.suffix.lower() == ".mp3":
            out_path.write_bytes(tmp_mp3.read_bytes())
        else:
            if not ff:
                raise RuntimeError("FFmpeg required to convert edge-tts audio to WAV")
            subprocess.run(
                [ff, "-y", "-v", "error", "-i", str(tmp_mp3), "-ar", str(SR), "-ac", "1", str(out_path)],
                check=True,
            )
        return words
    finally:
        tmp_mp3.unlink(missing_ok=True)


_KOKORO_CACHE: dict[str, object] = {}


def _find_kokoro_onnx_files() -> tuple[Path, Path] | None:
    env_model = os.environ.get("KOKORO_MODEL_PATH")
    env_voices = os.environ.get("KOKORO_VOICES_PATH")
    if env_model and env_voices and Path(env_model).exists() and Path(env_voices).exists():
        return Path(env_model), Path(env_voices)

    search_dirs = [
        Path.cwd(),
        Path.home() / ".cache/kokoro",
        Path.home() / ".cache/kokoro-onnx",
        Path("/tmp/kokoro"),
    ]
    model_names = ("kokoro-v1.0.onnx", "kokoro-v1_0.onnx", "kokoro-v0_19.onnx")
    voice_names = ("voices-v1.0.bin", "voices.bin", "voices.json")
    for d in search_dirs:
        if not d.exists():
            continue
        mp = next((d / m for m in model_names if (d / m).exists()), None)
        vp = next((d / v for v in voice_names if (d / v).exists()), None)
        if mp and vp:
            return mp, vp
    return None


def synthesize_kokoro(text: str, voice_id: str, out_path: Path, speed: float = 1.0, lang: str = "a") -> list[dict]:
    samples = None
    sr = 24000

    # Driver 1: official `kokoro` package (Hexgrad KPipeline)
    try:
        from kokoro import KPipeline  # type: ignore
        pipe_key = f"kpipe:{lang}"
        if pipe_key not in _KOKORO_CACHE:
            _KOKORO_CACHE[pipe_key] = KPipeline(lang_code=lang)
        pipe = _KOKORO_CACHE[pipe_key]
        chunks = []
        for _gs, _ps, audio in pipe(text, voice=voice_id, speed=speed):
            if audio is not None:
                arr = audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio, dtype=np.float32)
                chunks.append(arr.reshape(-1))
        if chunks:
            samples = np.concatenate(chunks)
            sr = 24000
    except ImportError:
        pass

    # Driver 2: lightweight CPU `kokoro_onnx` package
    if samples is None:
        from kokoro_onnx import Kokoro  # type: ignore
        pair = _find_kokoro_onnx_files()
        if not pair:
            raise RuntimeError(
                "kokoro_onnx installed, but model files (kokoro-v1.0.onnx + voices-v1.0.bin) were not found "
                "in ~/.cache/kokoro or KOKORO_MODEL_PATH / KOKORO_VOICES_PATH."
            )
        if "konnx" not in _KOKORO_CACHE:
            _KOKORO_CACHE["konnx"] = Kokoro(str(pair[0]), str(pair[1]))
        konnx = _KOKORO_CACHE["konnx"]
        lang_tag = "en-gb" if lang == "b" else "en-us"
        audio, sr = konnx.create(text, voice=voice_id, speed=speed, lang=lang_tag)
        samples = np.asarray(audio, dtype=np.float32).reshape(-1)

    if samples is None or len(samples) == 0:
        raise RuntimeError(f"Kokoro returned empty audio for voice '{voice_id}'")

    # Resample to studio 48 kHz and write WAV/MP3 cleanly
    if sr != SR:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(int(sr), int(SR))
        samples = resample_poly(samples, SR // g, int(sr) // g).astype(np.float32)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    if out_path.suffix.lower() == ".mp3":
        ff = find_ffmpeg()
        if not ff:
            raise RuntimeError("FFmpeg required to encode MP3")
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_wav = Path(tmp.name)
        try:
            write_wav(tmp_wav, np.column_stack([samples, samples]))
            subprocess.run([ff, "-y", "-v", "error", "-i", str(tmp_wav), "-b:a", "192k", str(out_path)], check=True)
        finally:
            tmp_wav.unlink(missing_ok=True)
    else:
        write_wav(out_path, np.column_stack([samples, samples]))
    return []


# ---------------------------------------------------------------------------
# Waveform Speech-Bound & Internal Breath-Pause Analyzer
# ---------------------------------------------------------------------------
def analyze_speech_bounds(audio_path: Path, min_pause_sec: float = 0.20) -> dict:
    """Decode audio and compute exact duration, speech_start, speech_end, and internal pauses."""
    ff = find_ffmpeg()
    if not ff:
        return {"duration": 0.0, "speech_start": 0.0, "speech_end": 0.0, "pauses": []}
    raw = subprocess.run(
        [ff, "-v", "error", "-i", str(audio_path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    y = np.frombuffer(raw, dtype=np.float32)
    dur = len(y) / 16000.0
    if len(y) < 320:
        return {"duration": round(dur, 3), "speech_start": 0.0, "speech_end": round(dur, 3), "pauses": []}

    hop = 160  # 10 ms hop
    n_frames = len(y) // hop
    rms = np.sqrt(np.mean(y[: n_frames * hop].reshape(n_frames, hop) ** 2, axis=1) + 1e-12)
    peak = float(np.max(rms))
    thr = max(0.006, peak * 0.06)
    voiced = np.where(rms > thr)[0]
    if len(voiced) == 0:
        return {"duration": round(dur, 3), "speech_start": 0.0, "speech_end": round(dur, 3), "pauses": []}

    s_start = int(voiced[0]) * 0.01
    s_end = min(dur, (int(voiced[-1]) + 1) * 0.01)

    pauses = []
    min_frames = max(1, int(round(min_pause_sec / 0.01)))
    in_sil = False
    sil_0 = 0
    for idx in range(int(voiced[0]), int(voiced[-1]) + 1):
        if rms[idx] <= thr:
            if not in_sil:
                in_sil = True
                sil_0 = idx
        else:
            if in_sil and (idx - sil_0) >= min_frames:
                pauses.append([round(sil_0 * 0.01, 2), round(idx * 0.01, 2)])
            in_sil = False

    return {
        "duration": round(dur, 3),
        "speech_start": round(s_start, 3),
        "speech_end": round(s_end, 3),
        "pauses": pauses,
    }


def synthesize_line(
    text: str,
    voice: str = "brian",
    out_path: Path = Path("line.wav"),
    speed: float = 1.0,
    gender_hint: str | None = None,
    strict: bool = False,
) -> dict:
    spec = resolve_voice_spec(voice, gender_hint=gender_hint)
    engine_used = spec["engine"]
    voice_used = spec["voice_id"]
    words: list[dict] = []
    fallback_note = None

    try:
        if engine_used == "edge":
            words = synthesize_edge(text, voice_used, out_path, speed=speed)
        else:
            words = synthesize_kokoro(text, voice_used, out_path, speed=speed, lang=spec.get("lang", "a"))
    except Exception as primary_err:
        if strict:
            raise
        if engine_used == "kokoro" and spec.get("fallback_edge"):
            fb = spec["fallback_edge"]
            fallback_note = f"Kokoro unavailable ({primary_err}); fell back to edge-tts '{fb}'"
            print(f"[tts] {fallback_note}", file=sys.stderr)
            words = synthesize_edge(text, fb, out_path, speed=speed)
            engine_used, voice_used = "edge", fb
        elif engine_used == "edge" and spec.get("fallback_kokoro"):
            fb = spec["fallback_kokoro"]
            fallback_note = f"edge-tts unavailable ({primary_err}); fell back to Kokoro '{fb}'"
            print(f"[tts] {fallback_note}", file=sys.stderr)
            words = synthesize_kokoro(text, fb, out_path, speed=speed, lang="b" if fb.startswith("b") else "a")
            engine_used, voice_used = "kokoro", fb
        else:
            raise

    bounds = analyze_speech_bounds(out_path)
    return {
        "file": str(out_path),
        "preset": spec["preset"],
        "engine": engine_used,
        "voice_id": voice_used,
        "fallback": fallback_note,
        **bounds,
        "words": words,
    }


def print_voice_catalog():
    print("Code Film Studio — Curated Dual-Engine Voice Roster\n")
    print("  PRIMARY LOCKED VOICES:")
    print("    - male / brian     -> edge-tts : en-US-BrianMultilingualNeural  (Main Male Narrator / Host)")
    print("    - female / af_heart-> Kokoro   : af_heart                       (Main Female Narrator / Co-Host)\n")
    print("  ALL PRESETS (--voice <preset>):")
    for k, v in VOICE_CATALOG.items():
        print(f"    {k:<13} [{v['engine']:<6} | {v['gender']:<6}] {v['voice_id']:<32} — {v['role']}")


def main():
    ap = argparse.ArgumentParser(description="Synthesize speech via edge-tts (male main: brian) & Kokoro (female main: af_heart).")
    ap.add_argument("--list-voices", action="store_true", help="Print curated male (edge-tts) and female (Kokoro) voice presets")
    ap.add_argument("--text", default=None, help="Single text line to synthesize")
    ap.add_argument("--voice", default="brian", help="Voice preset or raw voice ID (default: brian | af_heart | auto)")
    ap.add_argument("--gender", default=None, help="Optional gender hint when --voice auto (male | female)")
    ap.add_argument("--speed", type=float, default=1.0, help="Speaking rate multiplier (e.g. 1.0, 1.05)")
    ap.add_argument("--out", default=None, help="Output audio path (.wav or .mp3)")
    ap.add_argument("--cues", default=None, help="JSON file of batch cues: [{\"id\":\"s01\", \"voice\":\"brian\", \"text\":\"...\"}]")
    ap.add_argument("--project", default=None, help="Project folder (writes audio/lines/<id>.wav and audio/tts_report.json)")
    ap.add_argument("--strict", action="store_true", help="Disable cross-engine fallback if primary engine is unavailable")
    args = ap.parse_args()

    if args.list_voices:
        print_voice_catalog()
        return

    if args.text:
        out = Path(args.out or "line.wav").resolve()
        info = synthesize_line(args.text, voice=args.voice, out_path=out, speed=args.speed, gender_hint=args.gender, strict=args.strict)
        print(json.dumps({k: v for k, v in info.items() if k != "words"}, indent=2))
        return

    if args.cues:
        cues_path = Path(args.cues).resolve()
        proj = Path(args.project).resolve() if args.project else cues_path.parent.parent
        doc = load_json(cues_path, [])
        items = doc.get("cues", []) if isinstance(doc, dict) else doc
        results = []
        for i, c in enumerate(items, start=1):
            cid = c.get("id") or f"line_{i:02d}"
            rel_out = c.get("out") or f"audio/lines/{cid}.wav"
            out_p = (proj / rel_out).resolve()
            res = synthesize_line(
                str(c["text"]),
                voice=c.get("voice", args.voice),
                out_path=out_p,
                speed=float(c.get("speed", args.speed)),
                gender_hint=c.get("gender"),
                strict=args.strict,
            )
            res["id"] = cid
            res["rel_file"] = rel_out
            results.append(res)
            print(f"[{cid}] {res['engine']}:{res['voice_id']} -> {rel_out} ({res['duration']:.2f}s, speech {res['speech_start']:.2f}..{res['speech_end']:.2f}s, pauses={res['pauses']})")
        report_path = proj / "audio/tts_report.json"
        save_json(report_path, {"lines": results})
        print(f"Wrote TTS timing report -> {report_path}")
        return

    ap.error("Provide --list-voices, --text '...', or --cues cues.json")


if __name__ == "__main__":
    main()
