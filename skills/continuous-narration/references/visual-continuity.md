# Visual Continuity and Artifact Review

This is a required human review. Automated frame-difference, freeze, or flash checks cannot identify a malformed character or a story-level continuity error.

## Lock before production

Create a compact visual bible before drawing or generating shots:

- **Protagonist:** silhouette, head/body proportions, clothing colors, hair/hat, accessories, facing conventions, and scale.
- **Recurring threats:** zombie/creature silhouette, anatomy, palette, eye treatment, movement style, and distance from the protagonist.
- **Props:** starting state, state changes, hand/attachment points, and final state (for example, a gate bar seated in its brackets or a hatch bolt locked).
- **World:** time of day, weather, key light direction, palette, depth planes, and location-specific practical lights.
- **Camera and screen direction:** establish where the protagonist enters/exits and keep movement direction legible across cuts.

## Review each shot

Inspect at least the first, middle, and last frame of every shot, plus motion around every cut and important action. Watch the full video at normal speed and with sound.

### Character and silhouette

- Is the same protagonist recognizably the same person in every shot?
- Are head, torso, arms, hands, legs, clothing, and accessories connected and correctly placed?
- Do scale, facing, color, and proportions remain stable unless a motivated change is shown?
- Do zombies retain their design and avoid accidental merging, duplication, floating limbs, clipping, or sudden changes in size/position?
- Are silhouettes readable against each background, especially in dark scenes?

### Action and continuity

- Does each narrated action occur at the right time and in the right place?
- Do props move through plausible states? Check hands on tools, doors, latches, lights, water, animals, food, and power indicators.
- Are character counts, animal counts, and screen direction stable across the cut?
- Does the next shot inherit the previous shot's action state, or clearly establish a deliberate time/location change?
- Are danger and safety cues consistent with the story (for example, threats remain outside a barrier until the story shows how it is crossed)?

### Image and motion artifacts

- Look for frame-to-frame flicker, jitter, popping, sudden geometry changes, aliasing, incorrect occlusion, and abrupt lighting changes.
- Check scene boundaries for black flashes, unintended fades, frozen frames, or a one-frame image from the next/previous scene.
- Inspect any particle, glow, line, or camera effect over the full shot; reject effects that cut through characters or props.
- Check titles and labels at full resolution for clipping, overlap, safe margins, and legibility.

## Decision rule

Mark each category **Pass**, **Fix**, or **Not checked**. Any critical anatomy, identity, action, or continuity error is **Fix** and blocks final delivery. Rerender after repairs, then rewatch the affected shots and the complete film. Never turn a technical QA pass into a visual pass by wording alone.
