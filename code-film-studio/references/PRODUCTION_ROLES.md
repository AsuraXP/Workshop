# Virtual production crew

One agent fills every role. Each role writes an artifact; a later role reviews it. Do not simulate "discussion" without producing decisions.

## Department map

| Department | Roles | Owns | Artifact |
|---|---|---|---|
| Production | Producer, line producer, production manager, scheduler, asset librarian | scope, budget, runtime, deliverables, asset inventory | brief.md, inventory.md |
| Story | Writer, script editor, dialogue writer, researcher, storyboard artist | premise, beats, screenplay, dialogue, thumbnails | script.md, storyboard/ |
| Direction | Director, assistant director, script supervisor | creative intent, performance, staging, continuity | director_notes.md, continuity.md |
| Casting & performance | Casting director, voice director, MC/host, lead/supporting/background cast | character identities, readings, movement signatures | cast.md, performance_notes.md |
| Art | Production designer, art director, character designer, costume/hair/makeup designer, set dresser, props artist | silhouette, palette, surfaces, costume, sets, props | style.md, locations.md, model sheets |
| Animation | Rigger, layout artist, lead animator, gesture/face specialist, crowd animator | poses, arcs, weight, secondary motion, crowds | timing_sheet.md, rigs/ |
| Camera | Cinematographer, camera operator, focus/framing specialist | shot size, lens feel, camera moves, screen direction | shotlist.md |
| Lighting & look | Lighting director, shading artist, color-script artist, atmosphere specialist | motivated light, mood, depth, weather | style.md, color_script.md |
| Effects | VFX programmer, particle artist, compositor | rain, dust, sparks, glows, layering | effects list in shotlist |
| Sound | Sound designer, composer, Foley artist, ambience designer, dialogue editor, re-recording mixer | score, cues, ambience, dialogue, mix | audio.md, music.md, audio/ |
| Editorial | Editor, pacing specialist, continuity editor, colorist, export engineer | cuts, holds, transitions, captions, master | edit_notes.md, out/ |
| Review | Critic, visual observer, audio reviewer, continuity checker, technical QA, audience proxy | defects, rubric, fixes, sign-off | qa.md, qa/ |

## Role handoffs

1. Producer locks scope → Writer writes to scope.
2. Writer locks beats → Director interprets them visually.
3. Casting + Art lock identities → Animator cannot redesign mid-film.
4. Director + Camera lock shot intent → Storyboard must match.
5. Sound plans cues against timing → Animator aligns action peaks.
6. Programmer renders → Editor assembles → Critic inspects actual output.
7. Critic returns defects to the owning department, not just "make it better."

## Critic protocol

For every defect record: shot id, timecode, observed evidence, violated rule, owner, fix, re-test result. Severity:
- **Critical:** story incomprehensible, missing media, wrong character, unsafe flash, dialogue unintelligible, broken export.
- **Major:** limb through face, prop detached, caption covers action, continuity break, emotion unreadable.
- **Minor:** polish, small timing drift, background inconsistency.

No film is delivered with a critical defect. Major defects require a fix or explicit user-approved exception.

## Background cast and MC

- Extras are simplified house-style variants; they must not steal focus from the lead.
- Crowd motion uses phase-offset loops, not identical synchronization.
- An MC/host is a cast role with direct-address framing and a distinct sound signature; not mandatory for narrative films.
- "Makeup" in 2D means face paint, markings, blush, shading and expression design—not a separate live-action department.
