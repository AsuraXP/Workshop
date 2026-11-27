# Voice and Sound

## Brian is the default narrator

The default Microsoft Edge TTS voice is **Brian**, ID `en-US-BrianMultilingualNeural`. Keep the selected voice consistent across the whole narration. The bundled `kit/audio/synthesize.py` uses Brian unless the caller explicitly passes a different voice. Record the voice ID in project metadata.

The synthesizer writes:

- `vo.mp3` — continuous narration;
- `vo.words.json` — per-word start/end times, used to cut panels to the spoken audio;
- `vo.metadata.jsonl` — raw Edge TTS boundary messages for audit/debugging.

If Edge TTS is unreachable in the current runtime, do not say Brian audio was created and do not silently swap speakers. Explain the network limitation, continue script/visual work where useful, and generate the requested Brian track when Edge TTS becomes available. A local user-provided narration can be used only when the user asks for it; it is not the default mode.

## Music bed

Keep music supportive, never competing with the spoken explanation. The default is a calm, warm documentary underscore: slow sustained harmony and sparse plucked notes, no busy beat or sharp transient. `kit/audio/music.py` generates an original, sample-free procedural bed with a slow chord progression and gentle fades. It is intentionally low in the mix and does not imitate a named song or artist.

The score is an aid, not a requirement. The director may remove it when the subject benefits from silence or use a user-provided licensed track if requested. Never claim a generated score is a recording of real instruments.

## Mix targets

Use `kit/audio/mix.py` to combine the voice, optional music, and optional effects:

- delivery loudness: −14 LUFS integrated;
- true peak ceiling: −1.5 dBTP;
- voice centered and intelligible throughout;
- music set below speech, with no clipping or sudden level jumps;
- effects used sparingly and tied to visible actions.

Check the opening, loudest section, pauses, and final seconds after mixing. A loudness number alone is not a listening check.
