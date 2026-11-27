#!/usr/bin/env python3
"""Thumbnail pipeline for Code Film Studio: AI Image Generator hook + Code fallback + Crisp Typography Finisher.

Modes:
  1. --mode prompt  : Exports <project>/exports/thumbnail_ref.png from the peak film moment and writes
                      <project>/production/thumbnail_prompt.md (style-locked MC v2 + palette prompt)
                      for the host agent's AI image generator / editor tool.
  2. --mode overlay : Takes an AI-generated image (--in raw.png), applies crisp anti-aliased 2-4 word
                      hook text (--hook "...") + optional badge (--badge "..."), and exports YouTube-ready
                      exports/thumbnail.png + <2MB exports/thumbnail.jpg.
  3. --mode code    : Standalone deterministic thumbnail from the film's hero canvas frame + cinematic
                      contrast boost + bold hook typography (used with @thumb:code or when no AI image tool exists).
"""
from __future__ import annotations
import argparse, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import KIT, project_dir, load_json

STYLE_DESCRIPTIONS: dict[str, dict[str, str]] = {
    "awaken": {
        "name": "Awaken Twilight",
        "palette": "deep twilight indigo-violet (#1c1d36), dusk periwinkle (#52497a), warm sunset peach-amber key light (#f5a86c), soft cream (#f6efdd), and glowing gold highlights (#ffd28a)",
        "accent": "#ffb86c",
    },
    "daylight": {
        "name": "Clean Daylight",
        "palette": "crisp sky blue (#cfe6ff), sunlit warm cream (#fffaf0), soft sage, charcoal silhouettes (#18171f), and warm golden sunlight (#ffd166)",
        "accent": "#ffb703",
    },
    "cinema": {
        "name": "Ink & Ember",
        "palette": "storybook slate-navy (#161b2e), warm parchment cream (#f4ecdc), and glowing ember-amber rim light (#f09d51)",
        "accent": "#f09d51",
    },
    "noir": {
        "name": "Midnight Noir",
        "palette": "inky midnight charcoal (#0d101a), cool silver-blue shadows (#2c3550), stark ivory highlights, and dramatic venetian-blind rim light",
        "accent": "#e0e6f8",
    },
    "emerald": {
        "name": "Emerald Pulse",
        "palette": "deep forest slate (#102622), bioluminescent emerald-mint (#4ce0b3), and warm gold key accents (#f4c96b)",
        "accent": "#4ce0b3",
    },
    "ember": {
        "name": "Ember Forge",
        "palette": "volcanic obsidian (#1a1014), molten crimson-copper (#ff6b4a), and incandescent gold sparks (#ffd166)",
        "accent": "#ff6b4a",
    },
    "arctic": {
        "name": "Arctic Glass",
        "palette": "deep glacial navy (#102033), crisp ice-cyan (#7ce8ff), frosted white (#eef7ff), and precision amber accents",
        "accent": "#7ce8ff",
    },
    "sakura": {
        "name": "Sakura Bloom",
        "palette": "dusk plum (#281c33), soft sakura rose-peach (#f7a8b8), warm cream, and golden dusk haze",
        "accent": "#f7a8b8",
    },
    "retro": {
        "name": "Retro Print",
        "palette": "vintage muted teal (#1f3a44), warm mustard gold (#e9b44c), coral red (#e06d53), and tactile risograph grain",
        "accent": "#e9b44c",
    },
}


def load_bold_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/System/Library/Fonts/Supplemental/Impact.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arialbd.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def pick_peak_timestamp(proj: Path, explicit_at: float | None = None) -> tuple[float, dict]:
    if explicit_at is not None:
        return float(explicit_at), {}
    shots = load_json(proj / "story/shots.json", {"shots": []}).get("shots", [])
    if not shots:
        cfg = load_json(proj / "config.json", {})
        return float(cfg.get("duration", 10.0)) * 0.55, {}
    # Pick shot around 55-70% of the film (classic climax / turn beat)
    idx = min(len(shots) - 1, max(0, int(round((len(shots) - 1) * 0.6))))
    sh = shots[idx]
    t = float(sh.get("start", 0.0)) + float(sh.get("dur", 3.0)) * 0.55
    return round(t, 2), sh


