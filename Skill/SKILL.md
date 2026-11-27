---
name: code-film-studio
description: Produce complete animated 2D, 2.5D, and 3D films or videos (plus YouTube/Shorts thumbnails) in code from ANY starting point—a plain prompt/topic, shortcut tags ([EXPLAINER], [2ND-PERSON], [STORY], [DIALOGUE], [MY-VO], [SHORT], [SILENT]), a script, or an uploaded voiceover. Uses edge-tts (Brian) + Kokoro (af_heart) for free multi-voice speech, the MC v2 character rig, 9 visual styles, procedural music + 35+ Foley SFX, two-pass loudness mastering, AI + code thumbnail generation, and frame-decoded QA.
---

# Code Film Studio — Universal Autonomous Film, Voice & Thumbnail Skill

Produce broadcast-clean `16:9` or `9:16` MP4 films and high-CTR thumbnails entirely from deterministic code and free open tools.

Resolve `SKILL_DIR` as the directory containing this `SKILL.md` file (or `${CLAUDE_SKILL_DIR}` when set by Claude), then let `KIT="$SKILL_DIR/kit"` and `REFS="$SKILL_DIR/references"`.

---

## 1. Prompt Shortcut Tags (Recognize & Apply Automatically)

Users can type plain English **or** drop these shorthand tags anywhere in their prompt:

### Video Format Shortcuts
| Tag | Direction, POV, Pacing & Audio Recipe |
|-----|---------------------------------------|
| **`[EXPLAINER]`** *(default for topic questions)* | Curiosity hook in `<3s`, 2nd-person *"you"*, macro/diagram cutaways + `statCard`/`compareBars` UI, `-14 LUFS` mix, default `brian` narrator (or `brian` + `af_heart` co-host). |
| **`[2ND-PERSON]`** | Immersive *"You wake up..."* narrative POV, atmospheric slow camera pushes, **zero** explainer charts/UI cards, expressive `MC v2` acting, `-16 LUFS` cinema mix. |
| **`[STORY]`** | 3rd-person narrated tale + character close-ups (`bigFace`), emotional score arc (`somber` -> `wonder` -> `uplift`), `-16 LUFS` mix, no data overlays. |
| **`[DIALOGUE]`** | 2+ `MC v2` characters conversing (`brian` + `af_heart` by default, or `@voice:auto`), snappy L-cuts timed to breath pauses, 180° screen-side continuity. |
| **`[MY-VO]`** | Preserve the user's uploaded audio recording untouched (`--voice <file>`), run `transcribe.py` + `beats.py` word sync, auto-duck music/ambience under speech. |
| **`[SHORT]`** | Vertical `9:16` (`1080×1920`), `<1.5s` visual/spoken hook, punchy `2.5–4.5s` shots, dynamic burned-in captions, `1080×1920` vertical cover thumbnail. |
| **`[SILENT]`** | Zero speech (`"voiceover": null`, no `dialogue`), pure visual acting + rich Foley (`footstep`, `rain`, `wind`) + `+4 dB` fuller musical score. |

### Style, Voice, Thumbnail & Workflow Modifiers
- **Visual Style (`@<style>`):** `@awaken` *(default warm twilight)*, `@daylight`, `@cinema`, `@noir`, `@arctic`, `@emerald`, `@ember`, `@sakura`, `@retro`.
- **Voice Mode (`@voice:...` — see `$REFS/voice-and-thumbnail.md`):**
  - *(default / `@voice:male`)* -> **Main Male:** `edge-tts` **`en-US-BrianMultilingualNeural`** (`--voice brian`).
  - *(`@voice:female`)* -> **Main Female:** `Kokoro` **`af_heart`** (`--voice af_heart`).
  - *(`@voice:pair`)* -> Male lead **`brian`** (`edge-tts`) + Female lead **`af_heart`** (`Kokoro`).
  - *(`@voice:auto`)* -> Casts best-fit male voices from **`edge-tts`** (`brian`, `andrew`, `eric`, `christopher`, `guy`, `ryan`, `roger`) and best-fit female voices from **`Kokoro`** (`af_heart`, `af_bella`, `af_sarah`, `af_nicole`, `af_nova`, `af_sky`, `bf_emma`) matching each character/genre (`python3 "$KIT/audio/tts.py" --list-voices`).
