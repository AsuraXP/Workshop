---
name: video-sound
description: Design and master a film's soundtrack—sectioned procedural music, per-shot ambience, 35+ Foley/UI SFX, optional voiceover or per-shot dialogue ducking, and two-pass EBU R128 loudness normalization.
argument-hint: "[project-dir]"
---

# `/video-sound` — Score, Foley, Dialogue Ducking & Two-Pass Mastering

Compose, spot, and master `<project_dir>/build/mix.wav` so every visual cut, gesture, data reveal, and quiet pause lands with clean cinema dynamics.

Let `KIT="${CLAUDE_SKILL_DIR}/../make-film/kit"` and `REFS="${CLAUDE_SKILL_DIR}/../make-film/references"`. Read `$REFS/sound-and-edit.md` before spotting cues.

## Workflow

1. **Inspect Available Procedural SFX & Ambience (`35+` effects):**
   ```bash
   python "$KIT/audio/sfx.py" --list
   ```
2. **Plan the Emotional Arc (`<project_dir>/production/audio.md` & `config.json`):**
   - Set `"music"` in `config.json` to either a single mood (`wonder`, `curious`, `tense`, `uplift`, `action`, `somber`, `playful`, `none`) or `"sections": [{"at": 0, "mood": "curious", "gain": -15}, ...]`.
   - Set `"loudness"` in `config.json` (`-14.0` LUFS for web/YouTube default; `-16.0` LUFS for narrative shorts).
3. **Spot Motivated Ambience & Foley in `<project_dir>/story/shots.json`:**
   - Assign a loopable `"ambience"` bed per location (`roomtone`/`room`, `wind`, `city`/`night`, `rain`, `murmur`/`crowd`, `hum`).
   - Place `1–4` `"sfx"` cues per shot using **shot-local `"at"` seconds** matching exact visual contact/reveal timestamps in `scenes/sXX.js`.
   - Optional per-shot character speech clips go in `"dialogue": [{"at": 0.25, "src": "audio/lines/line01.wav", "gain": 0}]`.
4. **Render & Two-Pass Master `<project_dir>/build/mix.wav`:**
   ```bash
   python "$KIT/audio/mix.py" --project <project_dir>
   ```
   `mix.py` automatically ducks music and ambience under `voiceover` and `dialogue` stems (or warms up the score on silent/visual films) and runs two-pass linear `loudnorm` to hit target LUFS cleanly without pumping.
