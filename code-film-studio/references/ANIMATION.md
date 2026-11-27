# Animation and cinematography

## Timing
- Keys are shot-local seconds. Use `local(absolute_keys, shot_start, duration)`; it rejects keys outside the shot.
- Ease major moves. Hold 0.1–0.2 s before anticipation and after settle.
- Anticipation: small opposite move. Action: clear peak. Follow-through: overshoot then settle.
- Lead body part moves first; head/scarf/hair follow 2–4 frames later.
- Discrete changes (lights, text, tally) fade over 0.2–0.4 s unless a hard snap is intended.

## Rig
- `studio.rig.rig(character, pose, t)` returns SVG. Pose fields may be constants or tracks.
- Angles: 0° points down, 90° right, 180° up. `facing=-1` mirrors.
- Feet rest near y+100*scale. Keep ground contact unless jumping/falling.
- Use `hand_position(pose,t)` to attach props. Never eyeball a prop onto a moving hand.
- Every character has an independent timeline. Mirrors/echoes use delayed copies, not the same track by accident.
- Walk: use `apply_walk(pose,cycles,start,end,stride,bob,swing)`; eight poses per cycle. Add horizontal/vertical root motion separately.
- Expression: brow positive = worried, negative = determined; mouth positive = smile, negative = sad; blink 0..1; head_tilt and lean carry weight.

## Acting beats
- Hope: upright, chin up, free arms.
- Sad/tired: forward lean, lowered head, hanging arms.
- Defeat: slump, seated/kneeling, hands near head or limp.
- Fear: lean away, arms protective.
- Determination: square torso, brow negative, fists/reach forward.
- Effort: reach toward object, lean in, smaller steps.
- Rebuild: first action small, then larger.

## Camera
- Camera `cx,cy` is the world point at screen centre; `zoom` scales about that centre.
- `push(cx,cy,z0,z1,duration)` creates a smooth push. Keep moves small unless motivated.
- Wide: lead 30–45% frame height. Close: face/expression ≥60% of the focal area.
- Enter from fully off-screen, not popping at the edge.
- Do not let a reaching arm cross the face in close-up; adjust arm angle or camera.

## Motion QA
Stills are insufficient. Decode every frame and inspect per-shot sheets. Metrics flag candidates, not truth:
- JUMP candidate: within-shot frame difference > max(18, 5×mean).
- STALL: low motion; acceptable only if labelled a deliberate hold.
- FLICKER: rapid luminance swings; heuristic only.
A reviewer must still judge arcs, intersections, weight, expression and intent.
