---
name: render-video
description: Animate shots, inspect contact sheets, render preview/final 16:9 or 9:16 MP4 video, export SRT subtitles, and run full-video frame-decoded QA + Critic rubric checks.
argument-hint: "[project-dir] [optional: --preview | --aspect 9:16 | --style <id>]"
---

# `/render-video` — Scene Build, Render & Frame-Decoded QA (Gates 5–7)

Build or refine `<project_dir>/scenes/`, render MP4 video (via Playwright Chromium for 2D+3D or Node `@napi-rs/canvas` for headless 2D), export subtitles, and run `tools/qa.py` + the 8-category Critic Rubric.

Let `KIT="${CLAUDE_SKILL_DIR}/../make-film/kit"` and `REFS="${CLAUDE_SKILL_DIR}/../make-film/references"`. Read `$REFS/engine-api.md`, `$REFS/animation.md`, and `$REFS/qa-and-delivery.md`.

## Workflow

1. **Pre-Render Checklist:**
   - Every shot in `<project_dir>/story/shots.json` is registered in `<project_dir>/scenes/index.js`.
   - Keyframes inside `draw(g, t, state, info)` use **shot-local `t` (`0 .. info.dur`)**, `MC v2` props attach via `handPos()`, and deliberate motionless tableaux set `"hold": true`.
   - Run `python "$KIT/audio/mix.py" --project <project_dir>` so `<project_dir>/build/mix.wav` is up to date.

2. **Fast Contact Sheet & Draft Preview:**
   ```bash
   node "$KIT/render.mjs" --project <project_dir> --sheet --out <project_dir>/exports/sheet.png
   node "$KIT/render.mjs" --project <project_dir> --preview --out <project_dir>/exports/preview.mp4
   ```
   *(Use `--from <sec> --to <sec>` when iterating on a specific sequence of a longer film.)*

3. **Full-Resolution Master Render, Subtitles & Live Screening Room:**
   ```bash
   node "$KIT/render.mjs" --project <project_dir> --out <project_dir>/exports/final.mp4
   python "$KIT/tools/export_srt.py" --project <project_dir> --vtt
   node "$KIT/serve.mjs" --project <project_dir> --port 4173
   ```
   *(For a vertical `9:16` cut from the same scenes: `node "$KIT/render.mjs" --project <project_dir> --aspect 9:16 --out <project_dir>/exports/vertical.mp4`.)*

4. **Mandatory Frame-Decoded QA & Critic Pass (`$REFS/qa-and-delivery.md`):**
   ```bash
   python "$KIT/tools/qa.py" --project <project_dir>
   ```
   - Inspect `<project_dir>/qa/overview.jpg`, `<project_dir>/qa/sXX.jpg` motion strips, and `<project_dir>/qa/report.json`.
   - Score the 8-category Critic Rubric in `<project_dir>/production/qa.md` (target `>= 24/32`, no `< 2`, zero unresolved errors/warnings).
   - If `qa.py` or visual inspection reveals any freeze, overlap, continuity break, flash warning, or loudness drift, fix the scene/audio and re-render before delivering.