def export_reference_still(proj: Path, at_sec: float, ref_out: Path) -> bool:
    ref_out.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["node", str(KIT / "render.mjs"), "--project", str(proj), "--still", str(at_sec), "--out", str(ref_out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.returncode == 0 and ref_out.exists()


def build_ai_prompt(proj: Path, hook: str | None, focal_desc: str | None, sh: dict) -> str:
    cfg = load_json(proj / "config.json", {})
    title = cfg.get("title", "Animated Short")
    aspect = cfg.get("aspect", "16:9")
    style_id = cfg.get("style", "awaken")
    st = STYLE_DESCRIPTIONS.get(style_id, STYLE_DESCRIPTIONS["awaken"])
    summary = focal_desc or sh.get("summary") or f"The central visual twist of '{title}'"
    orient = "16:9 widescreen YouTube thumbnail (1280x720 / 1920x1080)" if aspect != "9:16" else "9:16 vertical cover frame (1080x1920)"
    hook_clause = (
        f'Leave clean, uncluttered dark/gradient negative space on the upper-left third for a bold 2-4 word title overlay ("{hook}"), '
        "or render ONLY ultra-clean, giant 3-word sans-serif typography with zero extra small text."
        if hook else
        "Keep composition bold and uncluttered with one clear focal subject and strong negative space (no tiny unreadable labels)."
    )

    return (
        f"High-impact {orient} illustration in the '{st['name']}' 2.5D animated film style. "
        f"Subject & moment: {summary}. "
        "Character design lock (MC v2 house rig): stylized minimalist 2.5D figure with a smooth matte charcoal-black "
        "circular head, a razor-thin glowing crescent rim light along one side of the head, two vertical warm-cream oval eyes, "
        "expressive floating flat pill-bar eyebrows showing awe or surprise, a rounded cylindrical cream or sage coat with soft "
        "directional shading, thin dark limbs, and solid round ball hands (no nose, no individual fingers, no realistic human skin). "
        f"Color palette: {st['palette']}. "
        "Cinematic volumetric lighting, crisp silhouette separation, subtle atmospheric glow particles, shallow depth of field. "
        f"{hook_clause} Single standalone image, no border, no collage, no watermark."
    )


def apply_hook_overlay(
    src_img: Image.Image,
    hook: str | None,
    badge: str | None,
    accent_hex: str,
    aspect: str = "16:9",
    boost_code_frame: bool = False,
) -> Image.Image:
    target_size = (1080, 1920) if aspect == "9:16" else (1280, 720)
    tw, th = target_size

    # Aspect-fill resize (center crop without distortion)
    im = src_img.convert("RGB")
    src_ratio = im.width / max(1, im.height)
    dst_ratio = tw / th
    if src_ratio > dst_ratio:
        new_w = int(round(im.height * dst_ratio))
        x0 = (im.width - new_w) // 2
        im = im.crop((x0, 0, x0 + new_w, im.height))
    else:
        new_h = int(round(im.width / dst_ratio))
        y0 = (im.height - new_h) // 2
        im = im.crop((0, y0, im.width, y0 + new_h))
    im = im.resize((tw, th), Image.Resampling.LANCZOS)

    if boost_code_frame:
        im = ImageEnhance.Contrast(im).enhance(1.16)
        im = ImageEnhance.Color(im).enhance(1.18)

    if not hook and not badge:
        return im

    rgba = im.convert("RGBA")
    # Subtle readability gradient on the text side (left for 16:9, top for 9:16)
    grad = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    if aspect == "9:16":
        for y in range(int(th * 0.42)):
            a = int(175 * (1.0 - y / (th * 0.42)) ** 1.5)
            gd.line([(0, y), (tw, y)], fill=(8, 10, 20, a))
    else:
        for x in range(int(tw * 0.62)):
            a = int(185 * (1.0 - x / (tw * 0.62)) ** 1.4)
            gd.line([(x, 0), (x, th)], fill=(8, 10, 20, a))
    rgba = Image.alpha_composite(rgba, grad)

    # Parse accent hex
    hx = accent_hex.lstrip("#")
    acc_rgb = tuple(int(hx[i : i + 2], 16) for i in (0, 2, 4)) if len(hx) == 6 else (255, 184, 108)

    pad_x = 64 if aspect != "9:16" else 68
    cur_y = 76 if aspect != "9:16" else 130
    draw = ImageDraw.Draw(rgba)

    if badge:
        b_font = load_bold_font(26 if aspect != "9:16" else 34)
        b_txt = badge.strip().upper()
        bb = draw.textbbox((0, 0), b_txt, font=b_font)
        bw, bh = bb[2] - bb[0] + 34, bb[3] - bb[1] + 18
        draw.rounded_rectangle([pad_x, cur_y, pad_x + bw, cur_y + bh], radius=10, fill=(*acc_rgb, 245))
        draw.text((pad_x + 17, cur_y + 7), b_txt, font=b_font, fill=(18, 18, 28, 255))
        cur_y += bh + 22

    if hook:
        words = hook.strip().upper().split()
        lines: list[str] = []
        cur = ""
        max_chars = 13 if aspect != "9:16" else 11
        for w in words:
            cand = f"{cur} {w}".strip()
            if cur and len(cand) > max_chars:
                lines.append(cur)
                cur = w
            else:
                cur = cand
        if cur:
            lines.append(cur)
        lines = lines[:3]

        font_px = 86 if (aspect != "9:16" and max(len(l) for l in lines) <= 11) else (70 if aspect != "9:16" else 92)
        h_font = load_bold_font(font_px)

        # Soft drop shadow layer
        sh_layer = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh_layer)
        y_line = cur_y
        for ln in lines:
            sd.text((pad_x + 5, y_line + 7), ln, font=h_font, fill=(0, 0, 0, 220))
            y_line += int(font_px * 1.12)
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(radius=6))
        rgba = Image.alpha_composite(rgba, sh_layer)

        draw = ImageDraw.Draw(rgba)
        y_line = cur_y
        for idx, ln in enumerate(lines):
            fill_col = (*acc_rgb, 255) if (idx == len(lines) - 1 and len(lines) > 1) else (255, 252, 245, 255)
            draw.text(
                (pad_x, y_line),
                ln,
                font=h_font,
                fill=fill_col,
                stroke_width=4,
                stroke_fill=(12, 14, 24, 255),
            )
            y_line += int(font_px * 1.12)

    return rgba.convert("RGB")


