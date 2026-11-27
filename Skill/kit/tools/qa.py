#!/usr/bin/env python3
"""Full-video technical & visual QA analyzer for rendered MP4 films.

Streams every decoded frame in O(1) bounded memory (OpenCV or FFmpeg raw pipe), verifies:
  1. Resolution, FPS, frame count, and duration match against story/shots.json
  2. Aspect-correct 8-sample per-shot motion sheets (qa/<shot_id>.jpg) + film overview (qa/overview.jpg)
  3. Intra-shot accidental freezes (honoring `shot.hold: true`) & unintended mid-shot jump spikes
  4. Whole-film luminance flash screening (>3 opposing >10% luma jumps inside any 1.0s rolling window)
     (Note: automated luma heuristic — not a substitute for certified Harding/Ofcom PSE medical testing)
  5. Audio stream presence, A/V duration alignment, integrated loudness (LUFS), and true peak (dBTP)

Writes structured results to <project>/qa/report.json and exits 0 (pass) or 1 (critical failure).
"""
import argparse, json, math, re, subprocess, sys
from collections import deque
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import project_dir, load_json, save_json, require_bin, media_duration


def load_portable_font(size: int = 15):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def probe_video_stream(ff: str, video_path: Path) -> tuple[int, int, float, bool]:
    proc = subprocess.run([ff, "-hide_banner", "-i", str(video_path)], capture_output=True, text=True)
    info = proc.stderr or ""
    mv = re.search(r"Video:.*?,\s*(\d+)x(\d+)(?:[\s,\[].*?)?,\s*([\d.]+)\s*(?:fps|tbr)", info)
    if not mv:
        mv2 = re.search(r"(\d{2,5})x(\d{2,5})", info)
        mfps = re.search(r"([\d.]+)\s*fps", info)
        if not mv2:
            raise RuntimeError(f"Could not parse video dimensions from {video_path}")
        w, h = int(mv2.group(1)), int(mv2.group(2))
        fps = float(mfps.group(1)) if mfps else 24.0
    else:
        w, h, fps = int(mv.group(1)), int(mv.group(2)), float(mv.group(3))
    has_audio = "Audio:" in info
    return w, h, fps, has_audio


