#!/usr/bin/env python3
"""Scaffold a universal film/video project folder (works with voiceover, script, or prompt-only)."""
import argparse, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from common import save_json, media_duration

CAST_TEMPLATE = """// scenes/cast.js — recurring MC v2 characters & cast variants for this film.
import { drawFigure, bigFace, handPos, headPos, COATS } from '/kit/engine/rig2d.js';

export const CAST = {
  lead: {
    coat: COATS.cream,
    outfit: { top: 'coat' },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
  coStar: {
    coat: COATS.butter,
    outfit: { top: 'cardigan', shirtColor: COATS.cream },
    rim: { color: '#eea865', dir: [1, -0.32], w: 3.4 },
  },
};

export const drawLead = (g, o = {}) => drawFigure(g, { ...CAST.lead, ...o });
export const drawCoStar = (g, o = {}) => drawFigure(g, { ...CAST.coStar, ...o });
export const leadFace = (g, x, y, r, o = {}) => bigFace(g, x, y, r, { ...CAST.lead, ...o });
export { handPos, headPos, COATS };
"""

SET_TEMPLATE = """// scenes/sets/mainStage.js — reusable location background, midground, and foreground layers.
import { E, mood, backdrop, fillRect, linGrad, mix } from '/kit/engine/core.js';
import { hills, skyStreaks, bokeh, motes } from '/kit/engine/fx2d.js';

export function drawStageBg(g, t = 0, moodName = 'dusk') {
  const M = mood(moodName);
  backdrop(g, M.sky);
  skyStreaks(g, { n: 6, y0: 90, y1: 520, color: M.key, a: 0.14, t });
  hills(g, E.H * 0.68, 120, mix(M.ambient, M.dark, 0.25), 4);
  bokeh(g, { n: 18, y0: E.H * 0.60, y1: E.H * 0.80, color: M.practical, a: 0.24, t });
  fillRect(g, -400, E.H * 0.78, E.W + 800, E.H * 0.4, linGrad(g, 0, E.H * 0.78, 0, E.H, [M.floor, M.dark]));
  motes(g, t, { n: 26, color: M.key, speed: 12 });
}
"""

SHOT01_TEMPLATE = """// scenes/s01.js — opening shot (shot-local t in seconds: 0 .. info.dur).
import { E, V, registerShot, layer, mood, key, ease, talkAmount } from '/kit/engine/core.js';
import { breathe } from '/kit/engine/rig2d.js';
import { titleCard } from '/kit/engine/ui2d.js';
import { drawLead } from './cast.js';
import { drawStageBg } from './sets/mainStage.js';

registerShot('s01', {
  draw(g, t, _st, info) {
    const M = mood('dusk');
    const cam = { x: key(t, [[0, 0], [info.dur, 18]], ease.sine), y: 0, z: key(t, [[0, 1.0], [info.dur, 1.05]], ease.sine) };
    layer(g, cam, 0.35, () => drawStageBg(g, t, 'dusk'));
    layer(g, cam, 1.0, () => {
      drawLead(g, {
        x: E.W * 0.5, y: V(845, 1380), s: V(1.35, 1.5),
        pose: breathe(t > 1.2 ? 'wave' : 'stand', t),
        expr: t > 1.2 ? 'joy' : 'neutral',
        talk: talkAmount(info.globalT, info.start + 0.4, info.start + info.dur - 0.3),
        rim: { color: M.rim, dir: [1, -0.32], w: 3.5 },
      });
    });
    titleCard(g, t, { title: E.cfg.title || 'Untitled Film', sub: '', y: V(230, 380), hold: Math.min(2.4, info.dur * 0.65) });
  },
});
"""

BRIEF_MD = """# Production Brief

- **Title:** {title}
- **Input Mode:** {mode}
- **Genre & Tone:** (e.g., curiosity explainer, emotional short, comedy, suspense, musical)
- **Aspect & Runtime:** {aspect} @ {fps} fps (~{dur:.1f}s)
- **Visual Style:** `{style}`
- **Core Premise:** One sentence stating what changes from opening frame to final frame.
- **Motif:** One visual or sonic object that recurs and pays off.
"""

CAST_MD = """# Cast Sheet (MC v2 House Rig)

| ID | Role | Coat Color | Outfit (`top`/`head`) | Rim Color | Signature Expression / Trait |
|----|------|------------|-----------------------|-----------|------------------------------|
| `lead` | Protagonist / Host | `COATS.cream` (`#f6efdd`) | `coat` | `#eea865` | Expressive brow bars, calm curiosity |
"""

LOCATIONS_MD = """# Locations & Lighting Plan

| Set Module | Mood Preset | Key / Practical Source | Depth Planes (BG / Mid / FG) |
|------------|-------------|------------------------|------------------------------|
| `sets/mainStage.js` | `dusk` | Upper-right sunset key (`[1, -0.32]`) | Sky + hills (`0.35`), stage floor + character (`1.0`), foreground motes (`1.2`) |
"""

CONTINUITY_MD = """# Continuity Ledger

Track across every shot cut so props, outfits, screen direction, and lighting never break accidentally:

| Shot | Location & Time | Characters (`x`, `facing`, `coat`) | Held Props (`handPos`) | Light Direction (`rim.dir`) | Exit State -> Next Shot |
|------|-----------------|------------------------------------|------------------------|-----------------------------|-------------------------|
| `s01` | `mainStage` (dusk) | `lead` center, `facing: 1`, cream coat | none | `[1, -0.32]` | waves, camera settles |
"""