def save_thumbnail_outputs(final_rgb: Image.Image, out_png: Path):
    out_png.parent.mkdir(parents=True, exist_ok=True)
    final_rgb.save(out_png, format="PNG", optimize=True)
    # Also save <2MB YouTube-compliant JPEG alongside PNG
    out_jpg = out_png.with_suffix(".jpg")
    for q in (93, 88, 82, 76):
        final_rgb.save(out_jpg, format="JPEG", quality=q, optimize=True)
        if out_jpg.stat().st_size < 1_950_000:
            break
    print(f"Wrote thumbnail -> {out_png} and {out_jpg} ({out_jpg.stat().st_size // 1024} KB)")


def main():
    ap = argparse.ArgumentParser(description="Generate AI thumbnail prompt/reference or composite final YouTube/Shorts thumbnail.")
    ap.add_argument("--project", required=True, help="Project folder")
    ap.add_argument("--mode", choices=["prompt", "overlay", "code"], default="prompt")
    ap.add_argument("--at", type=float, default=None, help="Timestamp in seconds for hero reference frame")
    ap.add_argument("--in-image", dest="in_image", default=None, help="Input AI-generated image for --mode overlay")
    ap.add_argument("--hook", default=None, help="Short 2-4 word bold hook text (e.g. 'ZERO TOUCHES?')")
    ap.add_argument("--badge", default=None, help="Optional small top pill tag (e.g. 'PHYSICS')")
    ap.add_argument("--subject", default=None, help="Optional custom description of the thumbnail focal scene")
    ap.add_argument("--out", default=None, help="Output PNG path (default: <project>/exports/thumbnail.png)")
    args = ap.parse_args()

    proj = project_dir(args.project)
    cfg = load_json(proj / "config.json", {})
    aspect = cfg.get("aspect", "16:9")
    style_id = cfg.get("style", "awaken")
    accent = STYLE_DESCRIPTIONS.get(style_id, STYLE_DESCRIPTIONS["awaken"])["accent"]

    at_sec, sh = pick_peak_timestamp(proj, args.at)
    ref_png = proj / "exports/thumbnail_ref.png"
    out_png = Path(args.out).resolve() if args.out else (proj / "exports/thumbnail.png")

    if args.mode == "prompt":
        ok = export_reference_still(proj, at_sec, ref_png)
        prompt_txt = build_ai_prompt(proj, args.hook, args.subject, sh)
        prompt_md = proj / "production/thumbnail_prompt.md"
        prompt_md.parent.mkdir(parents=True, exist_ok=True)
        prompt_md.write_text(
            f"# Thumbnail Plan & AI Prompt\n\n"
            f"- **Hero Reference Frame (`t={at_sec}s`):** `{ref_png.relative_to(proj) if ok else 'n/a'}`\n"
            f"- **Target Aspect:** `{aspect}` (`1280x720` YouTube `<2MB` / `1080x1920` Vertical)\n"
            f"- **Hook Text:** `{args.hook or '(none / visual-only)'}`\n\n"
            f"## Image Generation Prompt\n\n```text\n{prompt_txt}\n```\n",
            "utf-8",
        )
        print(f"Exported reference frame ({'ok' if ok else 'skipped'}): {ref_png}")
        print(f"Wrote AI thumbnail prompt: {prompt_md}\n")
        print(prompt_txt)
        return

    if args.mode == "overlay":
        if not args.in_image or not Path(args.in_image).exists():
            sys.exit("ERROR: --mode overlay requires --in-image <existing-image.png>")
        raw = Image.open(args.in_image)
        composed = apply_hook_overlay(raw, args.hook, args.badge, accent, aspect=aspect, boost_code_frame=False)
        save_thumbnail_outputs(composed, out_png)
        return

    # --mode code: deterministic hero frame + contrast polish + bold hook overlay
    if not export_reference_still(proj, at_sec, ref_png):
        sys.exit("ERROR: Could not render hero frame for --mode code thumbnail")
    raw = Image.open(ref_png)
    hook_text = args.hook if args.hook is not None else cfg.get("title", "")
    composed = apply_hook_overlay(raw, hook_text, args.badge, accent, aspect=aspect, boost_code_frame=True)
    save_thumbnail_outputs(composed, out_png)


if __name__ == "__main__":
    main()
