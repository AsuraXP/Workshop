# Sound & Music Plan — Why You Never Actually Touch Anything

- **Dialogue & Voice Stem (`shot.dialogue`):**
  - `voice-00` (Narrator): warm, curious explanatory storytelling (`s01`, `s04`, `s05`, `s08`, `s09`, `s11`, `s12`), including two natural L-cuts across `s01->s02` and `s05->s06`.
  - `voice-01` (Nora): dry comedic character interjections (`s03`, `s07`, `s10`), panned slightly right (`+0.12`) to match her right-of-center screen position!
- **Procedural Music Arc (`config.json -> music.sections`):**
  - `0.0s – 20.3s`: `curious` (`-15 dB`) — light marimba/pluck pulse for the everyday mystery
  - `20.3s – 29.5s`: `wonder` (`-15 dB`) — shimmering harmonic pad in the atomic blueprint
  - `29.5s – 34.1s`: `playful` (`-15 dB`) — buoyant bounce for Nora's park-bench levitation
  - `34.1s – 49.3s`: `tense` (`-15 dB`) — deeper pulse through nerve signals & nuclear fusion warning
  - `49.3s – 66.0s`: `uplift` -> `wonder` (`-14 dB`) — warm emotional resolution on the twilight balcony
- **Motivated Ambience & Foley (`story/shots.json`):**
  - `studyRoom`: `roomtone` + `swish` (mug lift), `blip` (`0` counter), `pop` × 3 (finger pokes on oak table)
  - `macroGap` & `blueprint`: `hum` + `slowmo` (microscope dive), `ding` (`0.2 nm` caliper), `riser` (electron repulsion)
  - `parkBench`: `wind` + `footstep`, `flash`/`pop` (electrostatic high-five spark)
  - `nerveStage`: `hum` + `shimmer` (neural signal wave)
  - `fusionLab`: `hum` + `riser` -> `impact` (`t = 5.17s` exact sync on *"nuclear fusion"*), `swish` (Nora pulling hand back)
  - `twilightBalcony`: `night` + `ding` (ceramic mug clink), `shimmer` (warmth across the gap)
- **Mastering:** Two-pass linear `loudnorm` to `-14.0 LUFS` integrated, `-1.5 dBTP` ceiling, automatic `-9 dB` music ducking under speech.
