---
name: ink-explainer-code-film-studio
description: Creates fully narrated, code-illustrated flat-2D explainer videos with fast, non-repeating comic panels.
---

# Ink Explainer — Code-Illustrated Narration Studio

A **standalone second skill** for continuous-narration, flat 2D webcomic explainer videos. This package is deliberately separate from the Awaken sparse-voice `Skill/` and `Skill.zip`.

## Separation Contract — Non-Negotiable

- This skill owns only `InkExplainerSkill/` and `InkExplainerSkill.zip`.
- Never merge, copy into, import from, rename, or overwrite Awaken `Skill/`, `Skill.zip`, or its root `README.md`.
- Do not use Awaken sparse-voice rules, MC v2 character rig, palettes, shot language, `[MY-VO]`, or vertical-format behavior here. The two studios have different briefs and packages.
- This is a **continuous full-narration** studio. Do not enforce sparse-voice ceilings or short-cue limits.
- The render is **code-drawn 2D**. Do not route scenes through Kaggle, image-generation services, or external image assets.

## Defaults

- **Format:** 16:9, 1920×1080, 24 fps.
- **Narration:** full, continuous voice-over, aligned to the visual beats.
- **Default voice:** Microsoft Edge TTS **Brian**, voice ID `en-US-BrianMultilingualNeural`. Keep this voice for the whole narration unless the user explicitly asks for another voice. Do not silently substitute a different speaker.
- **Visual rhythm:** hard cuts averaging 2.2–2.6 seconds; every cut lands on a word boundary and preferably a clause pause. A shorter or longer beat is acceptable only when the spoken phrase needs it.
- **Sound:** narration stays clearly in front. Use a quiet, warm, restrained instrumental bed (sustained tones and sparse plucked notes by default); avoid busy percussion and avoid masking speech. The bundled score generator is an original procedural cue, not a music-generation service.
- **Delivery:** final MP4, contact sheet, and editable project source.

## Production Gates

### 1. Brief and fact-check

Confirm topic, target audience, target duration, and language if missing. For factual explainers, research claims and distinguish established evidence from uncertainty. Keep a single curiosity question and narrative throughline; do not turn the video into a list of disconnected trivia.

### 2. Write the complete narration first

Write one natural, recordable narration from hook to payoff. It must play continuously; do not create a sparse-voice script. Read it for breath, clarity, and factual accuracy before synthesis. Preserve the approved script when timing visuals.

### 3. Synthesize with Brian and capture word timing

Use `kit/audio/synthesize.py` with the default `en-US-BrianMultilingualNeural` voice. It writes the MP3 plus Edge TTS word-boundary metadata. Inspect the audio and alignment; the video timing must come from the actual synthesized track, not estimated reading speed. If Edge TTS cannot be reached in the current environment, say so plainly, continue non-audio work if useful, and do not claim a fallback voice is Brian.

### 4. Build the beat map

Run `kit/tools/plan_shots.py` on the word-boundary JSON. Start near 2.4 seconds per panel, cut at clean phrase boundaries, and keep each spoken word attached to a panel. Tune boundaries to avoid splitting a meaningful noun phrase or action. The planner gives timing and varied camera hints; the director must fill every visual description and make the compositions meaningful.

### 5. Draw every panel in code

Write a project `src/scenes.mjs` that uses `kit/scene-kit.mjs` and the Canvas API. All art is deterministic, hand-authored 2D code: bold, slightly organic black ink lines, simple flat fills, white circular-head stick figures, clear expressions and readable props. Use grounded environments and story-specific visual metaphors. No gradients, 3D shading, photoreal assets, stock images, or image-generation calls.

### 6. Direct varied, word-reactive cuts

Each panel must illustrate the words actually spoken in its time window. Vary camera scale and placement throughout: establishing wide, medium action, close-up, extreme close-up, low angle, overhead diagram, profile, silhouette, and clean infographic inserts. Do not repeat the same framing on consecutive panels; change at least two of camera scale, angle, subject placement, and dominant shape between neighboring cuts. Avoid template repetition across the whole film. Use on-screen text only when it adds information that cannot be shown visually.

### 7. Mix, render, and inspect

Generate the quiet score for the exact narration duration, then mix with `kit/audio/mix.py` at a YouTube-friendly target of −14 LUFS and −1.5 dBTP. Render with `kit/render.mjs`. Make a contact sheet and inspect all panels in order. Run the storyboard validator and final media checks. Fix truncation, missing visuals, repeated framings, clipped captions, gaps, overlaps, audio clipping, and narration/music balance before delivery.

## Standard Commands

From the skill directory:

```bash
python -m pip install -r requirements.txt
npm install
python kit/tools/new_project.py project --title "A Curious Question"
# Write the full narration to project/narration.txt before synthesis.
python kit/audio/synthesize.py --script project/narration.txt --out project/audio/vo.mp3
python kit/audio/music.py --word-times project/audio/vo.words.json --out project/audio/music.wav
python kit/audio/mix.py --voice project/audio/vo.mp3 --music project/audio/music.wav --out project/audio/mix.wav
python kit/tools/plan_shots.py --word-times project/audio/vo.words.json --out project/storyboard.json
# Fill each shot's camera, composition, visual, and scene fields in storyboard.json.
python kit/tools/validate_storyboard.py --shots project/storyboard.json --require-art
node kit/render.mjs --project project --sheet
python kit/tools/qa.py --project project
```

Have `project/src/scenes.mjs` export a `scenes` object keyed by the storyboard scene names, as documented in `references/rendering-and-qa.md`.

## Reference Manuals

- `references/visual-style.md` — linework, figures, flat palette, panel composition.
- `references/narration-and-shot-planning.md` — script, word timing, beat planning, continuity.
- `references/audio-and-voice.md` — Brian Edge TTS, music bed, mixing and fallbacks.
- `references/rendering-and-qa.md` — project contract, render commands, validation, delivery.
