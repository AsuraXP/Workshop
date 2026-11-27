#!/usr/bin/env python3
"""Parse a timestamped script into timeline/sentences.json + interpolated timeline/words.json.

Accepted line formats (blank lines and # comments ignored):
  [00:12.4] Your brain takes 200 milliseconds just to see the ball.
  0:04 - You're standing at the plate.
  12.5: That's already half the flight time.
"""
import argparse, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir, load_json, save_json, media_duration

LINE_RE = re.compile(r"^\s*\[?(?:(\d+):)?(\d+(?:\.\d+)?)\]?\s*[-–—:]?\s+(.+?)\s*$")


def parse_lines(raw: str):
    cues = []
    for ln in raw.splitlines():
        s = ln.strip()
        if not s or s.startswith("#"):
            continue
        m = LINE_RE.match(s)
        if not m:
            sys.exit(f"ERROR: line missing timestamp -> {ln!r}\n  Expected e.g. '[00:12.4] Sentence text.' (or use plan_timeline.py for untimed scripts)")
        mm, ss, txt = m.groups()
        cues.append((int(mm or 0) * 60 + float(ss), txt))
    return sorted(cues, key=lambda x: x[0])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--script", default=None, help="Path to timestamped script (default: <project>/script.txt or production/script.md)")
    ap.add_argument("--duration", type=float, default=None, help="Total duration in seconds (default: voiceover duration, config duration, or auto-estimated)")
    args = ap.parse_args()

    proj = project_dir(args.project)
    cfg = load_json(proj / "config.json", {})
    if args.script:
        sp = Path(args.script)
    elif (proj / "script.txt").exists():
        sp = proj / "script.txt"
    else:
        sp = proj / "production/script.md"

    if not sp.exists():
        sys.exit(f"ERROR: script not found at {sp}")

    cues = parse_lines(sp.read_text("utf-8"))
    if not cues:
        sys.exit("ERROR: script had no timestamped lines")

    total = args.duration
    if total is None and cfg.get("voiceover") and (proj / cfg["voiceover"]).exists():
        total = media_duration(proj / cfg["voiceover"])
    if total is None:
        # Estimate end time of final cue from natural speaking rate (~2.6 words/sec)
        last_t, last_txt = cues[-1]
        est_tail = max(1.8, len(last_txt.split()) / 2.6 + 0.6)
        total = max(float(cfg.get("duration") or 0), round(last_t + est_tail, 2))

    sentences, words = [], []
    for i, (t0, txt) in enumerate(cues):
        nxt = cues[i + 1][0] if i + 1 < len(cues) else total
        ws = txt.split()
        est = max(0.6, len(ws) / 2.8)
        t1 = round(min(nxt - 0.08, t0 + est * 1.35), 2) if i + 1 < len(cues) else round(min(total, t0 + est * 1.25), 2)
        t1 = max(round(t0 + 0.3, 2), t1)
        sentences.append({"start": round(t0, 2), "end": t1, "text": txt})
        weights = [max(2, len(re.sub(r"\W", "", w))) + (3 if re.search(r"[,.;:!?]$", w) else 0) for w in ws]
        wsum = sum(weights) or 1
        cur = t0
        span = max(0.2, t1 - t0)
        for w, wt in zip(ws, weights):
            dur = span * (wt / wsum)
            words.append({"word": w, "start": round(cur, 2), "end": round(cur + dur * 0.92, 2)})
            cur += dur

    save_json(proj / "timeline/words.json", {"duration": round(total, 2), "source": "parsed_script", "words": words})
    save_json(proj / "timeline/sentences.json", {"duration": round(total, 2), "sentences": sentences})
    cfg["duration"] = round(total, 2)
    save_json(proj / "config.json", cfg)
    print(f"Parsed {len(sentences)} cues ({len(words)} words, {total:.1f}s) -> {proj/'timeline'}")


if __name__ == "__main__":
    main()
