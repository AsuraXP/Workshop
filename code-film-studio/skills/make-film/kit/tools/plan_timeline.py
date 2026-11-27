#!/usr/bin/env python3
"""Universal timeline & shot-skeleton planner for script-driven, dialogue-clip, silent, or BPM-driven films.

Supports 3 modes without requiring a single pre-recorded voiceover:
  1. Untimed or mixed script (--script):
       - `[SILENT 3.0s] Visual beat description` -> silent visual beat
       - `SPEAKER: Dialogue line` -> character dialogue beat (uses audio/lines/<s>.wav duration if present, else WPM)
       - Plain narration paragraph -> timed at --wpm (default 155 WPM) + punctuation breath pauses
  2. Beat-grid / musical mode (--bpm 108 --duration 32 --beats-per-shot 8):
       - Generates bar-locked timeline & shot skeleton for music videos, montages, or silent visual pieces.
  3. Cues JSON (--cues story/cues.json):
       - Explicit list of `[{"type": "silent"|"dialogue"|"narration", "text": "...", "speaker": "...", "dur": 3.2, "audio": "audio/lines/01.wav"}]`.
"""
import argparse, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir, load_json, save_json, media_duration

SILENT_RE = re.compile(r"^\[(?:SILENT|BEAT|HOLD)(?:\s+(\d+(?:\.\d+)?)s?)?\]\s*(.*)$", re.IGNORECASE)
SPEAKER_RE = re.compile(r"^([A-Z][A-Za-z0-9_ -]{0,22}):\s+(.+)$")


def estimate_speech_dur(text: str, wpm: float = 155.0) -> float:
    words = text.split()
    if not words:
        return 1.5
    base = len(words) / (wpm / 60.0)
    commas = len(re.findall(r"[,;—–]", text)) * 0.18
    stops = len(re.findall(r"[.!?]", text)) * 0.32
    return round(max(1.2, base + commas + stops), 2)


def distribute_words(text: str, t0: float, t1: float) -> list[dict]:
    ws = text.split()
    if not ws:
        return []
    weights = [max(2, len(re.sub(r"\W", "", w))) + (3 if re.search(r"[,.;:!?]$", w) else 0) for w in ws]
    wsum = sum(weights) or 1
    span = max(0.2, t1 - t0)
    cur = t0
    out = []
    for w, wt in zip(ws, weights):
        d = span * (wt / wsum)
        out.append({"word": w, "start": round(cur, 2), "end": round(cur + d * 0.92, 2)})
        cur += d
    return out


def parse_untimed_script(raw: str, wpm: float) -> list[dict]:
    items = []
    for ln in raw.splitlines():
        s = ln.strip()
        if not s or s.startswith("#"):
            continue
        ms = SILENT_RE.match(s)
        if ms:
            dur = float(ms.group(1)) if ms.group(1) else 2.8
            items.append({"type": "silent", "dur": dur, "summary": ms.group(2).strip() or "Visual hold"})
            continue
        mp = SPEAKER_RE.match(s)
        if mp:
            spk, txt = mp.group(1).strip(), mp.group(2).strip()
            items.append({"type": "dialogue", "speaker": spk, "text": txt, "dur": estimate_speech_dur(txt, wpm)})
            continue
        items.append({"type": "narration", "speaker": "", "text": s, "dur": estimate_speech_dur(s, wpm)})
    return items


