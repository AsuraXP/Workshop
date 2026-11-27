---
name: awaken-film-studio
description: Produce atmospheric Awaken-style 2.5D/3D animated films (16:9 widescreen & 9:16 vertical) + thumbnails from a plain prompt. Visuals, MC v2 character acting, Foley, and swelling score carry 60–70% of the film; sparse natural speech (Brian via edge-tts + af_heart via Kokoro) is used ONLY when necessary (<=40% runtime, <=14 words per cue).
---

# Awaken Film Studio — Sparse-Voice Visual Cinema Skill

Turn any prompt or idea into a broadcast-clean `16:9` (or `9:16` vertical) animated short film and thumbnail—driven by **atmosphere, `MC v2` visual acting, Foley, and swelling music**, with **sparse speech used only when visuals cannot say it alone**.

Resolve `SKILL_DIR` as the directory containing this `SKILL.md` file (or `${CLAUDE_SKILL_DIR}` when set by Claude), then let `KIT="$SKILL_DIR/kit"` and `REFS="$SKILL_DIR/references"`.

---

## 1. Non-Negotiable Creative Identity

1. **Visuals Lead, Voice Only When Necessary (`$REFS/awaken-direction.md`):**
   - **Never write wall-to-wall YouTube essay narration.** Visuals, camera movement, Foley, and score carry **`60–70%`** of the runtime; spoken words occupy **`<= 40%`** (`tts.py` and `qa.py` actively warn above `42–45%`).
   - Every spoken cue is **`5–14 words max` (`1.5–3.2s`)**. Never narrate what is already visible on screen.
   - Inside spoken shots, follow **Visual Setup (`0.8–1.8s` quiet) → Short Line → Visual & Music Payoff (`1.2–2.5s` quiet)**, and keep **`>= 30%` of shots completely wordless**.
2. **House Character Rig (`MC v2` — `$REFS/engine-and-rig.md`):**
   - Recurring characters always use **`MC v2`** (`drawFigure`, `bigFace`, `handPos`, `COATS` in `/kit/engine/rig2d.js`): matte charcoal circular head with razor crescent rim light, vertical cream oval eyes, expressive pill brow bars, cylindrical-shaded rounded coat/cardigan, thin dark limbs, ball hands, and flat feet.
3. **Dual Free Voice Engine (`$REFS/voice-and-sound.md`):**
   - **Main Male:** `edge-tts` → **`en-US-BrianMultilingualNeural`** (`--voice brian`).
   - **Main Female:** `Kokoro` → **`af_heart`** (`--voice af_heart`).
   - Default cast pairs off-screen 2nd-person `brian` with wry on-screen co-star `af_heart` + a silent `MC v2` visual protagonist (or use `@voice:male`, `@voice:female`, `@voice:auto` for additional `edge-tts` male / `Kokoro` female characters, or `@silent` for zero speech).
4. **Simple Optional Modifiers (Plain Prompt Works With Zero Tags!):**
   - **Aspect:** `16:9` widescreen default; add `@vertical` (or ask for `9:16`) for `1080×1920` vertical cinema.
   - **World Palette:** `@awaken` *(default twilight)*, `@daylight`, `@cinema`, `@noir`, `@arctic`, `@emerald`, `@ember`, `@sakura`, `@retro`.
   - **Voice / Thumbnail / Review:** `@voice:male` | `@voice:female` | `@voice:auto` | `@silent` · `@thumb` *(default AI+code thumbnail)* | `@thumb:code` | `@no-thumb` · `@pause` *(stop after script + `--styles` preview grid)*.

---

## 2. Autonomous 7-Gate Studio Pipeline

Run all 7 gates end-to-end automatically unless `@pause` was requested. Keep `$KIT/engine/` untouched (project code goes in `<project>/scenes/`) and write deliverables to `<project>/exports/` (never `out/`).