- **Thumbnail Mode (`@thumb...` — enabled by default on complete video requests!):**
  - `@thumb` / `@thumb:ai` -> Export `exports/thumbnail_ref.png` + style-locked prompt via `tools/thumbnail.py --mode prompt`, generate high-res art with the host agent's AI image tool (if available), then finish crisp `<2 MB` `exports/thumbnail.{png,jpg}` via `thumbnail.py --mode overlay` (or auto-fallback to `--mode code` if the agent has no image generator).
  - `@thumb:code` -> Render deterministic hero-frame thumbnail with contrast boost + bold hook text via `tools/thumbnail.py --mode code`.
  - `@no-thumb` -> Skip thumbnail generation.
- **Review Gate (`@pause`):** Pause after Gate 3 (script + storyboard + `--styles` 9-style preview sheet) for user approval before full rendering; otherwise run **all gates end-to-end autonomously**.

---

## 2. Core Studio Rules

1. **House Character Rig (`MC v2`):** Recurring human characters use **`MC v2`** (`drawFigure`, `bigFace`, `handPos`, `COATS` in `/kit/engine/rig2d.js`; `figure3D` in `/kit/engine/three-kit.js`): matte dark circular head with razor-tapered crescent rim light, vertical warm-cream oval eyes, expressive flat pill brow bars, understated mouth, cylindrical-shaded rounded coat/tunic, crisp limbs, solid ball hands, and flat feet.
2. **Dual-Engine Free TTS (`audio/tts.py`):** Unless `[MY-VO]`, `[SILENT]`, or host-native speech auditioning is requested, synthesize speech with `python3 "$KIT/audio/tts.py"` using **`brian` (`edge-tts`)** as the primary male voice, **`af_heart` (`Kokoro`)** as the primary female voice, and `edge-tts` (male) + `Kokoro` (female) for additional cast roles.
3. **Kit Integrity & Visible Deliverables:** Never mutate `$KIT/engine/` for a single project—write project code inside `<project>/scenes/`. Always save deliverables to `<project>/exports/` (never `out/`) so cloud sandboxes and Git snapshots never hide output files.

---

## 3. The 7-Gate Autonomous Pipeline (+ Thumbnail Delivery)

Read the targeted reference manual in `$REFS/` at each gate rather than guessing APIs:

### Gate 1 — Auto-Bootstrap, Intake & Story (`$REFS/production-roles.md`, `$REFS/install.md`)
1. Run `python3 "$KIT/tools/verify_kit.py"` and `python3 "$KIT/tools/doctor.py"`.
   - **Auto-bootstrap missing packages:** Automatically install any missing required packages (`pip install numpy scipy pillow opencv-python-headless imageio-ffmpeg edge-tts soundfile` + `kokoro` or `kokoro-onnx` when female Kokoro voices are used, and `npm --prefix "$KIT" install @napi-rs/canvas --no-save` if Playwright Chromium is absent).
2. Scaffold the project folder:
   ```bash
   python3 "$KIT/tools/new_project.py" <project_dir> --title "<Title>" --style <style> --aspect <16:9|9:16> [--voice vo.mp3] [--duration 45]
   ```
3. Complete `<project>/production/brief.md` and `<project>/production/script.md`.