def main():
    ap = argparse.ArgumentParser(description="Plan timeline and shot skeleton for non-VO or hybrid films.")
    ap.add_argument("--project", required=True)
    ap.add_argument("--script", default=None, help="Untimed/hybrid script file")
    ap.add_argument("--cues", default=None, help="JSON cues file")
    ap.add_argument("--bpm", type=float, default=None, help="Tempo for beat-grid / music mode")
    ap.add_argument("--beats-per-shot", type=float, default=8.0, help="Beats per shot in --bpm mode")
    ap.add_argument("--duration", type=float, default=None, help="Total duration for --bpm mode")
    ap.add_argument("--wpm", type=float, default=155.0, help="Speaking rate for estimated lines")
    ap.add_argument("--gap", type=float, default=0.35, help="Breath gap between spoken cues (seconds)")
    ap.add_argument("--write-shots", action="store_true", help="Also generate/overwrite story/shots.json skeleton")
    args = ap.parse_args()

    proj = project_dir(args.project)
    cfg = load_json(proj / "config.json", {})

    sentences, words, shots = [], [], []
    cur_t = 0.0

    if args.bpm:
        beat_sec = 60.0 / args.bpm
        shot_dur = round(beat_sec * args.beats_per_shot, 2)
        target_dur = args.duration or float(cfg.get("duration") or 24.0)
        n_shots = max(1, round(target_dur / shot_dur))
        beats = [round(i * beat_sec, 3) for i in range(int(round(n_shots * args.beats_per_shot)) + 1)]
        for i in range(n_shots):
            st = round(i * shot_dur, 2)
            shots.append({
                "id": f"s{i+1:02d}",
                "start": st,
                "dur": shot_dur,
                "in": "fadeBlack" if i == 0 else "cut",
                "out": "fadeBlack" if i == n_shots - 1 else "cut",
                "summary": f"Musical bar phrase {i+1} ({args.beats_per_shot:g} beats @ {args.bpm:g} BPM)",
                "sfx": [],
            })
        cur_t = round(n_shots * shot_dur, 2)
        save_json(proj / "timeline/beats.json", {"bpm": args.bpm, "beatSec": round(beat_sec, 4), "beats": beats, "duration": cur_t})
    else:
        if args.cues:
            items = load_json(Path(args.cues), [])
        else:
            sp = Path(args.script) if args.script else (proj / "script.txt" if (proj / "script.txt").exists() else proj / "production/script.md")
            if not sp.exists():
                sys.exit(f"ERROR: script not found at {sp}")
            items = parse_untimed_script(sp.read_text("utf-8"), args.wpm)

        if not items:
            sys.exit("ERROR: no cues or script lines found to plan")

        cur_t = 0.25  # gentle opening breath
        for idx, it in enumerate(items):
            kind = it.get("type", "narration")
            txt = (it.get("text") or "").strip()
            spk = (it.get("speaker") or "").strip()
            audio_rel = it.get("audio")
            if audio_rel and (proj / audio_rel).exists():
                speech_dur = round(media_duration(proj / audio_rel), 2)
            elif "dur" in it and it["dur"]:
                speech_dur = float(it["dur"])
            else:
                speech_dur = estimate_speech_dur(txt, args.wpm)

            lead_pad = 0.25 if idx == 0 else 0.0
            tail_pad = args.gap if kind != "silent" else 0.0
            shot_start = round(cur_t - (0.25 if idx == 0 else 0.0), 2)
            speak_start = round(shot_start + (0.25 if idx == 0 else 0.12), 2)
            speak_end = round(speak_start + speech_dur, 2)
            shot_dur = round((speak_end - shot_start) + tail_pad, 2)

            if kind != "silent" and txt:
                sentences.append({"start": speak_start, "end": speak_end, "speaker": spk, "text": txt})
                words.extend(distribute_words(txt, speak_start, speak_end))

            shot_entry = {
                "id": f"s{idx+1:02d}",
                "start": shot_start,
                "dur": shot_dur,
                "in": "fadeBlack" if idx == 0 else "cut",
                "out": "fadeBlack" if idx == len(items) - 1 else "cut",
                "summary": it.get("summary") or (f"{spk}: {txt}" if spk else txt) or "Visual beat",
                "sfx": [],
            }
            if it.get("hold"):
                shot_entry["hold"] = True
            if kind == "dialogue" and txt:
                shot_entry["speaker"] = spk
                shot_entry["caption"] = txt
            if audio_rel:
                shot_entry["dialogue"] = [{"at": round(speak_start - shot_start, 2), "src": audio_rel, "speaker": spk, "gain": 0}]
            shots.append(shot_entry)
            cur_t = round(shot_start + shot_dur, 2)

    save_json(proj / "timeline/words.json", {"duration": cur_t, "source": "planned", "words": words})
    save_json(proj / "timeline/sentences.json", {"duration": cur_t, "sentences": sentences})
    if args.write_shots or not (proj / "story/shots.json").exists():
        save_json(proj / "story/shots.json", {"shots": shots})
    cfg["duration"] = cur_t
    save_json(proj / "config.json", cfg)
    print(f"Planned {len(shots)} shots, {len(sentences)} spoken cues ({cur_t:.2f}s) -> {proj}")


if __name__ == "__main__":
    main()