### Gate 1 — Auto-Bootstrap & Sparse Script (`$REFS/awaken-direction.md`, `$REFS/qa-and-thumbnail.md`)
1. Run `python3 "$KIT/tools/verify_kit.py"` and `python3 "$KIT/tools/doctor.py"`. Auto-install any missing packages (`pip install numpy scipy pillow opencv-python-headless imageio-ffmpeg edge-tts soundfile` + `kokoro` or `kokoro-onnx`, and `npm --prefix "$KIT" install @napi-rs/canvas --no-save` if Chromium is absent).
2. Scaffold project:
   ```bash
   python3 "$KIT/tools/new_project.py" <dir> --title "<Title>" --style awaken --aspect <16:9|9:16> --duration <sec>
   ```
3. Write `production/brief.md` and a **sparse** `production/script.md` (`~45–75 words total` per 60s film, marking `[SILENT]` visual beats explicitly).

### Gate 2 — Audio-First Sparse Voice & Timing (`$REFS/voice-and-sound.md`)
1. Write `<dir>/audio/cues.json` (`<= 14 words` per cue) and synthesize via:
   ```bash
   python3 "$KIT/audio/tts.py" --project <dir> --cues <dir>/audio/cues.json
   ```
2. Check `audio/tts_report.json`: if `estimated_speech_ratio > 0.42` or any line triggered `[PACING WARN]`, **trim the lines and re-run `tts.py` now** before building shots. *(For `@silent` films, run `plan_timeline.py --project <dir> --write-shots`.)*

### Gate 3 — Cast, Multi-Plane Sets & Storyboard (`$REFS/awaken-direction.md`, `$REFS/engine-and-rig.md`)
1. Define `MC v2` presets in `production/cast.md` + `scenes/cast.js` and 3-plane sets (`0.25` bg, `0.6` mid, `1.0` stage) in `scenes/sets/*.js` + `production/locations.md`.
2. Build `story/shots.json` around the real audio durations + generous silent visual beats (`at: 0.8..1.6s` speech entry, `1.2..2.5s` post-line breathing room, `"hold": true` on calm tableaux) and lock 180° sides, `handPos` props, and `rim.dir` in `production/continuity.md`.

### Gate 4 — Swelling Score & Foley Plan (`$REFS/voice-and-sound.md`)
1. Configure `music.sections` (`curious` -> `tense` -> `uplift`) in `config.json` and spot `ambience` + `1–4` precise `sfx` cues (`sfx.py --list`) per shot in `story/shots.json`.

### Gate 5 — Scene Animation & Contact Sheet (`$REFS/engine-and-rig.md`)
1. Code `<dir>/scenes/sXX.js` in **shot-local `t` (`0 .. info.dur`)** using `layer()`, `breathe()`, `autoBlink()`, evolving `brow`/`browTilt`/`mouth`, `handPos()`, and `V(landscape, vertical)`.
2. Render & visually inspect `<dir>/exports/sheet.png` (`node "$KIT/render.mjs" --project <dir> --sheet`).

### Gate 6 — Mix, Master Render, Subtitles & Thumbnail (`$REFS/qa-and-thumbnail.md`)
1. Mix & two-pass master (`-14` or `-16 LUFS`): `python3 "$KIT/audio/mix.py" --project <dir>`
2. Render MP4: `node "$KIT/render.mjs" --project <dir> --out <dir>/exports/final.mp4`
3. Export `.srt/.vtt`: `python3 "$KIT/tools/export_srt.py" --project <dir> --vtt`
4. Generate thumbnail (`exports/thumbnail.{png,jpg}`): run `thumbnail.py --project <dir> --mode prompt --hook "<0-3 WORDS>"`, call your host AI image generator if available + `thumbnail.py --mode overlay` (or `--mode code` fallback).
5. *(Optional Live Screening Room)* `node "$KIT/serve.mjs" --project <dir> --port 4173`

### Gate 7 — Frame-Decoded QA & Critic Sign-Off (`$REFS/qa-and-thumbnail.md`)
1. Run `python3 "$KIT/tools/qa.py" --project <dir>`, visually inspect `qa/overview.jpg`, `qa/sXX.jpg`, and `exports/thumbnail.png`, verify `speech_ratio <= 0.45` and `0` errors/warnings, complete `production/qa.md`, and present `exports/final.mp4` + `exports/thumbnail.png`.