AUDIO_MD = """# Sound & Music Plan

- **Dialogue / Voice Mode:** {audio_mode}
- **Score Mood Arc:** (e.g., `wonder` -> `curious` -> `uplift`, or `none` for stark realism)
- **Ambience Beds:** Motivated room tone / wind / night / rain per location
- **Key Foley & Accents:** Footsteps, prop touches, subtle UI ticks, transitions
- **Loudness Target:** `{loudness} LUFS` integrated, `-1.5 dBTP` true peak (two-pass linear `loudnorm`)
"""

QA_MD = """# Critic & Technical QA Report

## Automated Checks (`tools/qa.py`)
- Pending final render.

## 8-Category Critic Rubric (0–4 each, target >= 24/32, no 0s)
| Category | Score (0–4) | Notes |
|----------|-------------|-------|
| Story & Clarity | - | |
| Visual Design & Contrast | - | |
| Composition & Camera | - | |
| Animation & Acting | - | |
| Continuity | - | |
| Sound & Music | - | |
| Edit & Pacing | - | |
| Captions & Accessibility | - | |
"""


def main():
    ap = argparse.ArgumentParser(description="Create a universal Code Film Studio project.")
    ap.add_argument("dir", help="Target folder to create")
    ap.add_argument("--script", default=None, help="Optional sparse script markdown/text file")
    ap.add_argument("--title", default="Untitled Film")
    ap.add_argument("--style", default="awaken", help="Visual world palette (awaken, daylight, cinema, noir, emerald, ember, arctic, sakura, retro)")
    ap.add_argument("--aspect", default="16:9", choices=["16:9", "9:16"])
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--duration", type=float, default=60.0, help="Target duration in seconds")
    ap.add_argument("--bars", default="none", help="Letterbox bars: none | thin | wide | scope")
    ap.add_argument("--loudness", type=float, default=-14.0, help="Target integrated LUFS (-14 web, -16 narrative)")
    args = ap.parse_args()

    proj = Path(args.dir).resolve()
    for sub in ("audio/lines", "timeline", "story", "scenes/sets", "production", "build", "qa", "exports"):
        (proj / sub).mkdir(parents=True, exist_ok=True)

    dur = float(args.duration or 60.0)
    mode = "awaken sparse-voice cinema"
    audio_mode = "Sparse speech (<=40% runtime via tts.py: brian + af_heart) + swelling score + Foley"

    if args.script:
        sc_src = Path(args.script).resolve()
        if not sc_src.exists():
            sys.exit(f"ERROR: script not found: {sc_src}")
        txt = sc_src.read_text("utf-8")
        (proj / "script.txt").write_text(txt, "utf-8")
        (proj / "production/script.md").write_text(txt, "utf-8")
    else:
        (proj / "production/script.md").write_text(
            f"# Sparse Script — {args.title}\n\n"
            "[SILENT 2.0s] Atmospheric opening visual beat.\n"
            "Short hook line — only what visuals cannot say alone.\n"
            "[SILENT 2.5s] Visual reaction, Foley, and music swell.\n",
            "utf-8",
        )

    save_json(proj / "config.json", {
        "title": args.title,
        "aspect": args.aspect,
        "width": 1920,
        "verticalWidth": 1080,
        "fps": args.fps,
        "duration": dur,
        "style": args.style,
        "voiceover": None,
        "captions": False,
        "storyCaptions": True,
        "bars": args.bars,
        "music": {"mood": "curious", "gain": -15.5},
        "loudness": args.loudness,
    })

    s1_dur = round(min(dur, 6.0), 2)
    save_json(proj / "story/shots.json", {
        "shots": [{
            "id": "s01",
            "start": 0,
            "dur": s1_dur,
            "in": "fadeBlack",
            "out": "fadeBlack" if s1_dur >= dur else "cut",
            "location": "mainStage",
            "summary": "Opening atmospheric shot",
            "ambience": {"kind": "night", "gain": -26},
            "sfx": [],
        }]
    })

    (proj / "scenes/cast.js").write_text(CAST_TEMPLATE, "utf-8")
    (proj / "scenes/sets/mainStage.js").write_text(SET_TEMPLATE, "utf-8")
    (proj / "scenes/s01.js").write_text(SHOT01_TEMPLATE, "utf-8")
    (proj / "scenes/index.js").write_text("import './s01.js';\n", "utf-8")

    (proj / "production/brief.md").write_text(
        BRIEF_MD.format(title=args.title, mode=mode, aspect=args.aspect, fps=args.fps, dur=dur, style=args.style), "utf-8"
    )
    (proj / "production/cast.md").write_text(CAST_MD, "utf-8")
    (proj / "production/locations.md").write_text(LOCATIONS_MD, "utf-8")
    (proj / "production/continuity.md").write_text(CONTINUITY_MD, "utf-8")
    (proj / "production/audio.md").write_text(AUDIO_MD.format(audio_mode=audio_mode, loudness=args.loudness), "utf-8")
    (proj / "production/qa.md").write_text(QA_MD, "utf-8")

    print(f"Created project at {proj} (mode: {mode}, aspect: {args.aspect}, target: {dur:.1f}s)")
    print("Next: write sparse cues in audio/cues.json -> run audio/tts.py -> build story/shots.json & scenes/")


if __name__ == "__main__":
    main()
