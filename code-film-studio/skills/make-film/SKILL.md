---
name: make-film
description: Produce complete animated 2D, 2.5D, and 3D films or videos in code from ANY starting point—an idea/topic prompt, a plain or timestamped script, a voiceover audio file, or a silent/musical concept. Combines a virtual studio crew workflow, the parameterized MC v2 character rig, Canvas2D + Three.js rendering, procedural music + 35+ Foley SFX with two-pass loudness mastering, and frame-decoded QA.
---

# Code Film Studio — Universal Animated Film & Video Production

Produce broadcast-clean `16:9` or `9:16` MP4 films entirely from deterministic code—no stock footage, no external paid APIs, and no single-genre formula.

Let `KIT="${CLAUDE_SKILL_DIR}/kit"` and `REFS="${CLAUDE_SKILL_DIR}/references"`.

---

## Core Rules (Zero-Conflict Studio Contract)

1. **Universal Intake (Never force a single input):** Accept **any** of the 4 starting modes cleanly:
   - **Mode A — Voiceover (`--voice audio.mp3` + optional script):** Align words via `tools/transcribe.py` (or `tools/parse_script.py`), preserve the user's recording, and auto-duck score & ambience under speech.
   - **Mode B — Idea / Topic / Prompt only ("Make a video about..."):** Act as Showrunner + Researcher + Writer. Write `production/brief.md` and `production/script.md`, verify facts if educational, and build the timeline via `tools/plan_timeline.py --write-shots`.
   - **Mode C — Script or Dialogue only:** Parse timestamped lines (`tools/parse_script.py`) or untimed narration/dialogue/`[SILENT]` beats (`tools/plan_timeline.py --write-shots`), plus optional per-shot `dialogue` audio clips.
   - **Mode D — Silent / Visual / Musical film:** Plan phrasing via `tools/plan_timeline.py --bpm <BPM> --duration <sec> --write-shots` or silent visual beats, letting visual acting, music, and Foley carry the story.
2. **House Character Rig (`MC v2`):** Recurring human characters use **`MC v2`** (`drawFigure`, `bigFace`, `handPos`, `COATS` in `/kit/engine/rig2d.js`; `figure3D` in `/kit/engine/three-kit.js`): matte dark circular head with razor-tapered crescent rim light, vertical warm-cream oval eyes, expressive flat pill brow bars, understated mouth, cylindrical-shaded rounded tunic/coat (plus `cardigan`, `labcoat`, `hoodie`, `suit`, `elder`, etc.), crisp limbs, solid ball hands, and flat feet.
3. **Genre-Adaptive Direction (Never hardcode clichés):** Match `style`, `mood()`, camera rhythm, and overlays to the film's genre (`awaken` default, `daylight`, `cinema`, `noir`, `arctic`, `emerald`, `ember`, `sakura`, `retro`). Default `bars` is `"none"` (full-bleed frame), static camera holds (`"hold": true`) are valid when motivated, data cards belong in explainers rather than pure dramas, and closing cards (`endCard`) never add a `"Subscribe"` button unless requested.
4. **Kit Integrity:** Verify kit health before starting (`python "$KIT/tools/verify_kit.py"` and `python "$KIT/tools/doctor.py"`). Project-specific characters, sets, and shots belong inside `<project>/scenes/`—do not mutate `$KIT/engine/` for a single project.

---

## The 7-Gate Studio Pipeline

Read the targeted reference manual at each gate rather than guessing APIs:

### Gate 1 — Environment, Intake & Story (`$REFS/production-roles.md`, `$REFS/install.md`)
1. Run `python "$KIT/tools/verify_kit.py"` and `python "$KIT/tools/doctor.py"`.
2. Scaffold the project folder:
   ```bash
   python "$KIT/tools/new_project.py" <project_dir> --title "<Title>" --style awaken --aspect 16:9 [--voice vo.mp3] [--script script.md] [--duration 30]
   ```
