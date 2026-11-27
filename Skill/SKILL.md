---
name: code-film-studio
description: Produce complete animated 2D, 2.5D, and 3D films or videos in code from ANY starting point—a plain prompt/topic ("make a 45s video about..."), a script or dialogue, a voiceover audio file, or a silent/musical beat concept. Combines an autonomous 7-gate virtual studio crew, the parameterized MC v2 character rig, Canvas2D + Three.js rendering across 9 visual styles (16:9 & 9:16), procedural music + 35+ Foley SFX with two-pass loudness mastering, live Screening Room preview, and frame-decoded QA.
---

# Code Film Studio — Universal Autonomous Film & Video Skill

Produce broadcast-clean `16:9` or `9:16` MP4 films entirely from deterministic code—no stock footage, no paid external APIs, and no single-genre formula.

Resolve `SKILL_DIR` as the directory containing this `SKILL.md` file (or `${CLAUDE_SKILL_DIR}` when set by Claude), then let `KIT="$SKILL_DIR/kit"` and `REFS="$SKILL_DIR/references"`.

---

## Autonomous Execution Contract ("Plug In & Describe Your Video")

1. **End-to-End by Default:** When the user asks for a video (e.g., *"Make a 45-second video explaining why ice is slippery"* or *"Turn my voiceover.mp3 into a vertical short"*), **execute all 7 gates end-to-end automatically**—brief, script, `MC v2` cast, multi-plane locations, storyboard, scene code, procedural music + Foley SFX + `-14 LUFS` master mix, `1080p` MP4 render, `.srt/.vtt` subtitles, and frame-decoded `qa.py` verification—without pausing for manual approval at intermediate gates unless the user explicitly asked to stop at a storyboard or style sheet first.
2. **Universal Intake (4 Input Modes):**
   - **Mode A — Voiceover (`--voice audio.mp3` + optional script):** Align words via `tools/transcribe.py` (or `tools/parse_script.py`), preserve the user's recording, and auto-duck score & ambience under speech.
   - **Mode B — Idea / Topic / Prompt only ("Make a video about..."):** Act as Showrunner + Researcher + Writer. Write `production/brief.md` and `production/script.md`, verify facts if educational, synthesize TTS dialogue/narration if speech tools are available in the host agent (or use clean timed captions + score via `tools/plan_timeline.py --write-shots`), and build the complete film.
   - **Mode C — Script or Dialogue only:** Parse timestamped lines (`tools/parse_script.py`) or untimed narration/dialogue/`[SILENT]` beats (`tools/plan_timeline.py --write-shots`), plus optional per-shot `dialogue` audio clips (supporting natural L-cuts across shots).
   - **Mode D — Silent / Visual / Musical film:** Plan phrasing via `tools/plan_timeline.py --bpm <BPM> --duration <sec> --write-shots` or silent visual beats, letting visual acting, music, and Foley carry the story.
3. **House Character Rig (`MC v2`):** Recurring human characters use **`MC v2`** (`drawFigure`, `bigFace`, `handPos`, `COATS` in `/kit/engine/rig2d.js`; `figure3D` in `/kit/engine/three-kit.js`): matte dark circular head with razor-tapered crescent rim light, vertical warm-cream oval eyes, expressive flat pill brow bars, understated mouth, cylindrical-shaded rounded tunic/coat (`COATS` + `cardigan`, `labcoat`, `hoodie`, `suit`, `elder`, etc.), crisp limbs, solid ball hands, and flat feet.
4. **9 Built-In Visual Styles & Genre-Adaptive Direction:** Choose the style that fits the story (`awaken` default twilight, `daylight`, `cinema`, `noir`, `arctic`, `emerald`, `ember`, `sakura`, `retro` — or preview all 9 side-by-side via `node "$KIT/render.mjs" --project <dir> --styles --at <sec>`). Default `bars` is `"none"`, static holds (`"hold": true`) are valid when motivated, data cards belong in explainers rather than pure dramas, and closing cards (`endCard`) never add a `"Subscribe"` button unless requested.
5. **Kit Integrity & Visible Exports:** Keep `$KIT/engine/` untouched for single projects—project code belongs in `<project>/scenes/`. Always write rendered deliverables to `<project>/exports/` (or workspace root), never `out/`, so cloud sandboxes and Git snapshots never hide output files.

---

## The 7-Gate Studio Pipeline

Read the targeted reference manual in `$REFS/` at each gate rather than guessing APIs:

### Gate 1 — Environment Auto-Bootstrap, Intake & Story (`$REFS/production-roles.md`, `$REFS/install.md`)
1. Run `python3 "$KIT/tools/verify_kit.py"` and `python3 "$KIT/tools/doctor.py"`.
   - **Auto-bootstrap missing packages:** If `doctor.py` shows missing Python libraries (`numpy`, `scipy`, `pillow`, `opencv-python-headless`, `imageio-ffmpeg`) or missing headless canvas (`@napi-rs/canvas` when Playwright Chromium is absent), install them automatically (`pip install numpy scipy pillow opencv-python-headless imageio-ffmpeg` and `npm --prefix "$KIT" install @napi-rs/canvas --no-save`).
