---
name: new-video
description: Start a new animated film or video project from an idea/topic prompt, a script, a voiceover file, or a silent/musical beat plan—scaffolding production docs, cast, timeline, and storyboard.
argument-hint: "[project-dir] [optional: voiceover, script, or topic]"
---

# `/new-video` — Universal Project Intake & Storyboard (Gates 1–3)

Set up a new Code Film Studio project cleanly in **any** of the 4 supported input modes without requiring a voiceover upfront.

Let `KIT="${CLAUDE_SKILL_DIR}/../make-film/kit"` and `REFS="${CLAUDE_SKILL_DIR}/../make-film/references"`.

## Steps

1. **Verify Environment:**
   ```bash
   python "$KIT/tools/verify_kit.py"
   python "$KIT/tools/doctor.py"
   ```
   If anything is missing, consult `$REFS/install.md`.

2. **Clarify Minimal Missing Choices (Only if Ambiguous):**
   - **Input mode:** Voiceover file (`--voice`), script file (`--script`), topic/idea prompt, or silent/musical concept (`--bpm` / `--duration`)
   - **Aspect ratio:** `16:9` *(default)* or `9:16`
   - **Visual style (`$REFS/style-bible.md`):** `awaken` *(default)*, `daylight`, `cinema`, `noir`, `arctic`, `emerald`, `ember`, `sakura`, or `retro`

3. **Scaffold Project Folder:**
   ```bash
   python "$KIT/tools/new_project.py" <project_dir> --title "<Title>" --style <style> --aspect <16:9|9:16> [--voice <audio>] [--script <script>] [--duration <sec>]
   ```

4. **Develop Story & Timeline (`$REFS/production-roles.md`):**
   - Fill `<project>/production/brief.md` and `<project>/production/script.md` (verifying facts if educational).
   - Generate timing in `<project>/timeline/`:
     - **With voiceover:** `python "$KIT/tools/transcribe.py" --project <project_dir>` and `python "$KIT/tools/beats.py" --project <project_dir>`
     - **With timestamped script:** `python "$KIT/tools/parse_script.py" --project <project_dir>`
     - **With untimed script / dialogue / silent beats / BPM:** `python "$KIT/tools/plan_timeline.py" --project <project_dir> --write-shots`

5. **Design Cast, Sets & Storyboard (`$REFS/style-bible.md`, `$REFS/animation.md`):**
   - Configure `MC v2` cast presets in `<project>/production/cast.md` and `<project>/scenes/cast.js`.
   - Plan locations & lighting in `<project>/production/locations.md`.
   - Finalize `<project>/story/shots.json` and `<project>/production/continuity.md` and summarize the shot plan for the user (or proceed directly into animation if they asked for a complete video).
