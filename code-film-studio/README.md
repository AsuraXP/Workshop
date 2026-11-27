# Inkframe Studio

A Claude-compatible Agent Skill that turns a receiving agent into a **code-only 2D film production crew**. No image-generation or video-generation models. The agent writes story, designs cast/sets, directs, animates SVG rigs, composes procedural sound, renders with FFmpeg, inspects QA evidence, and iterates.

## Install

```bash
python3 -m pip install -r requirements.txt
# Debian/Ubuntu system dependencies:
sudo apt-get install ffmpeg fonts-dejavu-core
python3 -m unittest discover -s tests -v
```

Place this folder as a skill directory (e.g. `~/.claude/skills/inkframe-studio`) or open `SKILL.md` as the operating instructions for any coding agent.

## Make the included test film

```bash
python3 examples/small_light/make_film.py
python3 -m studio.render examples/small_light/film.json films/small-light/out/the_last_light.mp4
python3 -m studio.qa films/small-light/out/the_last_light.mp4 examples/small_light/film.json --out films/small-light/qa
```

## Start a new film

Copy `templates/project/` to `films/<slug>/`, fill the production brief, then follow `SKILL.md`. The skill is genre-agnostic: narrative, comedy, horror, explainer, action, music video, dialogue drama, abstract/poetry.

## What is included

- `SKILL.md` — production gates and crew workflow.
- `references/` — roles, style bible, animation, schema, sound/edit, QA.
- `studio/` — motion tracks, character rig, scenery, SVG renderer, procedural audio, QA, captions.
- `tests/` — regression tests.
- `templates/project/` — starting project.
- `examples/small_light/` — complete 48-second original test film generator.

## Honest limits

- The requested YouTube reference could not be downloaded; the house style is original and **not reference-verified**.
- Default audio is procedural; spoken dialogue requires local/authorized TTS or recordings.
- QA includes measurable checks and agent visual review, not medical photosensitivity certification.
- Long films are produced in scene/reel batches; compute time scales with frame count.
