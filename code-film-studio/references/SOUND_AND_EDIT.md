# Sound and edit

## Sound plan
Write `production/audio.md` before rendering. Columns: film time, shot-local start, cue, source, duration, level, purpose.
Layers:
1. Music or intentional silence.
2. Location ambience (room tone, rain, wind, traffic).
3. Action Foley (steps, cloth, clicks, impacts, doors).
4. Transition cues.
5. Dialogue/captions when required.

Use `studio.audio`:
- `tone(freq,duration,kind,volume,attack,release)` — sine, bell, pluck, pad, bass.
- `noise(duration,kind,volume,seed)` — rain, wind, step, whoosh, click.
- `score(duration,sections)` — original procedural motif; sections are `(start,mood)` with quiet/effort/hope/silence.
- `build_soundtrack(project,duration,sections)` writes `audio/score.wav`.
- `cue(project,name,samples)` writes a Foley WAV.

All synthesis is deterministic NumPy/SciPy. No copyrighted recording imitation. If the user supplies music/voice, verify authorization and use local files.

## Dialogue
Default films are silent with captions. If speech is requested:
- Prefer an offline/local TTS engine or authorized user recordings.
- Generate audio first, measure actual durations, then lock shot timing.
- One voice per character; keep a voice/reading note in cast.md.
- Duck music under speech. Do not claim lip sync unless viseme timing is actually implemented.
- Captions must match spoken words; narrative captions are labelled as such.

## Mix
- Target −16 LUFS integrated, true peak ≤ −1.5 dBTP by default.
- Music bed typically 0.5–0.8 relative gain; Foley 0.3–0.7; ambience 0.1–0.4. Adjust by ear/measurement.
- Fade score in/out; avoid clicks at cue boundaries.
- Check loudness with `studio.qa.loudness(video)` and listen when audio playback is available.

## Edit
- Hard cut by default. Fade/dissolve for time passage, memory or ending.
- Cut on action or sound; keep dialogue tails and reaction holds.
- New information holds ≥1.5 s; reactions ≥0.8 s unless comedy demands sharper timing.
- Music changes at scene/phrase boundaries, not mid-word.
- Watch once without sound for visual story, once with sound for rhythm. If audio playback is unavailable, state that limitation and use cue/loudness inspection.

## Captions
- Export SRT with `studio.export.srt(spec,path)`.
- Burned-in captions use a dedicated lower band; never cover faces, hands or focal props.
- Keep inside central 80% safe area. Max two lines, readable size at delivery resolution.
