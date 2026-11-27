#!/usr/bin/env python3
"""Turn Edge TTS word timestamps into a word-complete, phrase-aware shot skeleton."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

CAMERA_HINTS = [
    "establishing-wide", "medium-profile", "extreme-close-up", "overhead-diagram",
    "low-angle-wide", "prop-insert", "wide-two-shot", "high-angle-medium",
    "silhouette-wide", "close-up-reaction", "tracking-side-view", "graphic-comparison",
    "medium-action", "bird-eye-map", "macro-detail", "negative-space-wide",
    "over-shoulder", "top-down-insert",
]
END_PUNCT = re.compile(r"[.!?;:]\s*$")


def get_cut_time(word: dict, next_word: dict | None, audio_duration: float, pause_min: float) -> tuple[float, float, bool]:
    if next_word is None:
        return audio_duration, audio_duration - float(word["end"]), True
    end = float(word["end"])
    gap = max(0.0, float(next_word["start"]) - end)
    # Land in the middle of a measured pause. Without a pause, cut on the word end.
    cut = end + min(gap * 0.5, 0.24) if gap >= pause_min else end
    return cut, gap, bool(END_PUNCT.search(str(word["text"])))


def plan(words: list[dict], duration: float, target: float, minimum: float, maximum: float, pause_min: float) -> list[dict]:
    if not words:
        raise ValueError("No word boundaries found")
    words = sorted(words, key=lambda w: (float(w["start"]), int(w.get("id", 0))))
    shots = []
    first = 0
    panel_start = 0.0
    n = len(words)

    while first < n:
        target_cut = panel_start + target
        max_cut = panel_start + maximum
        candidates = []
        fallback = []
        for last in range(first, n):
            word = words[last]
            next_word = words[last + 1] if last + 1 < n else None
            cut, gap, sentence_end = get_cut_time(word, next_word, duration, pause_min)
            if cut <= panel_start + 0.05:
                continue
            if cut > max_cut and fallback:
                break
            if cut <= max_cut:
                fallback.append((last, cut, gap, sentence_end))
                beat_len = cut - panel_start
                if beat_len >= minimum:
                    # Prefer close-to-target cuts, with small bonuses for punctuation and pauses.
                    cost = abs(cut - target_cut) - (0.28 if sentence_end else 0.0) - min(gap, 0.4) * 0.25
                    candidates.append((cost, last, cut, gap, sentence_end))
            elif not fallback:
                # A single unusually long word or first timing edge: preserve word integrity.
                fallback.append((last, cut, gap, sentence_end))
                break
        if candidates:
            _, last, cut, gap, sentence_end = min(candidates, key=lambda x: (x[0], x[1]))
        elif fallback:
            last, cut, gap, sentence_end = fallback[-1]
        else:
            # Keep a word intact even if it alone exceeds the target interval.
            last = first
            next_word = words[last + 1] if last + 1 < n else None
            cut, gap, sentence_end = get_cut_time(words[last], next_word, duration, pause_min)

        cut = min(max(cut, panel_start + 0.05), duration)
        selected = words[first:last + 1]
        spoken = " ".join(str(w["text"]).strip() for w in selected).strip()
        shot_id = len(shots) + 1
        beat_duration = cut - panel_start
        shot = {
            "id": shot_id,
            "start": round(panel_start, 3),
            "end": round(cut, 3),
            "duration_sec": round(beat_duration, 3),
            "spoken_text": spoken,
            "word_ids": [int(w.get("id", first + j + 1)) for j, w in enumerate(selected)],
            "camera_hint": CAMERA_HINTS[(shot_id - 1) % len(CAMERA_HINTS)],
            "camera": "",
            "composition": "",
            "visual": "",
            "scene": "",
            "cut_note": "sentence pause" if sentence_end else ("measured pause" if gap >= pause_min else "word boundary"),
        }
        if beat_duration > maximum + 0.02:
            shot["hold_reason"] = "preserve the complete spoken word at a clean boundary"
        shots.append(shot)
        panel_start = cut
        first = last + 1

    # Keep the timeline exactly continuous and cover encoder tail/final pause.
    if shots:
        shots[-1]["end"] = round(duration, 3)
        shots[-1]["duration_sec"] = round(duration - shots[-1]["start"], 3)
        if shots[-1]["duration_sec"] > maximum + 0.02:
            shots[-1]["hold_reason"] = "hold through the final narration tail"
    return shots


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--word-times", required=True, help="JSON emitted by synthesize.py")
    parser.add_argument("--out", required=True, help="Storyboard JSON output path")
    parser.add_argument("--target", type=float, default=2.4, help="Target panel duration in seconds")
    parser.add_argument("--minimum", type=float, default=1.6, help="Preferred minimum panel duration")
    parser.add_argument("--maximum", type=float, default=3.0, help="Hard maximum except a final hold")
    parser.add_argument("--pause-min", type=float, default=0.12, help="Pause length that may be used for a cut")
    args = parser.parse_args()
    if not (0.5 <= args.minimum <= args.target <= args.maximum <= 8.0):
        parser.error("Require 0.5 <= minimum <= target <= maximum <= 8 seconds")

    src = Path(args.word_times).expanduser().resolve()
    dst = Path(args.out).expanduser().resolve()
    if not src.is_file():
        parser.error(f"Word timing file not found: {src}")
    payload = json.loads(src.read_text("utf-8"))
    duration = float(payload.get("duration_sec", 0))
    shots = plan(payload.get("words", []), duration, args.target, args.minimum, args.maximum, args.pause_min)
    result = {
        "title": Path(payload.get("source_script", "narration")).stem,
        "duration_sec": round(duration, 3),
        "target_sec": args.target,
        "voice": payload.get("voice", "en-US-BrianMultilingualNeural"),
        "provider": payload.get("provider", "edge-tts"),
        "word_count": len(payload.get("words", [])),
        "shots": shots,
    }
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Wrote {len(shots)} word-timed shots -> {dst} ({duration:.3f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
