# Narration and Word-Reactive Shot Planning

## Narration first

Write and fact-check the complete narration before drawing. Keep a strong opening question, clear causal links, concrete examples, and a payoff. The script is written as continuous prose for one uninterrupted speaker, not a list of isolated one-liners. Do not apply the Awaken sparse-voice ceiling.

Read the script aloud mentally before TTS. Fix tongue-twisters, ambiguous pronouns, unsupported claims, and sentences that need too many clauses. Preserve a version of the exact approved text alongside the generated audio.

## Timing from the actual voice

Run `kit/audio/synthesize.py` with Brian. Edge TTS emits word-boundary offsets. Use `kit/tools/plan_shots.py` to group those measured words into beats; never estimate all cuts from a fixed words-per-minute rate.

- Default target: 2.4 seconds per shot.
- Normal range: 2.0–2.8 seconds; hard ceiling: 3.0 seconds unless a deliberate hold is documented.
- Prefer a pause of at least 0.12 seconds or a sentence/clause boundary for the cut.
- Never cut through a word. Keep a complete spoken phrase attached to a single panel where possible.
- The final storyboard must cover the complete audio once, without timing gaps, overlaps, or omitted word IDs.
- A purposeful reaction hold may exceed the target only when the director notes why.

## Storyboard shape

`plan_shots.py` outputs `duration_sec` and a `shots` list. Each shot contains a stable `id`, `start`, `end`, `spoken_text`, `word_ids`, and a camera hint. Before rendering, the director fills:

- `camera`: scale and angle, such as `wide-low`, `medium-profile`, `extreme-close-up`, or `overhead`;
- `composition`: subject location, negative space, and dominant silhouette;
- `visual`: a concise description of what is shown at this exact phrase;
- `scene`: a unique exported function name in `src/scenes.mjs`.

The spoken text is an editorial timing aid, not necessarily an on-screen subtitle. If captions are requested, export them as a separate timed subtitle file and keep them away from the focal art.

## Continuity and variety

Maintain consistent characters and recurring props, but treat each panel as a new piece of staging. Track recent camera scale, angle, placement, and dominant shape in the storyboard. A second use of a similar shot is acceptable later only if the subject/action or composition changes enough to feel intentional.
