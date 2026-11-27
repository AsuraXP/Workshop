#!/usr/bin/env python3
"""Probe and decode a rendered MP4 against the project's technical delivery settings."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys


def run_json(command: list[str]) -> dict:
    result = subprocess.run(command, capture_output=True, text=True, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "FFprobe failed")
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Project directory containing project.json")
    parser.add_argument("--allow-silent", action="store_true", help="Allow a visual-only render for a renderer smoke test")
    args = parser.parse_args()
    project = Path(args.project).expanduser().resolve()
    config_path = project / "project.json"
    storyboard_path = project / "storyboard.json"
    if not config_path.is_file():
        parser.error(f"Missing {config_path}")
    config = json.loads(config_path.read_text("utf-8"))
    storyboard = json.loads(storyboard_path.read_text("utf-8")) if storyboard_path.is_file() else {}
    expected_duration = float(config.get("duration_sec") or storyboard.get("duration_sec") or 0)
    video = (project / config.get("output", "exports/final.mp4")).resolve()
    ffprobe = os.environ.get("FFPROBE_BIN") or shutil.which("ffprobe")
    ffmpeg = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg")
    if not ffprobe or not ffmpeg:
        print("FFprobe and FFmpeg are required for media QA (set FFPROBE_BIN/FFMPEG_BIN if needed).", file=sys.stderr)
        return 2
    if not video.is_file():
        parser.error(f"Rendered MP4 not found: {video}")

    report = run_json([ffprobe, "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels", "-of", "json", str(video)])
    streams = report.get("streams", [])
    v = next((s for s in streams if s.get("codec_type") == "video"), None)
    a = next((s for s in streams if s.get("codec_type") == "audio"), None)
    problems = []
    if not v:
        problems.append("no video stream")
    else:
        width, height = int(v.get("width", 0)), int(v.get("height", 0))
        if width != int(config.get("width", 1920)) or height != int(config.get("height", 1080)):
            problems.append(f"unexpected frame size {width}x{height}")
        if v.get("codec_name") != "h264":
            problems.append(f"video codec is {v.get('codec_name')}, expected h264")
        try:
            num, den = map(int, str(v.get("r_frame_rate", "0/1")).split("/"))
            rate = num / den
            if abs(rate - float(config.get("fps", 24))) > 0.02:
                problems.append(f"frame rate is {rate:g}, expected {config.get('fps', 24)}")
        except (ValueError, ZeroDivisionError):
            problems.append("could not read frame rate")
    if not a and not args.allow_silent:
        problems.append("no audio stream (use --allow-silent only for a visual smoke test)")
    if a and a.get("codec_name") != "aac":
        problems.append(f"audio codec is {a.get('codec_name')}, expected aac")
    duration = float(report.get("format", {}).get("duration", 0))
    if expected_duration and abs(duration - expected_duration) > 0.35:
        problems.append(f"duration is {duration:.3f}s, expected about {expected_duration:.3f}s")

    decoded = subprocess.run([ffmpeg, "-v", "error", "-i", str(video), "-f", "null", "-"], capture_output=True, text=True, check=False)
    if decoded.returncode != 0:
        problems.append("FFmpeg decode failed: " + (decoded.stderr.strip()[-500:] or f"exit {decoded.returncode}"))
    if problems:
        print(f"Media QA FAILED ({len(problems)} issue(s)):")
        for item in problems:
            print(f"  - {item}")
        return 1
    audio_note = "with audio" if a else "silent visual smoke test"
    print(f"Media QA passed: {width}x{height} @ {rate:g} fps, {duration:.3f}s, {audio_note} -> {video}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
