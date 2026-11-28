---
name: continuous-narration-film
description: Plan, produce, render, and review short cinematic videos driven by one uninterrupted narration track, with explicit script/audio alignment and human visual-continuity review.
---

# Continuous Narration Film

Use this Skill when the requested film is carried by one connected narration performance. It is intentionally separate from the existing Awaken Skill and its sparse-voice production mode.

## Boundaries

- Resolve `SKILL_DIR` as the directory containing this `SKILL.md`.
- Keep this Skill's material inside `SKILL_DIR`. Put each production in the user's chosen project directory.
- Treat the existing `Skill/`, `Skill.zip`, Awaken work, and any existing renderer/toolkit as **read-only**. They may be consulted or invoked as dependencies only when available and appropriate; never patch, replace, repackage, or commit changes to them as part of this Skill.
- Do not claim a requested voice identity was used unless the actual registered voice ID matches. Record any substitute plainly and ask before substituting when the voice identity is a hard requirement.
- Keep a human review gate. Automated timing, frame, loudness, or flash checks are not proof that the art looks correct.
- If an instruction conflicts with the user's explicit scope, ask before changing files or expanding the deliverable.

## When to Use

Use for a short film with one lead narrator speaking continuously or near-continuously over changing visuals. Do not use as a substitute for sparse-voice Awaken, character dialogue, or a silent montage; if the request is ambiguous, ask which format they want.

## Production Workflow

1. **Agree on the brief.** Confirm runtime, aspect ratio, audience viewpoint, tone, story, delivery format, voice constraints, and any no-go content. Use `templates/brief.md`.
2. **Write one canonical script.** Keep the narration in second person when the viewer is the protagonist. Track the exact spoken words separately from headings and production notes. Use the intended script as the single source of truth for synthesis, captions, and timeline text; start from `templates/narration.txt` if useful. See `references/script-and-audio.md`.
3. **Select and document the voice.** Audition if the voice tool requires selection. Reuse only a registered `voice_id`; do not invent IDs or present an auto-assigned voice as the user's chosen one. Record speaker ID, language/accent, generation source, and any processing.
4. **Generate narration from the canonical script.** Save the raw take, measure its duration, listen/review it, and correct the script or performance before building timing. If speeding up, use pitch-preserving processing, document the factor, and verify intelligibility. Never plan against a stale take.
5. **Plan picture against the final audio.** Use the processed voice track's duration and phrase boundaries. Map every visual beat to an audible phrase or intentional breath. Choose a practical beat range for the runtime (typically about 1.5–4.2 seconds); avoid both arbitrary cuts and long static holds. Use `templates/shot-map.md`.
6. **Lock visual continuity before detailed animation.** Establish character shapes, clothing, scale, screen direction, locations, lighting, and prop states once. Apply those choices consistently. Build each shot around a clear action, not just a caption change. See `references/visual-continuity.md`.
7. **Design the sound bed.** Mix narration, score, ambience, and restrained spot effects. Keep dialogue intelligible, avoid effects that contradict the scene, and verify the mastered output rather than trusting a target value alone.
8. **Render a review cut.** Produce a contact sheet and representative start/middle/end frames for each shot. Then watch the entire video at normal speed with sound. Inspect motion between stills; a contact sheet alone cannot reveal temporal artifacts.
9. **Fix, rerender, and review again.** Any visible character drift, malformed silhouette, duplicate/disconnected body part, flicker, clipping, unexplained prop change, mistimed action, or narration mismatch is a blocker. Repair the project and repeat the review.
10. **Run technical QA and sign off honestly.** Check duration, dimensions, fps, audio presence, A/V alignment, loudness/true peak, flashes, and shot cadence. Complete `templates/qa-report.md`. Report automated and human-review results separately, including anything not checked.
11. **Deliver.** Present the final video and list the canonical script, audio notes, QA report, and any known limitations. Do not call a draft final.

## Minimum Acceptance Criteria

- Final runtime, aspect, and resolution match the approved brief within an explicitly stated tolerance.
- The exported voiceover was generated from the approved canonical script; the final processed audio is the one used for both timing and render.
- Visual beat boundaries are documented and correspond to the narration or intentional pauses.
- Protagonist and recurring threats remain visually consistent across shots; important props and action states carry across cuts.
- Human review of the rendered video finds no blocking artifacts, continuity breaks, or narration/visual mismatches.
- Technical QA is recorded, and every remaining limitation is disclosed.

## References and Templates

- `references/script-and-audio.md` — script source of truth, voice registration, timing, speed changes, and mix review.
- `references/visual-continuity.md` — character, zombie/threat, prop, lighting, and motion review.
- `references/render-and-qa.md` — preview, technical QA, human sign-off, and handoff.
- `references/file-layout.md` — suggested production project layout.
- `templates/brief.md` — production brief.
- `templates/shot-map.md` — narration-aligned visual plan.
- `templates/qa-report.md` — review and delivery record.
