# Frame-Decoded QA, Critic Rubric & Honest Delivery

Never deliver a video blindly from code alone. A shot that compiles without syntax errors can still have overlapping labels, floating props, broken shot-local `t` keyframes, unintended frozen tails, or clipped audio.

---

## 1. Automated Full-Video QA (`tools/qa.py`)

After rendering `<project>/exports/preview.mp4` or `<project>/exports/final.mp4`, always run:
```bash
python <KIT>/tools/qa.py --project <project>
```
`qa.py` decodes **every single frame** of the rendered MP4 in `O(1)` streaming memory and outputs:
- `<project>/qa/overview.jpg` — true-aspect film overview (one midpoint frame per shot)
- `<project>/qa/<shot_id>.jpg` — 8-frame motion strip across each individual shot so you can visually verify intra-shot movement, transitions, and text legibility
- `<project>/qa/report.json` — structured metrics:
  1. **Stream & Duration Match:** Verifies decoded frame count, dimensions, FPS, and duration against `story/shots.json` (`±0.35s` tolerance).
  2. **Freeze & Pop Detection:** Measures both whole-frame MAD and active-region `p99.5` frame deltas so localized character acting (blinking, talking, hand gestures on a locked camera) passes cleanly while accidental dead freezes (`>= 0.75s` without `"hold": true`) and mid-shot discontinuities (`MAD > 36`) are flagged.
  3. **Whole-Film Luminance Flash Screen:** Flags `> 3` opposing `>= 10%` mean-luminance jumps inside any rolling `1.0s` window across the entire film (including across cuts). *(Note: automated screening heuristic, not certified medical Harding/Ofcom PSE testing.)*
  4. **Loudness & Peak Verification:** Confirms audio stream presence, integrated LUFS within `±2.5 LU` of `cfg.loudness`, and true peak `<= -0.5 dBTP`.

---

## 2. Visual Inspection & The 8-Category Critic Rubric

Inspect `qa/overview.jpg` and representative `qa/<shot_id>.jpg` sheets visually using your image-reading tool, then score the film honestly in `<project>/production/qa.md` (`0–4` per category, `32` max):

| # | Category | What a `4/4` Looks Like | Automatic Defect Triggers (`<= 2`) |
|---|----------|-------------------------|------------------------------------|
| 1 | **Story & Clarity** | Premise, turn, and resolution read clearly even on first watch; every shot has one clear job. | Confusing jump in logic; decorative filler shot with no narrative/explanatory point. |
| 2 | **Visual Design & Contrast** | `MC v2` heads & cream features pop cleanly against backgrounds; cohesive `style` + `mood()`. | Black head merges into dark background shape; clashing un-themed hex colors; text overlapping characters. |
| 3 | **Composition & Camera** | Varied shot scales (wide / medium / `bigFace` / insert); motivated camera moves & holds; 9:16/16:9 safe zones respected. | 3+ identical mid-shots in a row; clipped text or limbs at frame edge. |
| 4 | **Animation & Acting** | Shot-local `t` (`0..dur`); expressive brow/mouth evolution; `breathe()`/`autoBlink()`; `handPos()` locked props. | Unintended frozen tail; floating/drifting held prop; robotic linear snap without easing. |
| 5 | **Continuity** | Consistent coat colors, 180° screen geography, persistent prop states, and world-space `rim.dir`. | Character flips sides mid-conversation; coat or prop vanishes across a cut; rim light jumps sides unmotivated. |
| 6 | **Sound & Music** | Motivated score arc, clean ducking under speech, crisp Foley synced to `t`, two-pass LUFS on target. | Missing `build/mix.wav`; SFX out of sync with visual hit; music drowning speech. |
| 7 | **Edit & Pacing** | Cuts land on ideas, breaths, or beats; transitions (`cut`, `dissolve`, `fadeBlack`) feel earned. | Rushed unreadable data cards (`< 1.8s`); dead air at shot ends. |
| 8 | **Captions & Accessibility** | Clean safe-area `storyCaption`/`captions` when used; `.srt` exported when speech/captions exist; no unsafe strobe flashes. | Overlapping burned captions + UI cards; `qa.py` flash warning left unresolved. |

### Release Threshold
- **Target:** Total **`>= 24 / 32`**, with **no category below `2`**, **zero `qa.py` errors**, and **zero unresolved `qa.py` warnings**.
- If any defect is **Critical** (broken render, missing audio, unreadable overlapping text, unintended freeze, broken continuity) or **Major**, fix the specific shot module(s) or mix, re-render, and re-run `qa.py` before delivering.
- Report QA results and any limitations (e.g., synthetic timing vs live voiceover, screening flash check) transparently to the user.
