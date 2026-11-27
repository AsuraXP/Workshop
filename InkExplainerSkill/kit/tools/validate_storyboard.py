#!/usr/bin/env python3
"""Check shot timing, word coverage, and required visual direction before rendering."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

PLACEHOLDERS = {"todo", "tbd", "fill me", "placeholder", "unknown"}
SCENE_NAME = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shots", required=True, help="Storyboard JSON path")
    parser.add_argument("--require-art", action="store_true", help="Require camera, composition, visual, and scene fields")
    parser.add_argument("--tolerance", type=float, default=0.08, help="Allowed timeline boundary drift in seconds")
    parser.add_argument("--max-shot", type=float, default=3.0, help="Maximum normal shot duration in seconds")
    args = parser.parse_args()

    path = Path(args.shots).expanduser().resolve()
    if not path.is_file():
        parser.error(f"Storyboard not found: {path}")
    data = json.loads(path.read_text("utf-8"))
    shots = data.get("shots")
    duration = float(data.get("duration_sec", 0))
    if not isinstance(shots, list) or not shots:
        parser.error("Storyboard must contain a non-empty 'shots' array")

    errors: list[str] = []
    if duration <= 0:
        errors.append("duration_sec must be positive")
    if abs(float(shots[0].get("start", -999))) > args.tolerance:
        errors.append("first shot must start at 0 seconds")

    ids = []
    seen_word_ids = []
    previous_end = 0.0
    previous_framing = None
    for i, shot in enumerate(shots, 1):
        label = f"shot {i}"
        try:
            start = float(shot["start"])
            end = float(shot["end"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"{label}: missing numeric start/end")
            continue
        if end <= start:
            errors.append(f"{label}: end must be after start")
        if i > 1 and abs(start - previous_end) > args.tolerance:
            errors.append(f"{label}: timing gap/overlap at {start:.3f}s; previous ends at {previous_end:.3f}s")
        shot_duration = end - start
        if shot_duration > args.max_shot + args.tolerance and not str(shot.get("hold_reason", "")).strip():
            errors.append(f"{label}: {shot_duration:.2f}s exceeds {args.max_shot:.2f}s without hold_reason")
        if "id" in shot:
            ids.append(shot["id"])
        word_ids = shot.get("word_ids", [])
        if not isinstance(word_ids, list) or not word_ids:
            errors.append(f"{label}: missing word_ids")
        else:
            seen_word_ids.extend(int(x) for x in word_ids)
        if args.require_art:
            for field in ("camera", "composition", "visual", "scene"):
                value = str(shot.get(field, "")).strip()
                if not value or value.lower() in PLACEHOLDERS:
                    errors.append(f"{label}: required {field} description is empty or a placeholder")
            scene = str(shot.get("scene", "")).strip()
            if scene and not SCENE_NAME.fullmatch(scene):
                errors.append(f"{label}: scene must be an exported JS identifier (letters, digits, underscore)")
        framing = (str(shot.get("camera", "")).strip().lower(), str(shot.get("composition", "")).strip().lower())
        if previous_framing and framing != ("", "") and framing == previous_framing:
            errors.append(f"{label}: repeats the previous camera and composition; change the framing")
        if framing != ("", ""):
            previous_framing = framing
        previous_end = end

    if len(ids) != len(set(ids)):
        errors.append("shot ids must be unique")
    if seen_word_ids != sorted(seen_word_ids):
        errors.append("word_ids must remain in narration order")
    if len(seen_word_ids) != len(set(seen_word_ids)):
        errors.append("a narration word is assigned to more than one panel")
    expected_count = data.get("word_count")
    if expected_count is not None:
        expected = list(range(1, int(expected_count) + 1))
        if seen_word_ids != expected:
            missing = sorted(set(expected) - set(seen_word_ids))[:12]
            extra = sorted(set(seen_word_ids) - set(expected))[:12]
            errors.append(f"word coverage mismatch (missing={missing}, extra={extra})")
    if abs(previous_end - duration) > args.tolerance:
        errors.append(f"last shot ends at {previous_end:.3f}s, storyboard duration is {duration:.3f}s")

    if errors:
        print(f"Storyboard validation FAILED ({len(errors)} issue(s)):")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(f"Storyboard validated: {len(shots)} shots, {len(seen_word_ids)} word IDs, {duration:.3f}s.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
