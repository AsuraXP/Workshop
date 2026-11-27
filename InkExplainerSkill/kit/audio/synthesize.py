#!/usr/bin/env python3
"""Synthesize continuous narration with Edge TTS and export exact word boundaries."""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

DEFAULT_VOICE = "en-US-BrianMultilingualNeural"
TICKS_PER_SECOND = 10_000_000


def audio_duration(path: Path) -> float | None:
    """Read container duration with ffprobe when available."""
    ffprobe = os.environ.get("FFPROBE_BIN") or shutil.which("ffprobe")
    if not ffprobe:
        return None
    result = subprocess.run(
        [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        return None
    try:
        return float(result.stdout.strip())
    except ValueError:
        return None


def parse_word_metadata(metadata_path: Path) -> list[dict]:
    words: list[dict] = []
    for line_no, line in enumerate(metadata_path.read_text("utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid Edge TTS metadata at line {line_no}: {exc}") from exc
        if item.get("type") != "WordBoundary":
            continue
        start = float(item["offset"]) / TICKS_PER_SECOND
        end = (float(item["offset"]) + float(item["duration"])) / TICKS_PER_SECOND
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        words.append({"id": len(words) + 1, "text": text, "start": round(start, 4), "end": round(max(start, end), 4)})
    if not words:
        raise ValueError("Edge TTS returned no word boundaries; check the voice/network and retry.")
    return words


async def synthesize(text: str, voice: str, rate: str, out_path: Path, metadata_path: Path) -> None:
    try:
        import edge_tts
    except ImportError as exc:
        raise RuntimeError("Missing dependency. Install requirements.txt (edge-tts).") from exc
    communicate = edge_tts.Communicate(text, voice=voice, rate=rate, boundary="WordBoundary")
    await communicate.save(str(out_path), str(metadata_path))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--script", required=True, help="UTF-8 text file containing the complete narration")
    parser.add_argument("--out", required=True, help="Output narration MP3 path")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help=f"Edge TTS voice ID (default: {DEFAULT_VOICE})")
    parser.add_argument("--rate", default="+0%", help="Edge TTS speaking rate, e.g. -3%% or +0%%")
    parser.add_argument("--metadata", help="Raw Edge TTS metadata JSONL path (default: alongside MP3)")
    parser.add_argument("--word-times", help="Word timing JSON path (default: alongside MP3)")
    args = parser.parse_args()

    script_path = Path(args.script).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()
    if not script_path.is_file():
        parser.error(f"Narration file not found: {script_path}")
    text = script_path.read_text("utf-8").strip()
    if not text:
        parser.error("Narration file is empty")

    metadata_path = Path(args.metadata).expanduser().resolve() if args.metadata else out_path.with_name(out_path.stem + ".metadata.jsonl")
    words_path = Path(args.word_times).expanduser().resolve() if args.word_times else out_path.with_name(out_path.stem + ".words.json")
    for path in (out_path, metadata_path, words_path):
        path.parent.mkdir(parents=True, exist_ok=True)

    try:
        asyncio.run(synthesize(text, args.voice, args.rate, out_path, metadata_path))
        words = parse_word_metadata(metadata_path)
    except Exception as exc:
        print(f"Edge TTS synthesis failed for {args.voice}: {exc}", file=sys.stderr)
        print("No replacement voice was selected. Check Edge TTS network access, then rerun.", file=sys.stderr)
        return 2

    measured = audio_duration(out_path)
    estimated = words[-1]["end"] + 0.30
    duration = round(measured if measured is not None else estimated, 3)
    payload = {
        "voice": args.voice,
        "provider": "edge-tts",
        "duration_sec": duration,
        "word_count": len(words),
        "source_script": str(script_path),
        "words": words,
    }
    words_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", "utf-8")
    print(f"Wrote narration: {out_path}")
    print(f"Voice: {args.voice} | {len(words)} timed words | {duration:.3f}s")
    print(f"Word timing: {words_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
