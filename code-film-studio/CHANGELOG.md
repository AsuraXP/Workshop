# Changelog

## v1.0.0 — Inkframe Studio
- Rebuilt missing engine as self-contained `studio/` package.
- Added Claude-compatible `SKILL.md` with production gates and full virtual crew.
- Added reference docs: roles, original style bible, animation, scene schema, sound/edit, QA/delivery.
- Added deterministic motion tracks, shot-local key validation, camera math, character rig with expressions/costume/secondary motion, hand-attached props.
- Added procedural scenery, score, Foley, ambience, loudness-normalized mix.
- Added frame-decoding QA, contact sheets, motion/luma heuristics, loudness measurement, SRT export.
- Added 15 regression tests and project template.
- Added complete original test film generator: *The Last Light* (48 s, 8 shots).
- Removed mandatory external reference dependency and cloud speech coupling.
- Documented honest limits: no reference fidelity claim, no medical flash certification, compute scales with length.

## v0.4 (uploaded baseline)
- Process lessons only; referenced engine/tests/templates/analysis were not included.
