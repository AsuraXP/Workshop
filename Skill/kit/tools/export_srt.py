#!/usr/bin/env python3
"""Export .srt and optional .vtt subtitles from story/shots.json captions/subtitles or timeline/sentences.json."""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir, load_json


def fmt_srt_time(sec: float) -> str:
    ms = max(0, int(round(sec * 1000)))
    h, rem = divmod(ms, 3_600_000)
    m, rem = divmod(rem, 60_000)
    s, ms = divmod(rem, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def fmt_vtt_time(sec: float) -> str:
    return fmt_srt_time(sec).replace(",", ".")


def collect_cues(proj: Path) -> list[tuple[float, float, str]]:
    shots_doc = load_json(proj / "story/shots.json", {"shots": []})
    cues = []
    for sh in shots_doc.get("shots", []):
        st = float(sh.get("start", 0))
        dur = float(sh.get("dur", 0))
        if isinstance(sh.get("subtitles"), list) and sh["subtitles"]:
            for sub in sh["subtitles"]:
                t0 = st + float(sub.get("at", 0))
                t1 = st + float(sub.get("end", float(sub.get("at", 0)) + float(sub.get("dur", 2.0))))
                spk = (sub.get("speaker") or "").strip()
                txt = (sub.get("text") or "").strip()
                if txt:
                    cues.append((t0, min(st + dur, t1), f"{spk}: {txt}" if spk else txt))
        elif isinstance(sh.get("caption"), str) and sh["caption"].strip():
            spk = (sh.get("speaker") or "").strip()
            txt = sh["caption"].strip()
            cues.append((st + 0.08, max(st + 0.4, st + dur - 0.08), f"{spk}: {txt}" if spk else txt))

    if cues:
        return sorted(cues, key=lambda c: c[0])

    sents = load_json(proj / "timeline/sentences.json", {"sentences": []}).get("sentences", [])
    for s in sents:
        txt = (s.get("text") or "").strip()
        spk = (s.get("speaker") or "").strip()
        if txt:
            cues.append((float(s["start"]), float(s["end"]), f"{spk}: {txt}" if spk else txt))
    return sorted(cues, key=lambda c: c[0])


def main():
    ap = argparse.ArgumentParser(description="Export SRT/VTT subtitle tracks.")
    ap.add_argument("--project", required=True)
    ap.add_argument("--out", default=None, help="Output .srt path (default: <project>/exports/subtitles.srt)")
    ap.add_argument("--vtt", action="store_true", help="Also write WebVTT (.vtt)")
    args = ap.parse_args()

    proj = project_dir(args.project)
    cues = collect_cues(proj)
    out_srt = Path(args.out).resolve() if args.out else (proj / "exports/subtitles.srt")
    out_srt.parent.mkdir(parents=True, exist_ok=True)

    srt_blocks = []
    vtt_blocks = ["WEBVTT", ""]
    for i, (t0, t1, txt) in enumerate(cues, start=1):
        t1 = max(t0 + 0.25, t1)
        srt_blocks.append(f"{i}\n{fmt_srt_time(t0)} --> {fmt_srt_time(t1)}\n{txt}\n")
        vtt_blocks.append(f"{fmt_vtt_time(t0)} --> {fmt_vtt_time(t1)}\n{txt}\n")

    out_srt.write_text("\n".join(srt_blocks), "utf-8")
    print(f"Wrote {len(cues)} subtitle cues -> {out_srt}")
    if args.vtt:
        vtt_path = out_srt.with_suffix(".vtt")
        vtt_path.write_text("\n".join(vtt_blocks), "utf-8")
        print(f"Wrote WebVTT -> {vtt_path}")


if __name__ == "__main__":
    main()
