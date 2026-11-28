# Continuous Narration Film Skill

A standalone agent Skill for planning and producing short narrative films led by one uninterrupted voiceover. It lives separately from the repository's existing Awaken Skill; the existing Skill and its archive are not modified by this package.

## Contents

- `SKILL.md` — operating contract and end-to-end workflow.
- `references/` — practical guidance for script/audio alignment, visual continuity, and review.
- `templates/` — brief, shot map, and QA sign-off forms.

## Renderer dependency

This package is an instruction-and-template Skill, not a copied renderer. It can use an already available renderer as a read-only dependency, or a user-provided production environment. If a required tool is missing, identify that dependency and ask before installing or modifying another Skill/toolkit. Project-specific code and generated assets belong in the project directory, not here.

## Core rule

A technical QA pass is not visual approval. Always inspect the finished moving video with sound, check character and prop continuity across cuts, and report the results separately from automated metrics.
