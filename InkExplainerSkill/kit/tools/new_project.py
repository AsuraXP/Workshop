#!/usr/bin/env python3
"""Scaffold an independent InkExplainerSkill video project."""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "kit" / "templates" / "project"
SCENE_KIT = ROOT / "kit" / "scene-kit.mjs"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("path", help="New project directory")
    parser.add_argument("--title", default="Untitled Ink Explainer")
    parser.add_argument("--force", action="store_true", help="Allow creating the project directory if it is not empty")
    args = parser.parse_args()
    destination = Path(args.path).expanduser().resolve()
    if destination.exists() and any(destination.iterdir()) and not args.force:
        parser.error(f"Directory is not empty (use --force to add scaffold files): {destination}")
    destination.mkdir(parents=True, exist_ok=True)
    for relative in ("audio", "src", "exports"):
        (destination / relative).mkdir(parents=True, exist_ok=True)

    config = {
        "title": args.title,
        "width": 1920,
        "height": 1080,
        "fps": 24,
        "duration_sec": 0,
        "voice": "en-US-BrianMultilingualNeural",
        "audio_mix": "audio/mix.wav",
        "output": "exports/final.mp4",
        "contact_sheet": "exports/contact-sheet.png",
    }
    (destination / "project.json").write_text(json.dumps(config, indent=2) + "\n", "utf-8")
    (destination / "storyboard.json").write_text(json.dumps({"title": args.title, "duration_sec": 0, "word_count": 0, "shots": []}, indent=2) + "\n", "utf-8")
    (destination / "narration.txt").write_text("", "utf-8")
    shutil.copy2(SCENE_KIT, destination / "src" / "scene-kit.mjs")
    shutil.copy2(TEMPLATE / "scenes.mjs", destination / "src" / "scenes.mjs")
    print(f"Created Ink Explainer project: {destination}")
    print("Next: write narration.txt, synthesize with Brian, plan/fill storyboard.json, then author src/scenes.mjs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
