# Animation, Acting & Cinematography Principles

Every shot in Code Film Studio is a deterministic function `draw(g, t, state, info)` where **`t` is shot-local seconds (`0 .. info.dur`)** and **`info.globalT` is global film seconds**.

---

## 1. Time Discipline (Zero Frozen Shots)

1. **Always animate in shot-local `t` (`0 .. info.dur`):**
   - Correct: `const x = key(t, [[0, 320], [info.dur, 580]], ease.inOut);`
   - Wrong: passing global timestamps (`[42.0, 320]`) into `key(t, ...)`—every shot resets `t = 0` at its own cut! If converting from global word timestamps (`wordTime()`), subtract `info.start` (`const hit = (wordTime('impact', info.start) ?? (info.start + 0.8)) - info.start;`) or wrap with `localKeys(frames, info.start, info.dur)`.
2. **Motivated Camera vs Deliberate Holds:**
   - Camera motion (`cam = { x, y, z, r }`) should feel **motivated**: a slow push (`z: 1.0 -> 1.06`) into a realization, a pan following a character's walk, or a subtle handheld `shake()` on impact.
   - **Static camera holds are completely valid** for deadpan comedy beats, contemplative endings, or locked-off character acting!
   - If the camera is locked AND characters are deliberately completely motionless for `> 0.75s` (e.g., a serene final tableau or dramatic freeze), set `"hold": true` on that shot in `story/shots.json` so `tools/qa.py` knows the stillness is intentional. Otherwise, keep scenes alive with `breathe()`, `autoBlink()`, subtle `motes()`, or acting gestures.

---

## 2. Classical Animation Craft in Code

### Anticipation -> Action -> Overshoot -> Settle
Real bodies do not linearly interpolate (`lerp`) between poses at constant velocity:
- **Anticipation:** Before jumping up, crouch down (`0.2–0.3s`); before pointing right, draw slightly back; before a shocked take, brief eye-squeeze blink (`0.1s`) into wide `surprised`. Use `anticipate(t, t0, t1)` or a 3-keyframe track in `posesAt()`.
- **Overshoot & Settle:** Use `ease.outBack` or `spring(t, start, dur)` when cards pop in, arms snap to a point, or characters land from a jump.

### Continuous Facial Acting (`MC v2`)
Combine named presets (`expr: 'worry'`) with continuous float sliders so emotions **evolve inside a shot** instead of snapping abruptly:
```js
const worryK = key(t, [[0, 0], [0.5, 1, ease.out]]);
drawLead(g, {
  x: 960, y: 850, s: 1.3,
  pose: breathe(posesAt(t, [[0, 'stand'], [0.45, 'handsOnHead', ease.outBack]]), t),
  brow: lerp(0.0, 0.32, worryK),
  browTilt: lerp(0.0, -0.72, worryK),   // inner brows tilt smoothly upward
  mouth: lerp(0.2, -0.55, worryK),      // gentle smile turns into worried frown
  blink: autoBlink(t, 1),
  talk: talkAmount(info.globalT, info.start + 0.6, info.start + 2.4),
});
```

### Zero-Float Prop Attachment (`handPos` & `headPos`)
Never guess `[x + 40, y - 120]` for an object a character is holding—as soon as `breathe()`, `walkPose()`, `facing: -1`, or `s` changes, hardcoded coordinates drift off the hand!
Always query the exact world-space socket from the same options object passed to `drawFigure`:
```js
const opts = { x: 680, y: 850, s: 1.25, pose: breathe('hold', t), facing: 1 };
drawLead(g, opts);
const [hx, hy] = handPos(opts, 'F'); // exact world [x, y] of near ball hand!
```

---

## 3. Shot Scale Variety & Editing Rhythm

Vary shot scale across cuts so consecutive shots never look like duplicate mid-shots:
- **Extreme Wide / 3D Orbit (`s = 0.45..0.7` or `kind: '3d'`):** Establishes geography, scale, isolation, or crowd magnitude.
- **Medium / Two-Shot (`s = 1.1..1.35`):** Conversation, physical acting, in-world interaction.
- **Close-Up (`bigFace` with `r = 140..190`):** Emotional turns, deadpan comedic reactions, realizations.
- **Insert / Visual Metaphor / Schematic (`blueprint`, `dataCard`, `compareBars`, prop macro):** Clarifies a mechanism, clue, or quantitative leap.

**Pacing by Genre:**
- *Explainer / Essay:* Average `2.5–5.0s` per shot; cut on sentence boundaries or conceptual turns; sync visual reveals (`wordTime()`) within `±0.1s` of the spoken keyword.
- *Comedy:* Crisp cuts (`1.5–3.5s`) juxtaposed with unhurried deadpan reaction holds (`hold: true`).
- *Narrative Drama / Horror:* Let atmosphere and silence breathe (`3.5–8.0s` shots); cut on glances, gestures, and sound cues.