2. Scaffold the project folder:
   ```bash
   python3 "$KIT/tools/new_project.py" <project_dir> --title "<Title>" --style awaken --aspect 16:9 [--voice vo.mp3] [--script script.md] [--duration 45]
   ```
3. Complete `<project>/production/brief.md` and `<project>/production/script.md`.
4. Build `<project>/timeline/` (`words.json`, `sentences.json`, `beats.json`) using the matching tool:
   - Voiceover -> `python3 "$KIT/tools/transcribe.py" --project <dir>` + `python3 "$KIT/tools/beats.py" --project <dir>`
   - Timestamped script -> `python3 "$KIT/tools/parse_script.py" --project <dir>`
   - Untimed script / dialogue / silent / BPM -> `python3 "$KIT/tools/plan_timeline.py" --project <dir> --write-shots`

### Gate 2 — Cast, Locations & Visual Style (`$REFS/style-bible.md`)
1. Define recurring `MC v2` cast presets (`coat`, `outfit`, `rim`) in `<project>/production/cast.md` and `<project>/scenes/cast.js`.
2. Design reusable multi-plane location modules in `<project>/scenes/sets/*.js` and document lighting direction (`rim.dir`) in `<project>/production/locations.md`.

### Gate 3 — Storyboard & Continuity Ledger (`$REFS/production-roles.md`, `$REFS/animation.md`)
1. Author `<project>/story/shots.json` with varied shot scales (wide / two-shot / `bigFace` close-up / schematic or prop insert), motivated transitions, captions/subtitles, and `"hold": true` on deliberate still shots.
2. Fill `<project>/production/continuity.md` so coat colors, 180° screen sides, prop sockets (`handPos`), and world-space `rim.dir` stay consistent across every cut.

### Gate 4 — Sound & Score Plan (`$REFS/sound-and-edit.md`)
1. Record the sound plan in `<project>/production/audio.md` (`python3 "$KIT/audio/sfx.py" --list` lists all `35+` procedural Foley & UI cues).
2. Populate `music` (`mood` or `sections`) in `config.json` and per-shot `ambience`, `dialogue`, and `sfx` (`at` in shot-local seconds!) in `story/shots.json`.

### Gate 5 — Scene Animation & Contact Sheet (`$REFS/engine-api.md`, `$REFS/animation.md`)
1. Study `$KIT/examples/what-if-demo/scenes/` for clean idiomatic usage.
2. Write `<project>/scenes/sXX.js` modules and import them in `<project>/scenes/index.js`:
   - Animate strictly in **shot-local `t` (`0 .. info.dur`)**; use `info.globalT` only for `talkAmount()` or `wordTime()` lookups.
   - Layer sets with `layer(g, cam, depth, fn)`, evolve facial acting (`brow`, `browTilt`, `mouth`, `autoBlink`), add `breathe()`, lock held custom props to `handPos(opts, 'F'|'B')`, and wrap layout coordinates in `V(landscape, vertical)`.
3. Render and visually inspect the contact sheet (`node "$KIT/render.mjs" --project <dir> --sheet --out <dir>/exports/sheet.png`) to catch any label overlaps or pose issues early.

### Gate 6 — Master Audio Mix, MP4 Render, Subtitles & Screening Room (`$REFS/sound-and-edit.md`)
1. Build the two-pass loudness-normalized master audio (`build/mix.wav`):
   ```bash
   python3 "$KIT/audio/mix.py" --project <dir>
   ```
2. Render preview or full-resolution master MP4 into `<dir>/exports/` (add `--aspect 9:16` for vertical shorts):
   ```bash
   node "$KIT/render.mjs" --project <dir> --out <dir>/exports/final.mp4
   ```
3. When narration, dialogue, or captions exist, export `.srt` / `.vtt`:
   ```bash
   python3 "$KIT/tools/export_srt.py" --project <dir> --vtt
   ```
4. *(Optional Live Preview)* Launch the zero-dependency Screening Room & Interactive Studio server (`0.0.0.0`, HTTP `206` Range streaming + `/kit/player.html`):
   ```bash
   node "$KIT/serve.mjs" --project <dir> --port 4173
   ```

### Gate 7 — Frame-Decoded QA & Critic Loop (`$REFS/qa-and-delivery.md`)
1. Run full-video QA on the rendered MP4:
   ```bash
   python3 "$KIT/tools/qa.py" --project <dir>
   ```
2. Visually inspect `<project>/qa/overview.jpg` and key `<project>/qa/sXX.jpg` motion strips, check `qa/report.json`, and complete the **8-Category Critic Rubric** (`>= 24/32`, no category `< 2`) in `<project>/production/qa.md`.
3. Fix any Critical/Major defects or `qa.py` errors/warnings, re-render, re-verify, and present the finished video clearly to the user.
