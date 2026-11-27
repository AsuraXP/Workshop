# Audit of uploaded v0.4 skill

## What was preserved
- Full crew concept and work order.
- Shot-local keyframe discipline and carry-forward state lessons.
- Mandatory sound list, detail pass, motion QA, uniqueness check.
- Framing, face legibility, secondary motion and timing-sheet requirements.

## What was broken or missing
1. **Missing executables.** README/SKILL referenced `engine/render_film.py`, `rig.py`, `motion.py`, `sfx.py`, `qa_frames.py`, `qa_safety.py`, `export.py`, tests, templates and analysis, but only three Markdown files were provided. The skill could not run as delivered.
2. **Reference dependency.** It required analyzing a specific YouTube video before writing, and referenced a missing analysis file. This made the skill fragile and risked false claims when access fails.
3. **Hardcoded story assumptions.** "One character, one goal, one turn", 3–5 chapters, ≤3 dialogue lines and 60–90 s target were presented as rules rather than defaults for one format.
4. **Tool coupling.** Voice depended on `add_voice`/`generate_speech` tools that a receiving Claude/agent may not have.
5. **Contradictory QA.** "Cut on motion or sound, not on silence" vs music/silence guidance; low motion automatically treated as defect despite deliberate holds; "frame-by-frame" claimed but only 2 s sampling in reference analysis.
6. **No executable schema contract.** Element types, tracks, camera math, audio offsets and validation were described inconsistently.
7. **Safety overclaim.** A simple flash heuristic was treated as a safety gate without certification limits.

## What changed in v1.0
- Rebuilt a self-contained Python engine: SVG/Cairo renderer, motion tracks, rig, scenery, procedural audio, QA, SRT export.
- Separated house style from story format; genre adaptation and length scaling are explicit.
- Made reference analysis optional and honesty-gated; original style bible is the baseline.
- Made audio code-first; local/authorized voice optional.
- Added tests, templates, production artifacts, defect loop and honest limitations.
- Fixed concrete bugs found during test production: duplicate SVG attributes, caption overlap, ground contact, floating seed prop, premature beacon light, QA memory blow-up.

## Verification
- 15 regression tests pass.
- Test film rendered and decoded: 1152 frames, 24 fps, 48 s.
- Contact sheets reviewed; fixes applied and re-rendered.
- Loudness measured ≈ −16 LUFS; true peak ≈ −1.5 dBTP.
- Reference fidelity remains unverified because source video was inaccessible.
