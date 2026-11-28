# Script and Audio Guidance

## Canonical narration

- Keep one authoritative spoken-text file. Make the script used for speech generation match it exactly after removing headings and stage directions.
- Count words and estimate the first-pass read using the expected language and performance. A rough planning range is 130–170 words per minute; actual generated duration takes precedence over estimates.
- Write for breath and clarity. Use concrete verbs, short clauses, and natural transitions. Avoid cramming exposition simply to fill the runtime.
- When the viewer is the protagonist, address them as “you” consistently. Keep visual descriptions and production notes out of the spoken text.

## Voice identity

- Follow the voice-generation tool's selection flow. If it requires audition and selection, wait for that selection before generating the final narration.
- Use only IDs returned by the tool in the current session. Historical labels, examples, or IDs from another session are not automatically available.
- If a requested ID is unavailable, state that before substituting. Record the requested voice separately from the actual generated voice.
- Keep a take manifest or audio note with the exact script version, voice ID, language, output path, and generation date.

## Generation and alignment

1. Generate `voiceover-raw` from the approved canonical narration.
2. Measure the raw file's duration, sample rate, channels, and peak. Listen to the whole take and check pronunciations, skipped words, pauses, and the ending.
3. Apply only approved timing edits. For speed changes, prefer pitch-preserving time stretch; record the exact multiplier. Re-listen after processing.
4. Re-plan phrase boundaries using the final processed voiceover. Do not reuse a timeline from a different take or script revision.
5. Compare the final track's spoken words against the canonical script. Where exact forced alignment is unavailable, label timings as estimates rather than claiming word-accurate alignment.
6. Mix the final processed voiceover with score, ambience, and effects; verify the rendered MP4 uses that mix and is not silently falling back to a stale WAV.

## Mix review

- The narration must remain intelligible over music and effects, including quiet consonants.
- Duck music under speech without pumping; keep ambience subtle and consistent with location.
- Place effects on the described action, not merely near the middle of a shot. Do not use a sound because it is available if it does not fit the scene.
- Measure integrated loudness and true peak on the final export, then listen to the whole mix. Numeric targets do not replace listening.
- Leave an intentional ending or visual button when the narration ends before the picture. Document its duration.