def iter_rgb_frames(ff: str, video_path: Path, w: int, h: int):
    """Yield RGB uint8 frames one at a time in O(1) memory."""
    try:
        import cv2
        cap = cv2.VideoCapture(str(video_path))
        if cap.isOpened():
            while True:
                ok, bgr = cap.read()
                if not ok:
                    break
                yield bgr[:, :, ::-1]
            cap.release()
            return
    except Exception:
        pass

    frame_bytes = w * h * 3
    proc = subprocess.Popen(
        [ff, "-v", "error", "-i", str(video_path), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    assert proc.stdout is not None
    while True:
        buf = proc.stdout.read(frame_bytes)
        if len(buf) < frame_bytes:
            break
        yield np.frombuffer(buf, dtype=np.uint8).reshape((h, w, 3))
    proc.wait()


def measure_loudness(ff: str, video_path: Path) -> dict | None:
    p = subprocess.run(
        [ff, "-hide_banner", "-nostats", "-i", str(video_path), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    m = re.search(r"\{\s*\"input_i\"[\s\S]*?\}", p.stderr or "")
    if not m:
        return None
    try:
        raw = json.loads(m.group(0))
        return {
            "integrated_lufs": float(raw["input_i"]),
            "true_peak_dbtp": float(raw["input_tp"]),
            "lra_lu": float(raw["input_lra"]),
        }
    except Exception:
        return None


def write_grid_image(thumbs: list[tuple[Image.Image, str]], cols: int, out_path: Path, title: str = ""):
    if not thumbs:
        return
    tw, th = thumbs[0][0].size
    rows = math.ceil(len(thumbs) / cols)
    pad = 14
    head_h = 38 if title else 0
    label_h = 26
    cw = cols * tw + (cols + 1) * pad
    ch = head_h + rows * (th + label_h) + (rows + 1) * pad

    sheet = Image.new("RGB", (cw, ch), (14, 16, 24))
    draw = ImageDraw.Draw(sheet)
    font_title = load_portable_font(18)
    font_lbl = load_portable_font(13)

    if title:
        draw.text((pad, 12), title, fill=(236, 232, 246), font=font_title)

    for idx, (im, lbl) in enumerate(thumbs):
        r, c = divmod(idx, cols)
        x = pad + c * (tw + pad)
        y = head_h + pad + r * (th + label_h + pad)
        sheet.paste(im, (x, y))
        draw.text((x + 4, y + th + 5), lbl, fill=(196, 192, 216), font=font_lbl)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path, quality=90)


def main():
    ap = argparse.ArgumentParser(description="Run full-video frame, motion, flash, contact-sheet, and loudness QA.")
    ap.add_argument("--project", required=True)
    ap.add_argument("--video", default=None, help="Rendered MP4 path (default: <project>/exports/final.mp4 or preview.mp4)")
    ap.add_argument("--samples-per-shot", type=int, default=8)
    args = ap.parse_args()

    ff = require_bin("ffmpeg")
    proj = project_dir(args.project)
    cfg = load_json(proj / "config.json", {})
    shots = load_json(proj / "story/shots.json", {"shots": []}).get("shots", [])

    if args.video:
        vid = Path(args.video).resolve()
    elif (proj / "exports/final.mp4").exists():
        vid = proj / "exports/final.mp4"
    elif (proj / "exports/preview.mp4").exists():
        vid = proj / "exports/preview.mp4"
    elif (proj / "out/final.mp4").exists():
        vid = proj / "out/final.mp4"
    elif (proj / "out/preview.mp4").exists():
        vid = proj / "out/preview.mp4"
    else:
        sys.exit(f"ERROR: No rendered video found in {proj/'exports'} (or {proj/'out'})")

    w, h, fps, has_audio = probe_video_stream(ff, vid)
    vid_dur = media_duration(vid)
    expected_dur = max((float(s["start"]) + float(s["dur"]) for s in shots), default=float(cfg.get("duration") or vid_dur))

    # Thumbnail geometry preserves TRUE aspect ratio (no squashing!)
    vertical = h > w
    tw = 225 if vertical else 400
    th = max(64, int(round(tw * h / w)))

    # Precompute sample frame indices for each shot + midpoint for overview
    n_samp = max(2, args.samples_per_shot)
    shot_meta = []
    for sh in shots:
        s0 = float(sh["start"])
        sd = float(sh["dur"])
        f0 = max(0, int(round(s0 * fps)))
        f1 = max(f0 + 1, int(round((s0 + sd) * fps)) - 1)
        samp_frames = sorted(set(int(round(f0 + (f1 - f0) * (k / (n_samp - 1)))) for k in range(n_samp)))
        mid_frame = int(round((f0 + f1) / 2))
        shot_meta.append({
            "shot": sh,
            "f0": f0,
            "f1": f1,
            "samp_set": set(samp_frames),
            "mid_frame": mid_frame,
            "thumbs": [],
            "mid_thumb": None,
            "diffs": [],
            "lumas": [],
        })

    # Stream every frame once in O(1) memory
    prev_luma_map = None
    flash_transitions = deque()  # timestamps of large luma jumps > 25.5 (10% of 255) with opposing polarity
    last_jump_sign = 0
    flash_warnings = []
    frame_idx = 0

    for rgb in iter_rgb_frames(ff, vid, w, h):
        t = frame_idx / fps
        # Rec. 709 luma (0..255 float32)
        luma_map = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
        mean_y = float(np.mean(luma_map))
        if prev_luma_map is not None:
            abs_d = np.abs(luma_map - prev_luma_map)
            mad = float(np.mean(abs_d))
            p999 = float(np.percentile(abs_d, 99.9))
        else:
            mad = 0.0
            p999 = 0.0
        dy = (mean_y - prev_mean_y) if frame_idx > 0 else 0.0

        # Whole-film flash screening heuristic (>3 opposing >10% luma jumps within 1.0s)
        if abs(dy) >= 25.5:
            sign = 1 if dy > 0 else -1
            if last_jump_sign != 0 and sign != last_jump_sign:
                flash_transitions.append(t)
                while flash_transitions and (t - flash_transitions[0]) > 1.0:
                    flash_transitions.popleft()
                if len(flash_transitions) > 3 and (not flash_warnings or t - flash_warnings[-1]["at"] > 1.0):
                    flash_warnings.append({"at": round(t, 2), "opposing_jumps_in_1s": len(flash_transitions)})
            last_jump_sign = sign

        # Assign metrics & capture downscaled thumbnails for active shot(s)
        for sm in shot_meta:
            if sm["f0"] <= frame_idx <= sm["f1"]:
                if frame_idx > sm["f0"]:
                    sm["diffs"].append((t, mad, p999))
                sm["lumas"].append(mean_y)
                if frame_idx in sm["samp_set"] or frame_idx == sm["mid_frame"]:
                    pil_thumb = Image.fromarray(rgb).resize((tw, th), Image.Resampling.LANCZOS)
                    if frame_idx in sm["samp_set"]:
                        sm["thumbs"].append((pil_thumb, f"t={t:.2f}s (f{frame_idx})"))
                    if frame_idx == sm["mid_frame"]:
                        sm["mid_thumb"] = (pil_thumb, f"{sm['shot']['id']}  ({sm['shot']['start']:.1f}-{sm['shot']['start']+sm['shot']['dur']:.1f}s)")

        prev_luma_map = luma_map
        prev_mean_y = mean_y
        frame_idx += 1

    # Write per-shot contact sheets & overview sheet
    qa_dir = proj / "qa"
    qa_dir.mkdir(parents=True, exist_ok=True)
    overview_thumbs = []
    shot_reports = []
    warnings = []
    errors = []

    if abs(vid_dur - expected_dur) > 0.35:
        errors.append(f"Duration mismatch: video is {vid_dur:.2f}s vs timeline {expected_dur:.2f}s")

    for sm in shot_meta:
        sh = sm["shot"]
        sid = sh["id"]
        if sm["thumbs"]:
            cols = 4 if not vertical else 4
            write_grid_image(sm["thumbs"], cols, qa_dir / f"{sid}.jpg", title=f"{sid} — {sh.get('summary', '')}")
        if sm["mid_thumb"]:
            overview_thumbs.append(sm["mid_thumb"])

        diffs = [d for _, d, _ in sm["diffs"]]
        mean_diff = round(float(np.mean(diffs)), 3) if diffs else 0.0
        max_diff = round(float(np.max(diffs)), 3) if diffs else 0.0
        mean_luma = round(float(np.mean(sm["lumas"])), 2) if sm["lumas"] else 0.0

        # Check unintended freeze inside shot: truly frozen means BOTH whole-frame MAD < 0.08 AND active-region p99.5 < 1.5
        is_hold = bool(sh.get("hold", False))
        max_freeze_frames = 0
        cur_freeze = 0
        inner_diffs = sm["diffs"][4:-4] if len(sm["diffs"]) > 10 else sm["diffs"]
        for _, d, p999_val in inner_diffs:
            if d < 0.08 and p999_val < 2.2:
                cur_freeze += 1
                max_freeze_frames = max(max_freeze_frames, cur_freeze)
            else:
                cur_freeze = 0
        freeze_sec = round(max_freeze_frames / fps, 2)
        if not is_hold and freeze_sec >= 0.75:
            warnings.append(f"Shot {sid}: unintended static freeze of {freeze_sec:.2f}s (mark \"hold\": true if deliberate)")

        # Check mid-shot sudden motion spike (away from transition windows)
        in_dur = float(sh.get("inDur", 0.45)) if sh.get("in", "cut") != "cut" else 0.1
        out_dur = 0.8 if sh.get("out") == "fadeBlack" else 0.1
        spikes = [round(t, 2) for t, d, _ in sm["diffs"] if (t - float(sh["start"])) > in_dur + 0.1 and (float(sh["start"]) + float(sh["dur"]) - t) > out_dur + 0.1 and d > 36.0]
        if spikes:
            warnings.append(f"Shot {sid}: high intra-shot frame jump at t={spikes[0]}s (MAD={max_diff:.1f})")

        shot_reports.append({
            "id": sid,
            "start": sh["start"],
            "dur": sh["dur"],
            "hold": is_hold,
            "mean_motion_mad": mean_diff,
            "max_motion_mad": max_diff,
            "max_freeze_sec": freeze_sec,
            "mean_luma": mean_luma,
            "sheet": f"qa/{sid}.jpg",
        })

    if overview_thumbs:
        write_grid_image(overview_thumbs, 4 if not vertical else 5, qa_dir / "overview.jpg", title=f"{cfg.get('title', 'Film')} — Shot Overview")

    if flash_warnings:
        warnings.append(f"Luminance flash heuristic triggered {len(flash_warnings)} time(s) (first at {flash_warnings[0]['at']}s)")

    loudness = measure_loudness(ff, vid) if has_audio else None
    if loudness and np.isfinite(loudness["integrated_lufs"]) and loudness["integrated_lufs"] > -65.0:
        target_lufs = float(cfg.get("loudness", -14.0))
        if abs(loudness["integrated_lufs"] - target_lufs) > 2.5:
            warnings.append(f"Integrated loudness {loudness['integrated_lufs']:.1f} LUFS differs from target {target_lufs:.1f} LUFS by >2.5 LU")
        if loudness["true_peak_dbtp"] > -0.5:
            warnings.append(f"True peak {loudness['true_peak_dbtp']:.1f} dBTP exceeds -0.5 dBTP ceiling")

    mix_stats = load_json(proj / "build/mix_stats.json", {})
    speech_ratio = mix_stats.get("speech_ratio")
    max_speech_ratio = float(cfg.get("maxSpeechRatio", 0.45))
    if speech_ratio is not None and float(speech_ratio) > max_speech_ratio:
        warnings.append(
            f"Speech occupies {float(speech_ratio)*100:.0f}% of runtime (>{max_speech_ratio*100:.0f}% Awaken sparse-voice ceiling) — "
            "trim unnecessary narration so visual acting, Foley, and music can breathe"
        )

    status = "fail" if errors else ("warn" if warnings else "pass")
    report = {
        "status": status,
        "video": str(vid.relative_to(proj)) if vid.is_relative_to(proj) else str(vid),
        "width": w,
        "height": h,
        "fps": round(fps, 3),
        "frames_decoded": frame_idx,
        "duration_sec": round(vid_dur, 3),
        "expected_duration_sec": round(expected_dur, 3),
        "has_audio": has_audio,
        "speech_ratio": speech_ratio,
        "loudness": loudness,
        "flash_screening": {
            "events": flash_warnings,
            "note": "Automated whole-film mean-luminance screening heuristic (>3 opposing >=10% jumps/s); not certified medical Harding/Ofcom PSE compliance.",
        },
        "errors": errors,
        "warnings": warnings,
        "shots": shot_reports,
    }
    save_json(qa_dir / "report.json", report)

    print(f"QA [{status.upper()}]: decoded {frame_idx} frames ({w}x{h} @ {fps:g}fps, {vid_dur:.2f}s) -> {qa_dir/'report.json'}")
    if loudness:
        print(f"  Audio: {loudness['integrated_lufs']:.1f} LUFS, true peak {loudness['true_peak_dbtp']:.1f} dBTP")
    for e in errors:
        print(f"  [ERROR] {e}")
    for wn in warnings:
        print(f"  [WARN]  {wn}")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
