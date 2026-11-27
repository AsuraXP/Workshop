# Sound Design, Procedural Score, Dialogue & Mastering

Audio carries half the emotional and physical weight of animation. Code Film Studio synthesizes **100% copyright-free procedural music, ambience, and Foley SFX** (`48 kHz` stereo) and combines them with optional **voiceover or per-shot character dialogue clips** using **two-pass EBU R128 loudness mastering**.

---

## 1. Supported Audio Modes (`audio/mix.py`)

`mix.py` handles all project audio modes cleanly with zero configuration conflict:
1. **Narrated Film (`config.json -> "voiceover": "audio/voiceover.mp3"`):** Decodes narration, computes a smooth speech activity envelope, and automatically ducks background music (`-9 dB` default) and ambience (`-5 dB`) whenever speech is active.
2. **Character Dialogue / TTS Clips (`shot.dialogue` in `story/shots.json`):** Place individual spoken line WAV/MP3 files at exact shot-local offsets (`{"at": 0.25, "src": "audio/lines/s02_friend.wav", "gain": 0, "pan": 0.15}`). They sum into the voice bus and trigger automatic music/ambience ducking identically to voiceover. Because `mix.py` places each clip on the master timeline at `shot.start + at` without truncating at `shot.dur`, a multi-clause line can naturally bridge across a visual **L-cut** into the next shot—inspect clip waveform pause bounds first so the visual cut lands right inside a natural breath pause.
3. **Silent / Visual / Music-Driven Film (`"voiceover": null`):** Renders sectioned or single-mood procedural score + per-shot ambience + synchronized Foley SFX, giving the score `+4 dB` fuller presence when no speech competes in the `1–3 kHz` band.

---

## 2. Procedural Music (`audio/music.py`)

Configure either a single mood (`"music": {"mood": "wonder", "gain": -15}`) or an emotional arc across film timestamps:
```json
"music": {
  "sections": [
    { "at": 0.0,  "mood": "curious", "gain": -15 },
    { "at": 18.0, "mood": "tense",   "gain": -15 },
    { "at": 42.0, "mood": "uplift",  "gain": -14 }
  ]
}
```
Available moods: `wonder`, `curious`, `tense`, `uplift`, `action`, `somber`, `playful`, `none`. Sections crossfade smoothly over `1.2s`.

---

## 3. Procedural Ambience & 35+ Foley SFX (`audio/sfx.py`)

Audition or list effects anytime via `python kit/audio/sfx.py --list`.

- **Loopable Ambience Beds (`shot.ambience`):**
  - `roomtone` (or `room` / `interior`) — quiet interior air (`-26` to `-22 dB`)
  - `wind` — open air / hillside / dusk overlook (`-26` to `-22 dB`)
  - `city` (or `night`) — distant urban / evening hum (`-26` to `-22 dB`)
  - `rain` — light to heavy rainfall (`-22` to `-18 dB`)
  - `murmur` (or `crowd`) — public plaza / cafe background (`-25` to `-20 dB`)
  - `hum` — lab / spacecraft / server room (`-26` to `-22 dB`)
- **Action, Foley & UI Cues (`shot.sfx` — `"at"` is shot-local seconds!):**
  - *Movement & Transitions:* `swish` (`whoosh_soft`, `slide`), `whoosh`, `riser`, `slowmo`, `freeze`
  - *Impacts & Drama:* `impact` (`boom`), `hit` (`slam`), `kick` (`thud`), `stinger`, `thunder`
  - *UI & Data Reveals:* `pop`, `blip` (`ping`, `beep`), `counter`, `ding` (`chime`), `shimmer` (`sparkle`), `glitch`
  - *World & Character Foley:* `footstep` (`step`), `tick`, `clock`, `heartbeat`, `whistle`, `carpass`, `phonebuzz`, `phonering`, `cheer`, `applause`, `powerup`, `flash`, `buzz`

**Sound Placement Discipline:**
- Place **1–4 motivated cues per shot**—do not carpet-bomb every frame with whooshes.
- Sync physical SFX (`footstep`, `impact`, `pop`, `ding`) within `±0.04s` of the exact shot-local `t` where the visual contact or card reveal happens.
- Leave deliberate moments of quiet (`music` section `"mood": "none"` or sparse roomtone) before major reveals or emotional turns so impacts land with contrast.

---

## 4. Two-Pass Loudness Mastering & Subtitles

- **Two-Pass `loudnorm`:** `audio/mix.py` runs pass 1 measurement (`input_i`, `input_tp`, `input_lra`, `input_thresh`) and pass 2 `linear=true` normalization so the final mix hits `cfg.loudness` (`-14.0 LUFS` default for web/YouTube; set `-16.0` for narrative/broadcast) with `-1.5 dBTP` true-peak ceiling and zero single-pass compressor pumping.
- **Subtitle Export (`tools/export_srt.py`):** Run `python kit/tools/export_srt.py --project <dir> --vtt` whenever the film has narration, dialogue, or story captions so viewers also get clean external `.srt` / `.vtt` tracks alongside optional burned-in `storyCaption` / `captions`.