### Gate 2 — Voice Synthesis & Exact Timing (`$REFS/voice-and-thumbnail.md`)
- **Generated Speech (`[EXPLAINER]`, `[2ND-PERSON]`, `[STORY]`, `[DIALOGUE]`):** Write `<project>/audio/cues.json` (`brian` for main male, `af_heart` for main female, or `@voice:auto` presets) and run:
  ```bash
  python3 "$KIT/audio/tts.py" --project <dir> --cues <dir>/audio/cues.json
  ```
  Use the exact `duration`, `speech_start`, `speech_end`, and internal breath `pauses` in `audio/tts_report.json` to time `story/shots.json` and natural **L-cuts**!
- **Uploaded Voiceover (`[MY-VO]`):** Run `transcribe.py` + `beats.py`.
- **Untimed / Silent (`[SILENT]`):** Run `plan_timeline.py --project <dir> [--bpm 110] --write-shots`.

### Gate 3 — Cast, Sets, Storyboard & Continuity (`$REFS/style-bible.md`, `$REFS/animation.md`)
1. Define `MC v2` cast presets in `production/cast.md` + `scenes/cast.js`, and multi-plane locations in `scenes/sets/*.js` + `production/locations.md`.
2. Author `story/shots.json` (varied shot scales, `"hold": true` on deliberate holds) and `production/continuity.md` (180° rule, `handPos` props, `rim.dir`). *(If `@pause` was requested, render `--styles` and stop here for approval.)*

### Gate 4 — Sound & Score Plan (`$REFS/sound-and-edit.md`)
1. Configure `music` (`mood` or `sections`) in `config.json` and per-shot `ambience`, `dialogue`, and `sfx` (`1–4` cues per shot in shot-local `at` seconds; `sfx.py --list`) in `story/shots.json`.

### Gate 5 — Scene Animation & Contact Sheet (`$REFS/engine-api.md`, `$REFS/animation.md`)
1. Write `<project>/scenes/sXX.js` using **shot-local `t` (`0 .. info.dur`)**, `layer(g, cam, depth, fn)`, `breathe()`, `autoBlink()`, `handPos()`, and `V(landscape, vertical)`.
2. Render & visually inspect `<dir>/exports/sheet.png` (`node "$KIT/render.mjs" --project <dir> --sheet`).

### Gate 6 — Master Mix, MP4 Render, Subtitles & Thumbnail (`$REFS/voice-and-thumbnail.md`)
1. Master audio (`-14 LUFS` web / `-16 LUFS` cinema): `python3 "$KIT/audio/mix.py" --project <dir>`
2. Render MP4: `node "$KIT/render.mjs" --project <dir> --out <dir>/exports/final.mp4`
3. Export subtitles: `python3 "$KIT/tools/export_srt.py" --project <dir> --vtt`
4. **Generate Thumbnail** (unless `@no-thumb`):
   - Run `python3 "$KIT/tools/thumbnail.py" --project <dir> --mode prompt --hook "<2-4 WORD HOOK>"` to produce `exports/thumbnail_ref.png` + `production/thumbnail_prompt.md`.
   - If you (the host agent) have an **image generation / image editing tool**, generate the high-res artwork using that `MC v2` style-locked prompt (and `thumbnail_ref.png` as reference if supported), then run `thumbnail.py --mode overlay --in-image <raw.png> --hook "<2-4 WORD HOOK>"` to write `<2 MB` `exports/thumbnail.{png,jpg}`. Otherwise run `thumbnail.py --mode code --hook "<2-4 WORD HOOK>"`.
5. *(Optional Live Screening Room)* `node "$KIT/serve.mjs" --project <dir> --port 4173`

### Gate 7 — Frame-Decoded QA & Critic Loop (`$REFS/qa-and-delivery.md`)
1. Run `python3 "$KIT/tools/qa.py" --project <dir>`, visually inspect `qa/overview.jpg`, `qa/sXX.jpg`, and `exports/thumbnail.png`, score the 8-Category Critic Rubric in `production/qa.md`, fix any warnings/defects, and present `exports/final.mp4` + `exports/thumbnail.png`!
