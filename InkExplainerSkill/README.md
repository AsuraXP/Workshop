# InkExplainerSkill — standalone code-illustrated film studio

This is a **separate package** from the repository's Awaken sparse-voice `Skill/` and `Skill.zip`. It must stay separate: install and distribute **`InkExplainerSkill/`** or **`InkExplainerSkill.zip`** on its own. The Awaken files and root `README.md` are not part of this package.

## What it makes

- Fully narrated, word-timed explainer videos.
- Flat 2D comic scenes drawn entirely in code: bold black ink outlines, simple solid color fills, and white circular-head stick figures.
- Fast hard cuts with varied, story-specific camera framing (about 2.4 seconds per panel by default).
- A quiet original procedural score and voice-forward audio mix.

## Voice

The narration default is Microsoft Edge TTS **Brian**: `en-US-BrianMultilingualNeural`. The synthesizer records Edge TTS word-boundary timing for panel planning. It does not silently replace Brian with another voice.

## Install

```bash
python -m pip install -r requirements.txt
npm install
```

FFmpeg must also be available on `PATH` (or provide its executable with `FFMPEG_BIN`).

## Typical workflow

```bash
# 1. Create a project scaffold and write the complete narration to narration.txt.
python kit/tools/new_project.py project --title "A Curious Question"
python kit/audio/synthesize.py --script project/narration.txt --out project/audio/vo.mp3

# 2. Build a quiet score using the measured narration duration, then mix it forward.
python kit/audio/music.py --word-times project/audio/vo.words.json --out project/audio/music.wav
python kit/audio/mix.py --voice project/audio/vo.mp3 --music project/audio/music.wav --out project/audio/mix.wav

# 3. Create a timed storyboard, fill each panel's visual/camera/composition, then validate.
python kit/tools/plan_shots.py --word-times project/audio/vo.words.json --out project/storyboard.json
# Fill camera, composition, visual, and scene in storyboard.json; implement each scene in project/src/scenes.mjs.
python kit/tools/validate_storyboard.py --shots project/storyboard.json --require-art

# 4. Render the hand-authored project scenes.
node kit/render.mjs --project project --sheet
python kit/tools/qa.py --project project
```

See `SKILL.md` and `references/` for the complete production protocol and scene contract. The package is code-first and does not rely on Kaggle, image generation, Awaken assets, or an uploaded-voice mode.
