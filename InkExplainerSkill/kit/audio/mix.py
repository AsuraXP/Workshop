#!/usr/bin/env python3
"""Mix continuous narration with optional score/effects and normalize for web delivery."""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--voice", required=True, help="Narration audio (MP3/WAV/etc.)")
    parser.add_argument("--music", help="Optional instrumental bed WAV")
    parser.add_argument("--sfx", help="Optional effects WAV")
    parser.add_argument("--out", required=True, help="Output 48 kHz stereo PCM WAV")
    parser.add_argument("--voice-gain", type=float, default=1.0)
    parser.add_argument("--music-gain", type=float, default=1.0)
    parser.add_argument("--sfx-gain", type=float, default=0.65)
    parser.add_argument("--target-lufs", type=float, default=-14.0)
    parser.add_argument("--true-peak", type=float, default=-1.5)
    args = parser.parse_args()

    selected = [("voice", Path(args.voice).expanduser().resolve(), args.voice_gain)]
    if args.music:
        selected.append(("music", Path(args.music).expanduser().resolve(), args.music_gain))
    if args.sfx:
        selected.append(("sfx", Path(args.sfx).expanduser().resolve(), args.sfx_gain))
    for label, path, gain in selected:
        if not path.is_file():
            parser.error(f"{label} file not found: {path}")
        if gain < 0 or gain > 4:
            parser.error(f"{label} gain must be between 0 and 4")
    if args.target_lufs > -8 or args.target_lufs < -30:
        parser.error("--target-lufs must be in the range -30 to -8 LUFS")
    if args.true_peak > -0.1 or args.true_peak < -9:
        parser.error("--true-peak must be between -9 and -0.1 dBTP")

    ffmpeg = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
    if not ffmpeg:
        print("FFmpeg was not found. Install it or set FFMPEG_BIN.", file=sys.stderr)
        return 2
    out = Path(args.out).expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)

    command = [ffmpeg, "-y", "-hide_banner"]
    for _, path, _ in selected:
        command += ["-i", str(path)]
    labels = []
    graph = []
    for i, (label, _, gain) in enumerate(selected):
        tag = f"in{i}"
        graph.append(f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,volume={gain:.4f}[{tag}]")
        labels.append(f"[{tag}]")
    if len(selected) == 1:
        graph.append(f"{labels[0]}loudnorm=I={args.target_lufs}:TP={args.true_peak}:LRA=11:print_format=summary[mix]")
    else:
        graph.append(f"{''.join(labels)}amix=inputs={len(selected)}:duration=first:dropout_transition=0:normalize=0,loudnorm=I={args.target_lufs}:TP={args.true_peak}:LRA=11:print_format=summary[mix]")
    command += [
        "-filter_complex", ";".join(graph), "-map", "[mix]",
        "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", str(out),
    ]
    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        return result.returncode
    print(f"Wrote voice-forward mix: {out} (target {args.target_lufs:.1f} LUFS, {args.true_peak:.1f} dBTP)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