3. Complete `<project>/production/brief.md` and `<project>/production/script.md`.
4. Build `<project>/timeline/` (`words.json`, `sentences.json`, `beats.json`) using the matching tool:
   - Voiceover -> `python "$KIT/tools/transcribe.py" --project <dir>` + `python "$KIT/tools/beats.py" --project <dir>`
   - Timestamped script -> `python "$KIT/tools/parse_script.py" --project <dir>`
   - Untimed script / dialogue / silent / BPM -> `python "$KIT/tools/plan_timeline.py" --project <dir> --write-shots`

### Gate 2 — Cast, Locations & Visual Style (`$REFS/style-bible.md`)
1. Define recurring `MC v2` cast presets (`coat`, `outfit`, `rim`) in `<project>/production/cast.md` and `<project>/scenes/cast.js`.
2. Design reusable multi-plane location modules in `<project>/scenes/sets/*.js` and document lighting direction (`rim.dir`) in `<project>/production/locations.md`.

### Gate 3 — Storyboard & Continuity Ledger (`$REFS/production-roles.md`, `$REFS/animation.md`)
1. Author `<project>/story/shots.json` with varied shot scales (wide / two-shot / `bigFace` close-up / schematic or prop insert), motivated transitions, captions/subtitles, and `"hold": true` on deliberate still shots.
2. Fill `<project>/production/continuity.md` so coat colors, 180° screen sides, prop sockets (`handPos`), and world-space `rim.dir` stay consistent across every cut.

### Gate 4 — Sound & Score Plan (`$REFS/sound-and-edit.md`)
1. Record the sound plan in `<project>/production/audio.md`.
2. Populate `music` (`mood` or `sections`) in `config.json` and per-shot `ambience` + `sfx` (`at` in shot-local seconds!) in `story/shots.json`.

### Gate 5 — Scene Animation (`$REFS/engine-api.md`, `$REFS/animation.md`)
1. Study `$KIT/examples/what-if-demo/scenes/` for clean idiomatic usage.
2. Write `<project>/scenes/sXX.js` modules and import them in `<project>/scenes/index.js`:
   - Animate strictly in **shot-local `t` (`0 .. info.dur`)**; use `info.globalT` only for `talkAmount()` or `wordTime()` lookups.
   - Layer sets with `layer(g, cam, depth, fn)`, evolve facial acting (`brow`, `browTilt`, `mouth`, `autoBlink`), add `breathe()`, Lock held custom props to `handPos(opts, 'F'|'B')`, and wrap layout coordinates in `V(landscape, vertical)`.
   - For films `> 60s`, build and inspect in 30–45s sequence batches (`node "$KIT/render.mjs" --project <dir> --sheet`).

### Gate 6 — Audio Mix, Render, Subtitles & Screening Room (`$REFS/sound-and-edit.md`)
1. Build the two-pass loudness-normalized master audio (`build/mix.wav`):
   ```bash
   python "$KIT/audio/mix.py" --project <dir>
   ```
2. Render a fast draft preview first, then full-resolution master MP4 (into `<dir>/exports/`, never `out/`, so cloud workspaces and Git snapshots never hide deliverables):
   ```bash
   node "$KIT/render.mjs" --project <dir> --preview --out <dir>/exports/preview.mp4
   node "$KIT/render.mjs" --project <dir> --out <dir>/exports/final.mp4
   ```
3. When narration, dialogue, or captions exist, export `.srt` / `.vtt`:
   ```bash
   python "$KIT/tools/export_srt.py" --project <dir> --vtt
   ```
4. *(Optional Live Preview)* Launch the built-in Screening Room & Interactive Studio server (`0.0.0.0`, HTTP `206` Range streaming + `/kit/player.html`):
   ```bash
   node "$KIT/serve.mjs" --project <dir> --port 4173
   ```

### Gate 7 — Frame-Decoded QA & Critic Loop (`$REFS/qa-and-delivery.md`)
1. Run full-video QA on the rendered MP4:
   ```bash
   python "$KIT/tools/qa.py" --project <dir>
   ```
2. Visually inspect `<project>/qa/overview.jpg` and key `<project>/qa/sXX.jpg` motion strips, check `qa/report.json`, and complete the **8-Category Critic Rubric** (`>= 24/32`, no category `< 2`) in `<project>/production/qa.md`.
3. Fix any Critical/Major defects or `qa.py` errors/warnings, re-render, re-verify, and present deliverables honestly.
